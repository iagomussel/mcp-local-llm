import { BaseTool } from './BaseTool.js';
import { MemoryStore } from '../memory/MemoryStore.js';

let memoryStoreInstance = null;

function getMemoryStore() {
  if (!memoryStoreInstance) {
    memoryStoreInstance = new MemoryStore();
  }
  return memoryStoreInstance;
}

export class MemoryUpdateTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'memory_update',
      description: 'Update an existing memory by ID. Can update content, tags, category, or other metadata.',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the memory to update',
          },
          content: {
            type: 'string',
            description: 'New content for the memory',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'New tags for the memory',
          },
          category: {
            type: 'string',
            description: 'New category for the memory',
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata to update',
          },
        },
        required: ['id'],
      },
    };
  }

  async handle(args) {
    const { id, content, tags, category, metadata } = args;

    if (!id || typeof id !== 'string') {
      throw new Error('ID is required and must be a string');
    }

    try {
      const store = getMemoryStore();
      const updates = {};

      if (content !== undefined) {
        updates.content = content;
      }

      if (tags !== undefined || category !== undefined || metadata !== undefined) {
        updates.metadata = {
          ...metadata,
          ...(tags !== undefined && { tags }),
          ...(category !== undefined && { category }),
        };
      }

      const updated = await store.update(id, updates);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              memory_id: updated.id,
              updated_at: updated.metadata.updated_at,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update memory: ${error.message}`);
    }
  }
}
