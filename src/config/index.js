import { config } from 'dotenv';

// Load environment variables from .env file silently
// CRITICAL: Any output to stdout will break MCP JSON-RPC protocol
const originalConsoleLog = console.log;
console.log = () => {}; // Temporarily disable console.log
config({ debug: false });
console.log = originalConsoleLog; // Restore console.log

/**
 * Server configuration loaded from environment variables
 */
export const CONFIG = {
  // Provider selection
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'ollama', // 'ollama', 'openai', 'anthropic', 'gemini'
  
  // Ollama configuration
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  
  // OpenAI configuration
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  OPENAI_BASE_URL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
  
  // Anthropic configuration
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com/v1',
  
  // Google Gemini configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  
  // Common configuration
  DEFAULT_MODEL: process.env.MODEL_NAME || null, // Provider-specific default will be used if null
  MAX_TOKENS: parseInt(process.env.MAX_TOKENS) || 256,
  TEMPERATURE: parseFloat(process.env.TEMPERATURE) || 0.7,
  
  // Cache configuration
  CACHE_ENABLED: process.env.CACHE_ENABLED !== 'false' && process.env.CACHE_ENABLED !== '0', // enabled by default
  CACHE_MAX_ENTRIES: parseInt(process.env.CACHE_MAX_ENTRIES) || 200,
  CACHE_DEFAULT_TTL: parseInt(process.env.CACHE_DEFAULT_TTL) || 300000, // 5 minutes in ms

  // Feature flags
  DISABLE_CHAT_SUMMARY_RULE: process.env.DISABLE_CHAT_SUMMARY_RULE === 'true' || process.env.DISABLE_CHAT_SUMMARY_RULE === '1',
  
  // Client workspace directory detection
  // Option 2: Fallback to process.cwd() (will be updated if MCP Roots available)
  CLIENT_WORKDIR: process.cwd(),
  WORKDIR_SOURCE: 'process.cwd()',
};

/**
 * Server metadata
 */
export const SERVER_INFO = {
  name: 'mcp-local-llm',
  version: '1.0.0',
};
