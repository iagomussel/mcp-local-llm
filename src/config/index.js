import { config } from 'dotenv';

// Load environment variables from .env file
config({ debug: false });

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
};

/**
 * Server metadata
 */
export const SERVER_INFO = {
  name: 'mcp-local-llm',
  version: '1.0.0',
};
