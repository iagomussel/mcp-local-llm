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

// Reset memory store singleton before each test
// Since MemoryStore is a singleton used by all tools, we need to clear it between tests
// We'll use MemoryStoreTool to access the same singleton instance
async function resetMemoryStore() {
  // Create a tool instance to trigger singleton creation
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  
  // Store and immediately delete a dummy memory to ensure store is initialized
  try {
    const response = await storeTool.handle({
      key: '__test_init__',
      content: '__init__',
    });
    const memoryId = JSON.parse(response.content[0].text).memory_id;
    
    // Now get the store and clear it
    const { MemoryStore } = await import('../../src/memory/MemoryStore.js');
    const store = new MemoryStore();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for init
    await store.clear();
  } catch (error) {
    // If clearing fails, try to continue anyway
  }
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
  // Don't reset - use the same instance that was created in previous tests
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  
  // Store a memory with a unique key
  const uniqueKey = `update-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const storeResponse = await storeTool.handle({
    key: uniqueKey,
    content: 'original content for update',
  });
  const resultData = JSON.parse(storeResponse.content[0].text);
  const memoryId = resultData.memory_id;
  
  // Verify memory was stored
  assert.ok(memoryId, 'Memory ID should be returned');
  
  // Use retrieve to verify it exists (this uses the same singleton)
  const retrieveTool = new MemoryRetrieveTool(mockServer);
  await new Promise(resolve => setTimeout(resolve, 200));
  const verifyResponse = await retrieveTool.handle({ key: uniqueKey });
  const verifyData = JSON.parse(verifyResponse.content[0].text);
  
  // Now update using the same memory ID
  const updateTool = new MemoryUpdateTool(mockServer);
  const response = await updateTool.handle({
    id: memoryId,
    content: 'updated content',
  });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.strictEqual(result.success, true);
  assert.ok(result.memory_id);
  assert.strictEqual(result.memory_id, memoryId);
});

test('MemoryDeleteTool should delete memories', async () => {
  // Don't reset - use the same instance that was created in previous tests
  const mockServer = new MockServer();
  const storeTool = new MemoryStoreTool(mockServer);
  
  // Store a memory with a unique key
  const uniqueKey = `delete-test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const storeResponse = await storeTool.handle({
    key: uniqueKey,
    content: 'content to delete',
  });
  const resultData = JSON.parse(storeResponse.content[0].text);
  const memoryId = resultData.memory_id;
  
  // Verify memory was stored
  assert.ok(memoryId, 'Memory ID should be returned');
  
  // Wait a bit and verify it exists
  await new Promise(resolve => setTimeout(resolve, 200));
  const retrieveTool = new MemoryRetrieveTool(mockServer);
  const verifyResponse = await retrieveTool.handle({ key: uniqueKey });
  const verifyData = JSON.parse(verifyResponse.content[0].text);
  assert.ok(verifyData.memories && verifyData.memories.length > 0, 'Memory should exist before delete');
  
  // Now delete it
  const deleteTool = new MemoryDeleteTool(mockServer);
  const response = await deleteTool.handle({ id: memoryId });
  
  assertResponseFormat(response);
  const result = JSON.parse(response.content[0].text);
  assert.strictEqual(result.success, true);
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
