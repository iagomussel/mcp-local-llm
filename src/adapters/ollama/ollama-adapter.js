import axios from 'axios';
import { BaseAdapter } from '../base-adapter.js';
import { OLLAMA_CONSTANTS } from './ollama-constants.js';
import { COMMON_CONSTANTS, ERROR_MESSAGES } from '../common-constants.js';

const CONSTANTS = OLLAMA_CONSTANTS;
const COMMON = COMMON_CONSTANTS;
const ERRORS = ERROR_MESSAGES;

// Export constants for external use
export { OLLAMA_CONSTANTS };

/**
 * Ollama Adapter
 * Implements LLM adapter for Ollama local models
 */
export class OllamaAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.baseUrl = config.OLLAMA_URL || CONSTANTS.DEFAULT_URL;
  }

  /**
   * Validate Ollama configuration
   */
  validateConfig() {
    if (!this.baseUrl) {
      throw new Error(ERRORS.API_KEY_REQUIRED('ollama').replace('API_KEY', 'OLLAMA_URL'));
    }
    return true;
  }

  /**
   * Get list of available models from Ollama
   */
  async getAvailableModels() {
    try {
      const response = await axios.get(
        `${this.baseUrl}${CONSTANTS.API_ENDPOINTS.MODELS}`,
        {
          timeout: CONSTANTS.TIMEOUT,
        }
      );
      const modelsData = response.data?.models || [];
      
      if (Array.isArray(modelsData)) {
        return modelsData.map(model => model.name).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('[MCP] Failed to get available models from Ollama:', error.message);
      return [];
    }
  }

  /**
   * Call Ollama chat API
   */
  async callChat(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}${CONSTANTS.API_ENDPOINTS.CHAT}`,
        {
          model: payload.model || this.getDefaultModel(),
          messages: payload.messages,
          stream: false,
          options: {
            temperature: payload.temperature ?? this.config.TEMPERATURE ?? COMMON.DEFAULT_TEMPERATURE,
            num_predict: payload.max_tokens ?? this.config.MAX_TOKENS ?? COMMON.DEFAULT_MAX_TOKENS,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: CONSTANTS.TIMEOUT,
        }
      );

      // Transform Ollama response to standardized format
      const ollamaResponse = response.data;
      return this.transformResponse({
        content: ollamaResponse.message?.content || '',
        role: ollamaResponse.message?.role || 'assistant',
      });
    } catch (error) {
      console.error('[MCP] Error calling Ollama:', error.message);
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`${ERRORS.SERVICE_UNAVAILABLE('Ollama')} at ${this.baseUrl}`);
      }
      throw new Error(`${ERRORS.REQUEST_FAILED('Ollama')}: ${error.message}`);
    }
  }

  /**
   * Transform Ollama response to standardized format
   */
  transformResponse(response) {
    return {
      choices: [{
        message: {
          content: response.content || '',
          role: response.role || 'assistant',
        },
      }],
    };
  }

  /**
   * Get default model for Ollama
   */
  getDefaultModel() {
    return this.config.DEFAULT_MODEL || CONSTANTS.DEFAULT_MODEL;
  }
}
