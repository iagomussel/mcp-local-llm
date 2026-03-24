import { BaseTool } from './BaseTool.js';

export class ClearCacheTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'clear_cache',
      description: 'Clear the LLM response cache to force fresh responses',
      inputSchema: { type: 'object', properties: {} },
    };
  }

  async handle() {
    const cleared = this.server.clearCache();

    return {
      content: [{ type: 'text', text: `Cache cleared: ${cleared} entries removed.` }],
    };
  }
}
