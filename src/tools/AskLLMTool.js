import { BaseTool } from './BaseTool.js';

export class AskLLMTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'ask_llm',
      description: 'Ask a question to the AI model and get a response. The system automatically selects the best model for the task.',
      inputSchema: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The question or prompt to send to the AI model',
          },
        },
        required: ['question'],
      },
    };
  }

  async handle(args) {
    const { question } = args;

    if (!question || typeof question !== 'string') {
      throw new Error('Question is required and must be a string');
    }

    // Auto-select model based on question characteristics
    const model = await this.selectBestModel(question);
    const temperature = this.getOptimalTemperature(question);
    const max_tokens = this.getOptimalMaxTokens(question);

    try {
      const response = await this.callModelRunner({
        model,
        messages: [
          {
            role: 'user',
            content: question
          }
        ],
        temperature,
        max_tokens,
      });

      const result = response.choices?.[0]?.message?.content || 'No response generated';
      
      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get LLM response: ${error.message}`);
    }
  }
}
