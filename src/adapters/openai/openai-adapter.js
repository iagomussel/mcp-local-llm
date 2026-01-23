import axios from 'axios';
import { BaseAdapter } from '../base-adapter.js';
import { OPENAI_CONSTANTS } from './openai-constants.js';
import { COMMON_CONSTANTS, ERROR_MESSAGES } from '../common-constants.js';

const CONSTANTS = OPENAI_CONSTANTS;
const COMMON = COMMON_CONSTANTS;
const ERRORS = ERROR_MESSAGES;

// Export constants for external use
export { OPENAI_CONSTANTS };

/**
 * OpenAI Adapter
 * Implements LLM adapter for OpenAI API
 */
export class OpenAIAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    this.baseUrl = config.OPENAI_BASE_URL || CONSTANTS.DEFAULT_BASE_URL;
  }

  /**
   * Validate OpenAI configuration
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new Error(ERRORS.API_KEY_REQUIRED('openai'));
    }
    return true;
  }

  /**
   * Get list of available models from OpenAI
   */
  async getAvailableModels() {
    try {
      const response = await axios.get(
        `${this.baseUrl}${CONSTANTS.API_ENDPOINTS.MODELS}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
          },
          timeout: CONSTANTS.TIMEOUT,
        }
      );

      // Filter for chat models only
      const models = response.data?.data || [];
      return models
        .filter(model => model.id.includes('gpt'))
        .map(model => model.id)
        .sort();
    } catch (error) {
      console.error('[MCP] Failed to get available models from OpenAI:', error.message);
      return [CONSTANTS.DEFAULT_MODEL, 'gpt-4']; // Fallback to common models
    }
  }

  /**
   * Call OpenAI chat API
   */
  async callChat(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}${CONSTANTS.API_ENDPOINTS.CHAT}`,
        {
          model: payload.model || this.getDefaultModel(),
          messages: payload.messages,
          temperature: payload.temperature ?? this.config.TEMPERATURE ?? COMMON.DEFAULT_TEMPERATURE,
          max_tokens: payload.max_tokens ?? this.config.MAX_TOKENS ?? COMMON.DEFAULT_MAX_TOKENS,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            ...CONSTANTS.HEADERS,
          },
          timeout: CONSTANTS.TIMEOUT,
        }
      );

      // OpenAI already uses standardized format
      return response.data;
    } catch (error) {
      console.error('[MCP] Error calling OpenAI:', error.message);
      if (error.response?.status === 401) {
        throw new Error(ERRORS.INVALID_API_KEY('OpenAI'));
      }
      if (error.response?.status === 429) {
        throw new Error(ERRORS.RATE_LIMIT_EXCEEDED('OpenAI'));
      }
      throw new Error(`${ERRORS.REQUEST_FAILED('OpenAI')}: ${error.message}`);
    }
  }

  /**
   * Get default model for OpenAI
   */
  getDefaultModel() {
    return this.config.DEFAULT_MODEL || CONSTANTS.DEFAULT_MODEL;
  }
}
