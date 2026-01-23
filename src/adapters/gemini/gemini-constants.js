/**
 * Gemini Adapter Constants
 * Configuration constants for Google Gemini adapter
 */
export const GEMINI_CONSTANTS = {
  DEFAULT_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  DEFAULT_MODEL: 'gemini-1.5-flash',
  API_ENDPOINTS: {
    MODELS: '/models',
    GENERATE_CONTENT: '/models/{model}:generateContent',
  },
  TIMEOUT: 30000,
  HEADERS: {
    CONTENT_TYPE: 'application/json',
  },
  MODELS: [
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
    'gemini-1.0-pro',
  ],
};
