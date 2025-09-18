import { BaseTool } from './BaseTool.js';

export class CheckLLMStatusTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'check_llm_status',
      description: 'Check if Docker Model Runner is running and accessible',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  async handle(args) {
    try {
      // Test with a simple API request to check if Docker Model Runner is running
      const response = await this.server.getAvailableModels();
      const modelsCount = Array.isArray(response) ? response.length : 0;
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Docker Model Runner is running at ${this.server.CONFIG.MODEL_RUNNER_URL}\nAvailable models: ${modelsCount}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Docker Model Runner is not accessible at ${this.server.CONFIG.MODEL_RUNNER_URL}\nError: ${error.message}\n\nMake sure Docker Model Runner is enabled in Docker Desktop and a model is running.\n\nTo start a model service:\n1. docker model run ai/gemma3:4B-Q4_0\n2. Or enable Model Runner service in Docker Desktop settings`,
          },
        ],
        isError: true,
      };
    }
  }
}
