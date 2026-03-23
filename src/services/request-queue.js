import { CONFIG } from '../config/index.js';

/**
 * Request Queue Service
 * Manages LLM request lifecycle with concurrency control, deduplication,
 * retry logic, and metrics tracking.
 *
 * Follows the Service pattern established by LLMService and ModelSelector.
 */
export class RequestQueue {
  constructor(config = CONFIG) {
    this.config = config;
    this.maxConcurrent = parseInt(config.QUEUE_MAX_CONCURRENT) || 3;
    this.maxRetries = parseInt(config.QUEUE_MAX_RETRIES) || 2;
    this.retryBaseDelay = parseInt(config.QUEUE_RETRY_DELAY_MS) || 1000;
    this.deduplicationTTL = parseInt(config.QUEUE_DEDUP_TTL_MS) || 30000;

    // Active state
    this.activeRequests = 0;
    this.pendingQueue = [];
    this.inflightMap = new Map(); // key -> Promise (for deduplication)

    // Metrics
    this.metrics = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      deduplicatedRequests: 0,
      retriedRequests: 0,
      totalLatencyMs: 0,
      peakConcurrent: 0,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Generate a stable key from a request payload for deduplication.
   * Identical payloads within the TTL window return the same in-flight promise.
   */
  _makeKey(payload) {
    const { model, messages, temperature, max_tokens } = payload;
    const msgKey = JSON.stringify(messages);
    return `${model}|${temperature}|${max_tokens}|${msgKey}`;
  }

  /**
   * Enqueue a request. Returns a promise that resolves with the LLM response.
   *
   * @param {Function} executeFn - Async function that performs the actual LLM call
   * @param {Object} payload - The request payload (used for dedup key)
   * @returns {Promise<Object>} The LLM response
   */
  async enqueue(executeFn, payload) {
    this.metrics.totalRequests++;
    const key = this._makeKey(payload);

    // Deduplication: if an identical request is already in-flight, reuse it
    if (this.inflightMap.has(key)) {
      this.metrics.deduplicatedRequests++;
      return this.inflightMap.get(key);
    }

    const promise = this._scheduleExecution(executeFn, payload, key);
    this.inflightMap.set(key, promise);

    // Clean up dedup entry after TTL (swallow rejection to avoid unhandledRejection)
    promise.then(
      () => setTimeout(() => this.inflightMap.delete(key), this.deduplicationTTL),
      () => this.inflightMap.delete(key),
    );

    return promise;
  }

  /**
   * Schedule execution respecting concurrency limits.
   */
  _scheduleExecution(executeFn, payload, key) {
    return new Promise((resolve, reject) => {
      const task = { executeFn, payload, key, resolve, reject };

      if (this.activeRequests < this.maxConcurrent) {
        this._executeTask(task);
      } else {
        this.pendingQueue.push(task);
      }
    });
  }

  /**
   * Execute a task with retry logic.
   */
  async _executeTask(task) {
    this.activeRequests++;
    this.metrics.peakConcurrent = Math.max(this.metrics.peakConcurrent, this.activeRequests);
    const startTime = Date.now();

    try {
      const result = await this._executeWithRetry(task.executeFn, task.payload);
      const latency = Date.now() - startTime;
      this.metrics.completedRequests++;
      this.metrics.totalLatencyMs += latency;
      task.resolve(result);
    } catch (error) {
      this.metrics.failedRequests++;
      task.reject(error);
    } finally {
      this.activeRequests--;
      this._processNext();
    }
  }

  /**
   * Execute with exponential backoff retry.
   */
  async _executeWithRetry(executeFn, payload, attempt = 0) {
    try {
      return await executeFn(payload);
    } catch (error) {
      if (attempt < this.maxRetries && this._isRetryable(error)) {
        this.metrics.retriedRequests++;
        const delay = this.retryBaseDelay * Math.pow(2, attempt);
        await this._sleep(delay);
        return this._executeWithRetry(executeFn, payload, attempt + 1);
      }
      throw error;
    }
  }

  /**
   * Determine if an error is retryable.
   * Network errors and 5xx responses are retryable; 4xx are not.
   */
  _isRetryable(error) {
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
      return true;
    }
    const status = error.response?.status || error.status;
    if (status && status >= 500) return true;
    if (status && status >= 400 && status < 500) return false;
    // Network errors without status codes are retryable
    return !status;
  }

  /**
   * Process the next pending task from the queue.
   */
  _processNext() {
    if (this.pendingQueue.length > 0 && this.activeRequests < this.maxConcurrent) {
      const next = this.pendingQueue.shift();
      this._executeTask(next);
    }
  }

  /**
   * Get current metrics snapshot.
   */
  getMetrics() {
    const avgLatency = this.metrics.completedRequests > 0
      ? Math.round(this.metrics.totalLatencyMs / this.metrics.completedRequests)
      : 0;

    return {
      ...this.metrics,
      avgLatencyMs: avgLatency,
      activeRequests: this.activeRequests,
      pendingRequests: this.pendingQueue.length,
      inflightKeys: this.inflightMap.size,
      uptime: this._getUptime(),
    };
  }

  /**
   * Reset metrics counters.
   */
  resetMetrics() {
    this.metrics = {
      totalRequests: 0,
      completedRequests: 0,
      failedRequests: 0,
      deduplicatedRequests: 0,
      retriedRequests: 0,
      totalLatencyMs: 0,
      peakConcurrent: 0,
      startedAt: new Date().toISOString(),
    };
  }

  /**
   * Get queue size info.
   */
  getQueueStatus() {
    return {
      active: this.activeRequests,
      pending: this.pendingQueue.length,
      maxConcurrent: this.maxConcurrent,
    };
  }

  _getUptime() {
    const started = new Date(this.metrics.startedAt);
    const now = new Date();
    const diffMs = now - started;
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
