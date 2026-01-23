import { BaseTool } from './BaseTool.js';
import { getMemoryStore } from '../memory/MemoryStoreSingleton.js';

export class MemoryStoreTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'memory_store',
      description: 'Store a memory with a key, content, and optional metadata (tags, category, etc.). Returns the stored memory ID.',
      inputSchema: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Unique key identifier for the memory',
          },
          content: {
            type: 'string',
            description: 'The content to store in memory',
          },
          tags: {
            type: 'array',
            items: { type: 'string' },
            description: 'Optional tags for categorizing the memory',
          },
          category: {
            type: 'string',
            description: 'Optional category for the memory',
          },
          metadata: {
            type: 'object',
            description: 'Additional metadata to store with the memory',
          },
        },
        required: ['key', 'content'],
      },
    };
  }

  async handle(args) {
    const { key, content, tags, category, metadata = {} } = args;

    if (!key || typeof key !== 'string') {
      throw new Error('Key is required and must be a string');
    }

    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }

    try {
      const store = await getMemoryStore();
      const memoryMetadata = {
        ...metadata,
        ...(tags && { tags }),
        ...(category && { category }),
      };

      const memory = await store.store(key, content, memoryMetadata);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              memory_id: memory.id,
              key: memory.key,
              stored_at: memory.metadata.created_at,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to store memory: ${error.message}`);
    }
  }
}
