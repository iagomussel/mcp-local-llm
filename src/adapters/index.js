/**
 * Adapters module - Public API
 * 
 * IMPORTANT: Application code should NEVER import specific adapters!
 * Use LLMService instead, which provides a clean abstraction layer.
 * 
 * This module only exports:
 * - BaseAdapter (for creating new adapters)
 * - AdapterFactory (for internal use by LLMService)
 * - Common constants (for shared utilities)
 */

// Base adapter for creating new adapters
export { BaseAdapter } from './base-adapter.js';

// Factory (used internally by LLMService)
export { AdapterFactory, adapterFactory } from './adapter-factory.js';

// Common constants (for utilities, not for direct adapter access)
export { COMMON_CONSTANTS, ERROR_MESSAGES } from './common-constants.js';

// NOTE: Specific adapters are NOT exported here
// They are only available through the factory via LLMService
