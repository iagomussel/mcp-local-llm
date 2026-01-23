import { ListPromptsRequestSchema, GetPromptRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { getPromptList, getPrompt } from '../prompts/index.js';

/**
 * Prompt Handler
 * Handles prompt listing and retrieval
 */
export class PromptHandler {
  constructor(server) {
    this.server = server;
  }

  /**
   * Setup prompt request handlers
   */
  setup() {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: getPromptList(),
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name } = request.params;
      return getPrompt(name);
    });
  }
}
