/**
 * Base LLM Adapter
 * Abstract interface that all LLM providers must implement
 */
export class BaseAdapter {
  constructor(config) {
    if (this.constructor === BaseAdapter) {
      throw new Error('BaseAdapter is abstract and cannot be instantiated directly');
    }
    this.config = config;
    this.providerName = this.constructor.name.replace('Adapter', '').toLowerCase();
  }

  /**
   * Get provider name
   */
  getProviderName() {
    return this.providerName;
  }

  /**
   * Get list of available models
   * Must be implemented by subclasses
   * @returns {Promise<string[]>} Array of model names
   */
  async getAvailableModels() {
    throw new Error('getAvailableModels() must be implemented by adapter subclass');
  }

  /**
   * Call the LLM chat API
   * Must be implemented by subclasses
   * @param {Object} payload - Request payload
   * @param {string} payload.model - Model name
   * @param {Array} payload.messages - Array of message objects
   * @param {number} payload.temperature - Temperature setting
   * @param {number} payload.max_tokens - Maximum tokens
   * @returns {Promise<Object>} Response in standardized format
   */
  async callChat(payload) {
    throw new Error('callChat() must be implemented by adapter subclass');
  }

  /**
   * Validate adapter configuration
   * Can be overridden by subclasses for provider-specific validation
   * @returns {boolean} True if configuration is valid
   */
  validateConfig() {
    return true;
  }

  /**
   * Get default model for this provider
   * Can be overridden by subclasses
   * @returns {string} Default model name
   */
  getDefaultModel() {
    return this.config.DEFAULT_MODEL || 'default';
  }

  /**
   * Transform provider-specific response to standardized format
   * Can be overridden by subclasses if needed
   * @param {Object} response - Provider-specific response
   * @returns {Object} Standardized response format
   */
  transformResponse(response) {
    // Default transformation - assumes OpenAI-like format
    return {
      choices: [{
        message: {
          content: response.content || response.text || '',
          role: response.role || 'assistant',
        },
      }],
    };
  }
}
