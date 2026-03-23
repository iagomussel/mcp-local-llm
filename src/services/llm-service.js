import { adapterFactory } from '../adapters/index.js';
import { CONFIG } from '../config/index.js';
import { RequestQueue } from './request-queue.js';

/**
 * LLM Service
 * Unified service for interacting with any LLM provider via adapters.
 * Delegates request lifecycle (concurrency, dedup, retry) to RequestQueue.
 */
export class LLMService {
  constructor(config = CONFIG) {
    this.config = config;
    this.adapter = null;
    this.requestQueue = new RequestQueue(config);
    this.initializeAdapter();
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
   * Call the LLM chat API through the request queue.
   * Provides concurrency control, deduplication, and retry.
   */
  async callChat(payload) {
    if (!this.adapter) {
      throw new Error('Adapter not initialized');
    }
    return await this.requestQueue.enqueue(
      (p) => this.adapter.callChat(p),
      payload
    );
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
