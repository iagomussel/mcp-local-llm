/**
 * OpenAI Adapter Constants
 * Configuration constants for OpenAI adapter
 */
export const OPENAI_CONSTANTS = {
  DEFAULT_BASE_URL: 'https://api.openai.com/v1',
  DEFAULT_MODEL: 'gpt-3.5-turbo',
  API_ENDPOINTS: {
    MODELS: '/models',
    CHAT: '/chat/completions',
  },
  TIMEOUT: 30000,
  HEADERS: {
    CONTENT_TYPE: 'application/json',
  },
};
