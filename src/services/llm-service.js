import { adapterFactory } from '../adapters/index.js';
import { CONFIG } from '../config/index.js';

/**
 * LLM Service
 * Unified service for interacting with any LLM provider via adapters
 */
export class LLMService {
  constructor(config = CONFIG) {
    this.config = config;
    this.adapter = null;
    this.initializeAdapter();
  }

  /**
   * Initialize the adapter based on configuration
   */
  initializeAdapter() {
    try {
      const provider = this.config.LLM_PROVIDER || 'ollama';
      this.adapter = adapterFactory.createAdapter(provider, this.config);
      // Don't log during initialization - it interferes with MCP protocol
    } catch (error) {
      console.error(`[MCP] Failed to initialize adapter: ${error.message}`);
      // Fallback to Ollama if configured provider fails
      if (this.config.LLM_PROVIDER !== 'ollama') {
        console.error('[MCP] Falling back to Ollama');
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
   * Call the LLM chat API
   */
  async callChat(payload) {
    if (!this.adapter) {
      throw new Error('Adapter not initialized');
    }
    return await this.adapter.callChat(payload);
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
