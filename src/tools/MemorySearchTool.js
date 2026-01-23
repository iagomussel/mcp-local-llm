import { BaseTool } from './BaseTool.js';
import { getMemoryStore } from '../memory/MemoryStoreSingleton.js';

export class MemorySearchTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'memory_search',
      description: 'Search memories by query string, tags, or metadata filters. Returns matching memories ranked by relevance.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query to match against memory content, keys, and tags',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter results by tags (all tags must match)',
          },
          category: {
            type: 'string',
            description: 'Filter results by category',
          },
          metadata_filter: {
            type: 'object',
            description: 'Filter results by metadata key-value pairs',
          },
          limit: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 10,
          },
        },
      },
    };
  }

  async handle(args) {
    const { query = '', tags, category, metadata_filter = {}, limit = 10 } = args;

    try {
      const store = await getMemoryStore();
      
      const metadataFilter = { ...metadata_filter };
      if (category) {
        metadataFilter.category = category;
      }

      const results = await store.search(query, {
        tags: tags || [],
        metadata_filter: metadataFilter,
        limit,
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              query,
              count: results.length,
              results: results.map(m => ({
                id: m.id,
                key: m.key,
                content: m.content,
                tags: m.metadata?.tags || [],
                category: m.metadata?.category,
                created_at: m.metadata?.created_at,
                updated_at: m.metadata?.updated_at,
              })),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search memories: ${error.message}`);
    }
  }
}
