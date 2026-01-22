import { BaseTool } from './BaseTool.js';

export class CheckLLMStatusTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'check_llm_status',
      description: 'Check if Ollama is running and accessible',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  async handle(args) {
    try {
      // Test with a simple API request to check if Ollama is running
      const response = await this.server.getAvailableModels();
      const modelsCount = Array.isArray(response) ? response.length : 0;
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ Ollama is running at ${this.server.CONFIG.OLLAMA_URL}\nAvailable models: ${modelsCount}`,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `❌ Ollama is not accessible at ${this.server.CONFIG.OLLAMA_URL}\nError: ${error.message}\n\nMake sure Ollama is installed and running.\n\nTo start Ollama:\n1. Run: ollama serve\n2. Or ensure the Ollama service is running\n3. Pull a model: ollama pull llama3`,
          },
        ],
        isError: true,
      };
    }
  }
}
