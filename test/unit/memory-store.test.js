/**
 * Unit tests for MemoryStore
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { MemoryStore } from '../../src/memory/MemoryStore.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync, rmdirSync } from 'fs';

const getTempStoragePath = () => {
  return join(tmpdir(), `mcp-memory-test-${Date.now()}`);
};

test('MemoryStore should initialize with default path', async () => {
  const store = new MemoryStore();
  await store.ensureInitialized();
  
  assert.ok(store);
  assert.strictEqual(typeof store.store, 'function');
});

test('MemoryStore should initialize with custom path', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  assert.ok(store);
  assert.strictEqual(store.storagePath, storagePath);
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});

test('MemoryStore should store and retrieve memories', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  const memory = await store.store('test-key', 'test content', { tag: 'test' });
  
  assert.ok(memory.id);
  assert.strictEqual(memory.key, 'test-key');
  assert.strictEqual(memory.content, 'test content');
  assert.ok(memory.metadata.created_at);
  
  const retrieved = await store.retrieve('test-key');
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].content, 'test content');
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});

test('MemoryStore should get memory by ID', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  const memory = await store.store('test-key', 'test content');
  const retrieved = await store.getById(memory.id);
  
  assert.ok(retrieved);
  assert.strictEqual(retrieved.id, memory.id);
  assert.strictEqual(retrieved.content, 'test content');
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});

test('MemoryStore should search memories', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  await store.store('key1', 'content about testing', { tags: ['test'] });
  await store.store('key2', 'content about coding', { tags: ['code'] });
  await store.store('key3', 'more testing content', { tags: ['test'] });
  
  const results = await store.search('testing');
  assert.ok(results.length >= 2);
  
  const tagResults = await store.search('', { tags: ['test'] });
  assert.ok(tagResults.length >= 2);
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});

test('MemoryStore should update memories', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  const memory = await store.store('test-key', 'original content');
  const updated = await store.update(memory.id, { content: 'updated content' });
  
  assert.strictEqual(updated.content, 'updated content');
  assert.ok(updated.metadata.updated_at);
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});

test('MemoryStore should delete memories', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  const memory = await store.store('test-key', 'test content');
  const deleted = await store.delete(memory.id);
  
  assert.strictEqual(deleted, true);
  
  const retrieved = await store.getById(memory.id);
  assert.strictEqual(retrieved, null);
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});

test('MemoryStore should count memories', async () => {
  const storagePath = getTempStoragePath();
  const store = new MemoryStore(storagePath);
  await store.ensureInitialized();
  
  await store.store('key1', 'content1');
  await store.store('key2', 'content2');
  
  const count = await store.count();
  assert.strictEqual(count, 2);
  
  // Cleanup
  if (existsSync(storagePath)) {
    try {
      unlinkSync(join(storagePath, 'memories.json'));
      rmdirSync(storagePath);
    } catch {}
  }
});
