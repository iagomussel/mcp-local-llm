// Internal imports - adapters should only be imported here
import { 
  OllamaAdapter, 
  OpenAIAdapter, 
  AnthropicAdapter, 
  GeminiAdapter 
} from './internal.js';
import { ERROR_MESSAGES } from './common-constants.js';

const ERRORS = ERROR_MESSAGES;

/**
 * Adapter Factory
 * Creates and manages LLM adapter instances
 */
export class AdapterFactory {
  constructor() {
    this.adapters = new Map();
    this.registeredAdapters = new Map([
      ['ollama', OllamaAdapter],
      ['openai', OpenAIAdapter],
      ['anthropic', AnthropicAdapter],
      ['gemini', GeminiAdapter],
    ]);
  }

  /**
   * Register a new adapter class
   * @param {string} name - Adapter name (e.g., 'ollama', 'openai')
   * @param {Class} AdapterClass - Adapter class extending BaseAdapter
   */
  registerAdapter(name, AdapterClass) {
    this.registeredAdapters.set(name.toLowerCase(), AdapterClass);
  }

  /**
   * Create an adapter instance
   * @param {string} providerName - Provider name ('ollama', 'openai', 'anthropic')
   * @param {Object} config - Configuration object
   * @returns {BaseAdapter} Adapter instance
   */
  createAdapter(providerName, config) {
    const normalizedName = providerName.toLowerCase();
    
    // Check cache first
    const cacheKey = `${normalizedName}-${JSON.stringify(config)}`;
    if (this.adapters.has(cacheKey)) {
      return this.adapters.get(cacheKey);
    }

    // Get adapter class
    const AdapterClass = this.registeredAdapters.get(normalizedName);
    if (!AdapterClass) {
      const available = Array.from(this.registeredAdapters.keys());
      throw new Error(ERRORS.UNKNOWN_ADAPTER(providerName, available));
    }

    // Create instance
    const adapter = new AdapterClass(config);
    
    // Validate configuration
    try {
      adapter.validateConfig();
    } catch (error) {
      throw new Error(ERRORS.INVALID_CONFIG(providerName, error.message));
    }

    // Cache adapter
    this.adapters.set(cacheKey, adapter);
    
    return adapter;
  }

  /**
   * Get list of registered adapter names
   * @returns {string[]} Array of adapter names
   */
  getAvailableAdapters() {
    return Array.from(this.registeredAdapters.keys());
  }

  /**
   * Clear adapter cache
   */
  clearCache() {
    this.adapters.clear();
  }
}

// Singleton instance
export const adapterFactory = new AdapterFactory();
