import { LLMService } from './llm-service.js';
import { CONFIG } from '../config/index.js';

/**
 * Ollama Service (Legacy compatibility wrapper)
 * @deprecated Use LLMService instead. This is kept for backward compatibility.
 */
export class OllamaService {
  constructor(config = CONFIG) {
    // Create LLMService with Ollama adapter
    this.llmService = new LLMService({ ...config, LLM_PROVIDER: 'ollama' });
  }

  /**
   * Get list of available models from Ollama
   */
  async getAvailableModels() {
    return await this.llmService.getAvailableModels();
  }

  /**
   * Call Ollama chat API
   */
  async callChat(payload) {
    return await this.llmService.callChat(payload);
  }
}
