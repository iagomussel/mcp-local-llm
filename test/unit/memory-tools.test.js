/**
 * Unit tests for Memory tools (Store, Retrieve, Update, Delete, Search)
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { MemoryStoreTool } from '../../src/tools/MemoryStoreTool.js';
import { MemoryRetrieveTool } from '../../src/tools/MemoryRetrieveTool.js';
import { MemoryUpdateTool } from '../../src/tools/MemoryUpdateTool.js';
import { MemoryDeleteTool } from '../../src/tools/MemoryDeleteTool.js';
import { MemorySearchTool } from '../../src/tools/MemorySearchTool.js';
import { MemoryStore } from '../../src/memory/MemoryStore.js';
import { MockServer } from '../utils/mock-server.js';
import { assertResponseFormat } from '../utils/test-helpers.js';
import { join } from 'path';
import { tmpdir } from 'os';
import { existsSync, unlinkSync, rmdirSync } from 'fs';

// Use a shared storage path for all tests to ensure they use the same file
const TEST_STORAGE_PATH = './.memory-test';

// Reset memory store before each test
// Since each tool module has its own singleton, we need to clear the storage file
async function resetMemoryStore() {
  const { unlinkSync, existsSync, rmdirSync } = await import('fs');
  const { join } = await import('path');
  
  // Clear the test storage file
  const memoryFile = join(TEST_STORAGE_PATH, 'memories.json');
  if (existsSync(memoryFile)) {
    try {
      unlinkSync(memoryFile);
    } catch {}
  }
  
  // Also clear the default storage for good measure
  const defaultFile = join('./.memory', 'memories.json');
  if (existsSync(defaultFile)) {
    try {
      unlinkSync(defaultFile);
    } catch {}
  }
  
  // Wait a bit for file system operations
  await new Promise(resolve => setTimeout(resolve, 100));
}

test('MemoryStoreTool should store memories', async () => {
  await resetMemoryStore();
  
  const mockServer = new MockServer();
  const tool = new MemoryStoreTool(mockServer);
  
  const response = await tool.handle({
    key: 'test-key',
    content: 'test content',
    tags: ['test'],
  });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.ok(result.memory_id);
  assert.strictEqual(result.key, 'test-key');
});

test('MemoryRetrieveTool should retrieve memories', async () => {
  await resetMemoryStore();
  
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  await storeTool.handle({ key: 'retrieve-key', content: 'retrieve content' });
  
  const retrieveTool = new MemoryRetrieveTool(mockServer);
  const response = await retrieveTool.handle({ key: 'retrieve-key' });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.ok(Array.isArray(result.memories));
});

test('MemoryUpdateTool should update memories', async () => {
  await resetMemoryStore();
  
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  const updateTool = new MemoryUpdateTool(mockServer);
  
  // Step 1: Store a memory
  const uniqueKey = `update-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const storeResponse = await storeTool.handle({
    key: uniqueKey,
    content: 'original content for update',
  });
  const resultData = JSON.parse(storeResponse.content[0].text);
  const memoryId = resultData.memory_id;
  
  // Verify memory was stored
  assert.ok(memoryId, 'Memory ID should be returned');
  
  // Step 2: Wait for file I/O to complete
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Step 3: Update the memory using the same singleton
  const response = await updateTool.handle({
    id: memoryId,
    content: 'updated content',
  });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.strictEqual(result.success, true);
  assert.ok(result.memory_id);
  assert.strictEqual(result.memory_id, memoryId);
  assert.ok(result.updated_at);
});

test('MemoryDeleteTool should delete memories', async () => {
  await resetMemoryStore();
  
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  const deleteTool = new MemoryDeleteTool(mockServer);
  const retrieveTool = new MemoryRetrieveTool(mockServer);
  
  // Step 1: Store a memory
  const uniqueKey = `delete-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const storeResponse = await storeTool.handle({
    key: uniqueKey,
    content: 'content to delete',
  });
  const resultData = JSON.parse(storeResponse.content[0].text);
  const memoryId = resultData.memory_id;
  
  // Verify memory was stored
  assert.ok(memoryId, 'Memory ID should be returned');
  
  // Step 2: Wait for file I/O to complete
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Step 3: Verify memory exists before deletion
  const verifyResponse = await retrieveTool.handle({ key: uniqueKey });
  const verifyData = JSON.parse(verifyResponse.content[0].text);
  assert.ok(verifyData.memories && verifyData.memories.length > 0, 
    'Memory should exist before delete');
  
  // Step 4: Delete the memory using the same singleton
  const response = await deleteTool.handle({ id: memoryId });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.strictEqual(result.success, true);
  assert.strictEqual(result.deleted_count, 1);
  
  // Step 5: Verify deletion persisted
  await new Promise(resolve => setTimeout(resolve, 300));
  const verifyDeletedResponse = await retrieveTool.handle({ key: uniqueKey });
  const verifyDeletedData = JSON.parse(verifyDeletedResponse.content[0].text);
  assert.strictEqual(verifyDeletedData.memories.length, 0, 
    'Memory should be deleted');
});

test('MemorySearchTool should search memories', async () => {
  await resetMemoryStore();
  
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  await storeTool.handle({
    key: 'search-key',
    content: 'searchable content',
    tags: ['test'],
  });
  
  // Wait a bit to ensure memory is stored
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const searchTool = new MemorySearchTool(mockServer);
  const response = await searchTool.handle({ query: 'searchable' });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.strictEqual(result.success, true);
  assert.ok(Array.isArray(result.results));
  assert.ok(result.count >= 0);
});
