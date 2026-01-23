import { BaseTool } from './BaseTool.js';
import { getMemoryStore } from '../memory/MemoryStoreSingleton.js';

export class MemoryDeleteTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'memory_delete',
      description: 'Delete a memory by ID or by key. Returns success status.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the memory to delete',
          },
          key: {
            type: 'string',
            description: 'Delete all memories with this key',
          },
        },
      },
    };
  }

  async handle(args) {
    const { id, key } = args;

    if (!id && !key) {
      throw new Error('Either id or key is required');
    }

    try {
      const store = await getMemoryStore();
      let deleted = false;
      let count = 0;

      if (id) {
        deleted = await store.delete(id);
        count = 1;
      } else if (key) {
        count = await store.deleteByKey(key);
        deleted = count > 0;
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: deleted,
              deleted_count: count,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to delete memory: ${error.message}`);
    }
  }
}
