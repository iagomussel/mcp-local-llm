/**
 * Ollama Adapter Constants
 * Configuration constants for Ollama adapter
 */
export const OLLAMA_CONSTANTS = {
  DEFAULT_URL: 'http://localhost:11434',
  DEFAULT_MODEL: 'llama3',
  API_ENDPOINTS: {
    MODELS: '/api/tags',
    CHAT: '/api/chat',
  },
  TIMEOUT: 15000,
};
