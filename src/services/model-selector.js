import { CONFIG } from '../config/index.js';

/**
 * Model Selection Service
 * Handles intelligent model selection based on request characteristics
 */
export class ModelSelector {
  constructor(llmService) {
    this.llmService = llmService;
    this.availableModelsCache = null;
  }

  /**
   * Auto-select the best model based on request characteristics
   */
  async selectBestModel(question) {
    const availableModels = await this.getAvailableModels();

    // Helper to find model by prefix (handles version suffixes like :8b)
    const findModelByPrefix = (prefix) => {
      return availableModels.find(model => model.startsWith(prefix)) || null;
    };

    // Simple routing rules for Ollama models
    if (/code|debug|function|regex|algorithm|script/i.test(question)) {
      const model = findModelByPrefix("deepseek-coder") || 
                    findModelByPrefix("codellama") || 
                    findModelByPrefix("qwen2.5-coder");
      if (model) return model;
    }

    if (/math|calculation|logic|reason|analysis|planning/i.test(question)) {
      const model = findModelByPrefix("deepseek-r1") || 
                    findModelByPrefix("llama3.1");
      if (model) return model;
    }

    if (/story|creative|escreva|texto longo|ensaio/i.test(question)) {
      const model = findModelByPrefix("llama3.1") || 
                    findModelByPrefix("mistral") ||
                    findModelByPrefix("ministral");
      if (model) return model;
    }

    if (/chat|menu|pedido|resposta curta/i.test(question)) {
      const model = findModelByPrefix("llama3") || 
                    findModelByPrefix("mistral") ||
                    findModelByPrefix("ministral");
      if (model) return model;
    }

    // Fallback default - prefer llama3.1:8b if available
    const llama31 = findModelByPrefix("llama3.1");
    if (llama31) return llama31;
    
    return availableModels[0] || CONFIG.DEFAULT_MODEL;
  }

  /**
   * Get available models (with caching)
   */
  async getAvailableModels() {
    if (!this.availableModelsCache) {
      this.availableModelsCache = await this.llmService.getAvailableModels();
    }
    return this.availableModelsCache;
  }

  /**
   * Clear models cache
   */
  clearCache() {
    this.availableModelsCache = null;
  }

  /**
   * Get optimal temperature based on request type
   */
  getOptimalTemperature(question) {
    const isCreative = question.includes('creative') || 
                      question.includes('write') || 
                      question.includes('story') || 
                      question.includes('humanize') || 
                      question.includes('book');
    const isTechnical = question.includes('code') || 
                        question.includes('technical') || 
                        question.includes('algorithm');
    
    if (isCreative) return 0.8;
    if (isTechnical) return 0.3;
    return 0.7; // Default
  }

  /**
   * Get optimal max tokens based on request length and type
   */
  getOptimalMaxTokens(question) {
    const questionLength = question.length;
    const isLongForm = question.includes('essay') || 
                       question.includes('detailed') || 
                       question.includes('comprehensive');
    const isCompact = question.includes('compact') || 
                      question.includes('summary') || 
                      question.includes('brief');
    
    // Token optimization for Cursor
    if (isCompact) return 150; // Very short for token economy
    if (isLongForm) return 1024; // Reduced from 2048
    if (questionLength > 500) return 512; // Reduced from 1024
    return 256; // Reduced from 512 for token economy
  }
}
