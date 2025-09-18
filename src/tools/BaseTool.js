/**
 * Base class for all MCP tools
 * Provides common functionality and structure
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
}
