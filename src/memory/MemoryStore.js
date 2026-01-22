import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { existsSync } from 'fs';

export class MemoryStore {
  constructor(storagePath = './.memory') {
    this.storagePath = storagePath;
    this.memoryFile = join(storagePath, 'memories.json');
    this.memories = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      if (!existsSync(this.storagePath)) {
        await mkdir(this.storagePath, { recursive: true });
      }

      if (existsSync(this.memoryFile)) {
        const data = await readFile(this.memoryFile, 'utf-8');
        const parsed = JSON.parse(data);
        
        if (Array.isArray(parsed)) {
          parsed.forEach(memory => {
            this.memories.set(memory.id, memory);
          });
        } else if (parsed.memories && Array.isArray(parsed.memories)) {
          parsed.memories.forEach(memory => {
            this.memories.set(memory.id, memory);
          });
        }
      }
    } catch (error) {
      console.error('[MemoryStore] Failed to initialize:', error.message);
    }
  }

  async save() {
    try {
      const memoriesArray = Array.from(this.memories.values());
      const data = {
        version: '1.0',
        updated_at: new Date().toISOString(),
        memories: memoriesArray,
      };
      await writeFile(this.memoryFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      throw new Error(`Failed to save memories: ${error.message}`);
    }
  }

  generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async store(key, content, metadata = {}) {
    const id = this.generateId();
    const memory = {
      id,
      key: key || id,
      content,
      metadata: {
        ...metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    this.memories.set(id, memory);
    await this.save();
    return memory;
  }

  async retrieve(key) {
    const memories = Array.from(this.memories.values());
    return memories.filter(m => m.key === key);
  }

  async getById(id) {
    return this.memories.get(id) || null;
  }

  async search(query, options = {}) {
    const { 
      limit = 10, 
      tags = [], 
      metadata_filter = {},
      fuzzy = true 
    } = options;

    const memories = Array.from(this.memories.values());
    let results = memories;

    if (tags.length > 0) {
      results = results.filter(m => {
        const memoryTags = m.metadata?.tags || [];
        return tags.some(tag => memoryTags.includes(tag));
      });
    }

    if (Object.keys(metadata_filter).length > 0) {
      results = results.filter(m => {
        return Object.entries(metadata_filter).every(([key, value]) => {
          return m.metadata?.[key] === value;
        });
      });
    }

    if (query) {
      const queryLower = query.toLowerCase();
      results = results.filter(m => {
        const contentMatch = m.content?.toLowerCase().includes(queryLower);
        const keyMatch = m.key?.toLowerCase().includes(queryLower);
        const tagMatch = m.metadata?.tags?.some(tag => 
          tag.toLowerCase().includes(queryLower)
        );
        return contentMatch || keyMatch || tagMatch;
      });
    }

    if (limit > 0) {
      results = results.slice(0, limit);
    }

    return results;
  }

  async update(id, updates) {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory with id ${id} not found`);
    }

    const updated = {
      ...memory,
      ...updates,
      metadata: {
        ...memory.metadata,
        ...updates.metadata,
        updated_at: new Date().toISOString(),
      },
    };

    this.memories.set(id, updated);
    await this.save();
    return updated;
  }

  async delete(id) {
    const memory = this.memories.get(id);
    if (!memory) {
      throw new Error(`Memory with id ${id} not found`);
    }

    this.memories.delete(id);
    await this.save();
    return true;
  }

  async deleteByKey(key) {
    const memories = Array.from(this.memories.values());
    const toDelete = memories.filter(m => m.key === key);
    
    toDelete.forEach(m => this.memories.delete(m.id));
    await this.save();
    return toDelete.length;
  }

  async getAll() {
    return Array.from(this.memories.values());
  }

  async count() {
    return this.memories.size;
  }

  async clear() {
    this.memories.clear();
    await this.save();
    return true;
  }
}
