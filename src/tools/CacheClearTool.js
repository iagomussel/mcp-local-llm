import { BaseTool } from './BaseTool.js';

export class CacheClearTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'cache_clear',
      description: 'Clears all cached results. Use when you need fresh responses from tools or after significant code changes.',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };
  }

  async handle() {
    const cache = this.server.cacheService;

    if (!cache) {
      return {
        content: [
          { type: 'text', text: JSON.stringify({ success: false, message: 'Cache is disabled' }, null, 2) },
        ],
      };
    }

    const statsBefore = cache.getStats();
    const cleared = cache.clear();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: true,
            entriesCleared: cleared,
            statsBefore: {
              hits: statsBefore.hits,
              misses: statsBefore.misses,
              hitRate: statsBefore.hitRate,
            },
          }, null, 2),
        },
      ],
    };
  }
}
