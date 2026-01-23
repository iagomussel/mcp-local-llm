/**
 * Anthropic Adapter Constants
 * Configuration constants for Anthropic adapter
 */
export const ANTHROPIC_CONSTANTS = {
  DEFAULT_BASE_URL: 'https://api.anthropic.com/v1',
  DEFAULT_MODEL: 'claude-3-haiku-20240307',
  API_ENDPOINTS: {
    MESSAGES: '/messages',
  },
  TIMEOUT: 30000,
  API_VERSION: '2023-06-01',
  HEADERS: {
    CONTENT_TYPE: 'application/json',
    VERSION_HEADER: 'anthropic-version',
  },
  MODELS: [
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229',
    'claude-3-sonnet-20240229',
    'claude-3-haiku-20240307',
  ],
};
