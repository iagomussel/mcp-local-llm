/**
 * Common Adapter Constants
 * Shared constants used across all adapters
 */
export const COMMON_CONSTANTS = {
  DEFAULT_TEMPERATURE: 0.7,
  DEFAULT_MAX_TOKENS: 256,
  DEFAULT_TIMEOUT: 30000,
};

/**
 * Common Error Messages
 * Standardized error messages for all adapters
 */
export const ERROR_MESSAGES = {
  API_KEY_REQUIRED: (provider) => `${provider.toUpperCase()}_API_KEY is required for ${provider} adapter`,
  SERVICE_UNAVAILABLE: (provider) => `${provider} service unavailable`,
  INVALID_API_KEY: (provider) => `${provider} API key is invalid`,
  RATE_LIMIT_EXCEEDED: (provider) => `${provider} rate limit exceeded`,
  REQUEST_FAILED: (provider) => `${provider} request failed`,
  UNKNOWN_ADAPTER: (name, available) => `Unknown adapter: ${name}. Available adapters: ${available.join(', ')}`,
  INVALID_CONFIG: (provider, message) => `Invalid configuration for ${provider}: ${message}`,
};
