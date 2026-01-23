/**
 * Gemini Adapter Constants
 * Configuration constants for Google Gemini adapter
 */
export const GEMINI_CONSTANTS = {
  DEFAULT_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  DEFAULT_MODEL: 'gemini-2.5-flash',
  API_ENDPOINTS: {
    MODELS: '/models',
    GENERATE_CONTENT: '/models/{model}:generateContent',
  },
  TIMEOUT: 30000,
  HEADERS: {
    CONTENT_TYPE: 'application/json',
  },
  MODELS: [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-3-flash-preview',
    'gemini-3-pro-preview',
    // Legacy models
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-1.0-pro',
  ],
};
