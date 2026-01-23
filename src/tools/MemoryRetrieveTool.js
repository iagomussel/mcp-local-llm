import { BaseTool } from './BaseTool.js';
import { getMemoryStore } from '../memory/MemoryStoreSingleton.js';

export class MemoryRetrieveTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'memory_retrieve',
      description: 'Retrieve memories by key, ID, or search query. Returns matching memories with their content and metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Retrieve memories by key',
          },
          id: {
            type: 'string',
            description: 'Retrieve a specific memory by ID',
          },
          query: {
            type: 'string',
            description: 'Search query to find matching memories',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Filter memories by tags',
          },
          category: {
            type: 'string',
            description: 'Filter memories by category',
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
    const { key, id, query, tags, category, limit = 10 } = args;

    try {
      const store = await getMemoryStore();
      let results = [];

      if (id) {
        const memory = await store.getById(id);
        if (memory) {
          results = [memory];
        }
      } else if (key) {
        results = await store.retrieve(key);
      } else {
        const metadataFilter = {};
        if (category) {
          metadataFilter.category = category;
        }

        results = await store.search(query || '', {
          tags: tags || [],
          metadata_filter: metadataFilter,
          limit,
        });
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              count: results.length,
              memories: results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to retrieve memories: ${error.message}`);
    }
  }
}
