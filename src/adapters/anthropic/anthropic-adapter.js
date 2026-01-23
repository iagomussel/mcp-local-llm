import axios from 'axios';
import { BaseAdapter } from '../base-adapter.js';
import { ANTHROPIC_CONSTANTS } from './anthropic-constants.js';
import { COMMON_CONSTANTS, ERROR_MESSAGES } from '../common-constants.js';

const CONSTANTS = ANTHROPIC_CONSTANTS;
const COMMON = COMMON_CONSTANTS;
const ERRORS = ERROR_MESSAGES;

// Export constants for external use
export { ANTHROPIC_CONSTANTS };

/**
 * Anthropic Adapter
 * Implements LLM adapter for Anthropic Claude API
 */
export class AnthropicAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY;
    this.baseUrl = config.ANTHROPIC_BASE_URL || CONSTANTS.DEFAULT_BASE_URL;
  }

  /**
   * Validate Anthropic configuration
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new Error(ERRORS.API_KEY_REQUIRED('anthropic'));
    }
    return true;
  }

  /**
   * Get list of available models from Anthropic
   */
  async getAvailableModels() {
    // Anthropic doesn't have a models endpoint, return known models
    return CONSTANTS.MODELS;
  }

  /**
   * Call Anthropic messages API
   */
  async callChat(payload) {
    try {
      const response = await axios.post(
        `${this.baseUrl}${CONSTANTS.API_ENDPOINTS.MESSAGES}`,
        {
          model: payload.model || this.getDefaultModel(),
          messages: payload.messages,
          temperature: payload.temperature ?? this.config.TEMPERATURE ?? COMMON.DEFAULT_TEMPERATURE,
          max_tokens: payload.max_tokens ?? this.config.MAX_TOKENS ?? COMMON.DEFAULT_MAX_TOKENS,
        },
        {
          headers: {
            'x-api-key': this.apiKey,
            [CONSTANTS.HEADERS.VERSION_HEADER]: CONSTANTS.API_VERSION,
            ...CONSTANTS.HEADERS,
          },
          timeout: CONSTANTS.TIMEOUT,
        }
      );

      // Transform Anthropic response to standardized format
      return this.transformResponse(response.data);
    } catch (error) {
      console.error('[MCP] Error calling Anthropic:', error.message);
      if (error.response?.status === 401) {
        throw new Error(ERRORS.INVALID_API_KEY('Anthropic'));
      }
      if (error.response?.status === 429) {
        throw new Error(ERRORS.RATE_LIMIT_EXCEEDED('Anthropic'));
      }
      throw new Error(`${ERRORS.REQUEST_FAILED('Anthropic')}: ${error.message}`);
    }
  }

  /**
   * Transform Anthropic response to standardized format
   */
  transformResponse(response) {
    // Anthropic returns content as an array of content blocks
    const content = response.content
      .map(block => block.text)
      .join('');

    return {
      choices: [{
        message: {
          content: content,
          role: 'assistant',
        },
      }],
    };
  }

  /**
   * Get default model for Anthropic
   */
  getDefaultModel() {
    return this.config.DEFAULT_MODEL || CONSTANTS.DEFAULT_MODEL;
  }
}
