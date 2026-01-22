/**
 * Mock server for testing tools
 */

export class MockServer {
  constructor() {
    this.CONFIG = {
      OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
      DEFAULT_MODEL: process.env.MODEL_NAME || 'llama3',
      MAX_TOKENS: parseInt(process.env.MAX_TOKENS) || 256,
      TEMPERATURE: parseFloat(process.env.TEMPERATURE) || 0.7,
    };
    
    this.callModelRunnerCalls = [];
    this.selectBestModelCalls = [];
  }

  async callModelRunner(payload) {
    this.callModelRunnerCalls.push(payload);
    
    // Return mock response
    return {
      choices: [{
        message: {
          content: 'Mock LLM response',
          role: 'assistant',
        },
      }],
    };
  }

  async selectBestModel(question) {
    this.selectBestModelCalls.push(question);
    return this.CONFIG.DEFAULT_MODEL;
  }

  getOptimalTemperature(question) {
    return this.CONFIG.TEMPERATURE;
  }

  getOptimalMaxTokens(question) {
    return this.CONFIG.MAX_TOKENS;
  }

  async getAvailableModels() {
    return ['llama3', 'llama3.1', 'mistral'];
  }

  reset() {
    this.callModelRunnerCalls = [];
    this.selectBestModelCalls = [];
  }
}
