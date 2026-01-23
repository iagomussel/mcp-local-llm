import axios from 'axios';
import { BaseAdapter } from '../base-adapter.js';
import { GEMINI_CONSTANTS } from './gemini-constants.js';
import { COMMON_CONSTANTS, ERROR_MESSAGES } from '../common-constants.js';

const CONSTANTS = GEMINI_CONSTANTS;
const COMMON = COMMON_CONSTANTS;
const ERRORS = ERROR_MESSAGES;

// Export constants for external use
export { GEMINI_CONSTANTS };

/**
 * Google Gemini Adapter
 * Implements LLM adapter for Google Gemini API
 */
export class GeminiAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    this.baseUrl = config.GEMINI_BASE_URL || CONSTANTS.DEFAULT_BASE_URL;
    console.log(`[MCP] Gemini Adapter initialized with model: ${this.getDefaultModel()}`);
  }

  /**
   * Validate Gemini configuration
   */
  validateConfig() {
    if (!this.apiKey) {
      throw new Error(ERRORS.API_KEY_REQUIRED('gemini'));
    }
    return true;
  }

  /**
   * Get list of available models from Gemini
   */
  async getAvailableModels() {
    try {
      const headers = {
        'Content-Type': CONSTANTS.HEADERS.CONTENT_TYPE,
        'x-goog-api-key': this.apiKey,
      };

      const response = await axios.get(
        `${this.baseUrl}${CONSTANTS.API_ENDPOINTS.MODELS}`,
        {
          headers,
          timeout: CONSTANTS.TIMEOUT,
        }
      );

      const models = response.data?.models || [];
      return models
        .filter(model => CONSTANTS.MODELS.includes(model.name))
        .map(model => model.name)
        .sort();
    } catch (error) {
      console.error('[MCP] Failed to get available models from Gemini:', error.message);
      // Return known models as fallback
      return CONSTANTS.MODELS;
    }
  }

  /**
   * Call Gemini generateContent API
   */
  async callChat(payload) {
    try {
      const model = payload.model || this.getDefaultModel();
      // Ensure model name doesn't include 'models/' prefix
      const cleanModel = model.replace(/^models\//, '');
      const endpoint = CONSTANTS.API_ENDPOINTS.GENERATE_CONTENT.replace('{model}', cleanModel);
      const url = `${this.baseUrl}${endpoint}`;
      
      // Transform messages to Gemini format
      const contents = this.transformMessagesToGeminiFormat(payload.messages);

      // Build headers with API key (Gemini uses x-goog-api-key header)
      const headers = {
        'Content-Type': CONSTANTS.HEADERS.CONTENT_TYPE,
        'x-goog-api-key': this.apiKey,
      };

      const requestBody = {
        contents: contents,
        generationConfig: {
          temperature: payload.temperature ?? this.config.TEMPERATURE ?? COMMON.DEFAULT_TEMPERATURE,
          maxOutputTokens: payload.max_tokens ?? this.config.MAX_TOKENS ?? COMMON.DEFAULT_MAX_TOKENS,
        },
      };

      // Always log URL and model for debugging (stderr won't interfere with MCP protocol)
      console.error(`[MCP] Gemini API Request: ${url}`);
      console.error(`[MCP] Gemini Model: ${cleanModel}`);
      
      // Detailed logging only if DEBUG env var is set
      if (process.env.DEBUG === 'true') {
        console.error(`[MCP] Gemini Request Body: ${JSON.stringify(requestBody, null, 2)}`);
      }

      const response = await axios.post(
        url,
        requestBody,
        {
          headers,
          timeout: CONSTANTS.TIMEOUT,
        }
      );

      // Transform Gemini response to standardized format
      return this.transformResponse(response.data);
    } catch (error) {
      console.error('[MCP] Error calling Gemini:', error.message);
      if (error.response) {
        console.error('[MCP] Gemini API Response Status:', error.response.status);
        console.error('[MCP] Gemini API Response Data:', JSON.stringify(error.response.data, null, 2));
        console.error('[MCP] Gemini API Request URL:', error.config?.url);
        console.error('[MCP] Gemini API Request Headers:', JSON.stringify(error.config?.headers, null, 2));
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(ERRORS.INVALID_API_KEY('Gemini'));
      }
      if (error.response?.status === 404) {
        const model = payload.model || this.getDefaultModel();
        const cleanModel = model.replace(/^models\//, '');
        throw new Error(`Gemini API endpoint not found. URL: ${error.config?.url || url}, Model: ${cleanModel}. Check if model name is correct.`);
      }
      if (error.response?.status === 429) {
        throw new Error(ERRORS.RATE_LIMIT_EXCEEDED('Gemini'));
      }
      if (error.code === 'ECONNREFUSED') {
        throw new Error(ERRORS.SERVICE_UNAVAILABLE('Gemini'));
      }
      throw new Error(`${ERRORS.REQUEST_FAILED('Gemini')}: ${error.message}`);
    }
  }

  /**
   * Transform messages to Gemini format
   * Gemini uses a different message format with 'parts' array
   * Format: contents array with objects containing role and parts
   * Note: For single-turn conversations, role can be omitted
   */
  transformMessagesToGeminiFormat(messages) {
    // Filter out system messages as Gemini doesn't support them directly
    const filteredMessages = messages.filter(msg => msg.role !== 'system');
    
    // If only one user message, return simple format without role
    if (filteredMessages.length === 1 && filteredMessages[0].role === 'user') {
      return [{
        parts: [{ text: filteredMessages[0].content }],
      }];
    }
    
    // For multi-turn conversations, include role
    return filteredMessages.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  /**
   * Transform Gemini response to standardized format
   */
  transformResponse(response) {
    // Gemini returns candidates array with content.parts
    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidate in Gemini response');
    }

    const content = candidate.content?.parts
      ?.map(part => part.text)
      .join('') || '';

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
   * Get default model for Gemini
   */
  getDefaultModel() {
    return this.config.DEFAULT_MODEL || CONSTANTS.DEFAULT_MODEL;
  }
}
