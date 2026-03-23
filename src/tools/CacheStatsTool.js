import { BaseTool } from './BaseTool.js';

export class CacheStatsTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'cache_stats',
      description: 'Returns current cache statistics including hit rate, total entries, evictions, and memory usage. Useful for monitoring cache effectiveness.',
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
          { type: 'text', text: JSON.stringify({ enabled: false, message: 'Cache is disabled' }, null, 2) },
        ],
      };
    }

    const stats = cache.getStats();
    return {
      content: [
        { type: 'text', text: JSON.stringify({ enabled: true, ...stats }, null, 2) },
      ],
    };
  }
}
