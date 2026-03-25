import { adapterFactory } from '../adapters/index.js';
import { CONFIG } from '../config/index.js';
import { RequestQueue } from './request-queue.js';
import { ResponseCache } from './response-cache.js';
import { HealthMonitor } from './health-monitor.js';

/**
 * LLM Service
 * Unified service for interacting with any LLM provider via adapters.
 * Delegates request lifecycle (concurrency, dedup, retry) to RequestQueue.
 * Caches responses via ResponseCache to avoid redundant LLM calls.
 * Monitors provider health and auto-failovers via HealthMonitor.
 */
export class LLMService {
  constructor(config = CONFIG) {
    this.config = config;
    this.adapter = null;
    this.requestQueue = new RequestQueue(config);
    this.responseCache = new ResponseCache(config);
    this.healthMonitor = new HealthMonitor(config);
    this.initializeAdapter();
    this._setupHealthMonitor();
  }

  /**
   * Wire up the health monitor to perform auto-failover.
   */
  _setupHealthMonitor() {
    this.healthMonitor.onFailover((newProvider, oldProvider, reason) => {
      this.switchProvider(newProvider);
    });
  }

  /**
   * Start health monitoring (call after transport is connected).
   */
  startHealthMonitor() {
    this.healthMonitor.start();
  }

  /**
   * Stop health monitoring (call on shutdown).
   */
  stopHealthMonitor() {
    this.healthMonitor.stop();
  }

  /**
   * Initialize the adapter based on configuration
   */
  initializeAdapter() {
    try {
      const provider = this.config.LLM_PROVIDER || 'ollama';
      this.adapter = adapterFactory.createAdapter(provider, this.config);
    } catch (error) {
      // Fallback to Ollama if configured provider fails
      if (this.config.LLM_PROVIDER !== 'ollama') {
        this.adapter = adapterFactory.createAdapter('ollama', this.config);
      } else {
        throw error;
      }
    }
  }

  /**
   * Get list of available models
   */
  async getAvailableModels() {
    if (!this.adapter) {
      throw new Error('Adapter not initialized');
    }
    return await this.adapter.getAvailableModels();
  }

  /**
   * Call the LLM chat API with cache-first lookup, then request queue.
   * Flow: cache check → queue (concurrency, dedup, retry) → cache store.
   */
  async callChat(payload) {
    if (!this.adapter) {
      throw new Error('Adapter not initialized');
    }

    // Check cache first
    const cached = this.responseCache.get(payload);
    if (cached) return cached;

    // Execute through queue, then cache the result
    const result = await this.requestQueue.enqueue(
      (p) => this.adapter.callChat(p),
      payload
    );

    this.responseCache.set(payload, result);
    return result;
  }

  /**
   * Call the LLM chat API directly, bypassing the request queue.
   * Use for health checks or internal calls that should not be queued.
   */
  async callChatDirect(payload) {
    if (!this.adapter) {
      throw new Error('Adapter not initialized');
    }
    return await this.adapter.callChat(payload);
  }

  /**
   * Get request queue metrics
   */
  getQueueMetrics() {
    return this.requestQueue.getMetrics();
  }

  /**
   * Get request queue status
   */
  getQueueStatus() {
    return this.requestQueue.getQueueStatus();
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics() {
    return this.responseCache.getMetrics();
  }

  /**
   * Clear the response cache. Returns the number of entries cleared.
   */
  clearCache() {
    return this.responseCache.clear();
  }

  /**
   * Get health status for all providers
   */
  getHealthStatus() {
    return this.healthMonitor.getStatus();
  }

  /**
   * Get health monitor metrics
   */
  getHealthMetrics() {
    return this.healthMonitor.getMetrics();
  }

  /**
   * Get current provider name
   */
  getProviderName() {
    return this.adapter ? this.adapter.getProviderName() : 'unknown';
  }

  /**
   * Switch to a different provider
   */
  switchProvider(providerName, config = null) {
    const newConfig = config || this.config;
    this.adapter = adapterFactory.createAdapter(providerName, newConfig);
    this.config.LLM_PROVIDER = providerName;
  }

  /**
   * Get default model for current provider
   */
  getDefaultModel() {
    if (!this.adapter) {
      return this.config.DEFAULT_MODEL || 'default';
    }
    return this.adapter.getDefaultModel();
  }
}
