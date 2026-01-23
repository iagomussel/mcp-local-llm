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

  /**
   * Get max tokens limit for a specific model
   * Returns the maximum safe token limit based on model capabilities
   */
  getMaxTokensForModel(modelName) {
    if (!modelName || typeof modelName !== 'string') {
      return 4096; // Safe default
    }

    const modelLower = modelName.toLowerCase();

    // OpenAI models
    if (modelLower.includes('gpt-4')) {
      if (modelLower.includes('turbo') || modelLower.includes('preview')) {
        return 16384; // GPT-4 Turbo: 128k context, safe output limit
      }
      if (modelLower.includes('32k')) {
        return 32768;
      }
      return 8192; // GPT-4: 8k context
    }
    if (modelLower.includes('gpt-3.5-turbo')) {
      return 4096; // GPT-3.5 Turbo: 16k context, safe output limit
    }
    if (modelLower.includes('gpt-3.5')) {
      return 4096;
    }

    // Anthropic Claude models
    if (modelLower.includes('claude-3-5-sonnet') || modelLower.includes('claude-3-opus')) {
      return 8192; // Claude 3.5 Sonnet/Opus: 200k context
    }
    if (modelLower.includes('claude-3')) {
      return 4096; // Claude 3: 200k context
    }
    if (modelLower.includes('claude-2')) {
      return 4096; // Claude 2: 200k context
    }

    // Google Gemini models
    if (modelLower.includes('gemini-1.5-pro')) {
      return 8192; // Gemini 1.5 Pro: 1M+ context
    }
    if (modelLower.includes('gemini-1.5-flash')) {
      return 8192; // Gemini 1.5 Flash: 1M+ context
    }
    if (modelLower.includes('gemini-pro')) {
      return 2048; // Gemini Pro: 32k context
    }
    if (modelLower.includes('gemini')) {
      return 2048; // Default Gemini
    }

    // Ollama models (local, typically have higher limits)
    if (modelLower.includes('llama3.1') || modelLower.includes('llama-3.1')) {
      return 8192; // Llama 3.1: 128k context
    }
    if (modelLower.includes('llama3') || modelLower.includes('llama-3')) {
      return 8192; // Llama 3: 8k context
    }
    if (modelLower.includes('deepseek')) {
      return 8192; // DeepSeek: typically 32k+ context
    }
    if (modelLower.includes('mistral')) {
      return 8192; // Mistral: 32k context
    }
    if (modelLower.includes('codellama') || modelLower.includes('qwen')) {
      return 8192; // Code-focused models
    }

    // Default for unknown models (conservative)
    return 4096;
  }

  /**
   * Get optimal max tokens for a specific model and use case
   * Combines model limits with use case requirements
   */
  async getOptimalMaxTokensForModel(modelName, question = '') {
    const modelLimit = this.getMaxTokensForModel(modelName);
    const useCaseLimit = this.getOptimalMaxTokens(question);
    
    // Return the minimum of model limit and use case limit
    // This ensures we don't exceed model capabilities while respecting use case needs
    return Math.min(modelLimit, Math.max(useCaseLimit, 256)); // At least 256 tokens
  }
}
