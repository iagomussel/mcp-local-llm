/**
 * Base class for all MCP tools
 * Provides common functionality, caching support, and structure
 */

export class BaseTool {
  constructor(server) {
    this.server = server;
  }

  // Get the tool definition (to be implemented by each tool)
  getToolDefinition() {
    throw new Error('getToolDefinition must be implemented by subclass');
  }

  // Handle the tool execution (to be implemented by each tool)
  async handle(args) {
    throw new Error('handle must be implemented by subclass');
  }

  /**
   * Execute with cache support. Called by ToolHandler for cacheable tools.
   * Subclasses should NOT override this — override handle() instead.
   */
  async handleCached(args) {
    const cache = this.server.cacheService;
    const def = this.getToolDefinition();

    if (!cache || !def.cacheable) {
      return this.handle(args);
    }

    const key = cache.generateKey(def.name, args);
    const cached = cache.get(key);

    if (cached) {
      // Annotate response so caller knows it came from cache
      const result = { ...cached };
      if (result.content && Array.isArray(result.content)) {
        result.content = [
          { type: 'text', text: '[cached result]' },
          ...result.content,
        ];
      }
      return result;
    }

    const result = await this.handle(args);
    const ttl = def.cacheTTL || cache.defaultTTL;
    cache.set(key, result, ttl);
    return result;
  }

  // Helper method to call the model runner
  async callModelRunner(payload) {
    return await this.server.callModelRunner(payload);
  }

  // Helper method to select the best model
  async selectBestModel(question) {
    return await this.server.selectBestModel(question);
  }

  // Helper method to get optimal temperature
  getOptimalTemperature(question) {
    return this.server.getOptimalTemperature(question);
  }

  // Helper method to get optimal max tokens
  getOptimalMaxTokens(question) {
    return this.server.getOptimalMaxTokens(question);
  }

  // Helper method to get max tokens for a specific model
  getMaxTokensForModel(modelName) {
    return this.server.getMaxTokensForModel(modelName);
  }

  // Helper method to get optimal max tokens for a model and use case
  async getOptimalMaxTokensForModel(modelName, question = '') {
    return await this.server.getOptimalMaxTokensForModel(modelName, question);
  }
}
