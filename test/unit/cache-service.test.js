/**
 * Unit tests for CacheService and cache integration in BaseTool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { CacheService } from '../../src/services/cache-service.js';
import { BaseTool } from '../../src/tools/BaseTool.js';
import { MockServer } from '../utils/mock-server.js';

// --- CacheService unit tests ---

test('CacheService: set and get', () => {
  const cache = new CacheService({ maxEntries: 10, defaultTTL: 60_000 });
  const key = cache.generateKey('tool', { q: 'hello' });
  cache.set(key, { data: 'value' });
  const result = cache.get(key);
  assert.deepStrictEqual(result, { data: 'value' });
});

test('CacheService: miss returns null', () => {
  const cache = new CacheService();
  assert.strictEqual(cache.get('nonexistent'), null);
});

test('CacheService: expired entries return null', async () => {
  const cache = new CacheService({ defaultTTL: 1 });
  cache.set('k', { data: 1 }, 1);
  await new Promise(r => setTimeout(r, 10));
  assert.strictEqual(cache.get('k'), null);
});

test('CacheService: evicts oldest when full', () => {
  const cache = new CacheService({ maxEntries: 3 });
  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  cache.set('d', 4); // should evict 'a'
  assert.strictEqual(cache.get('a'), null);
  assert.strictEqual(cache.get('d'), 4);
});

test('CacheService: clear removes all entries', () => {
  const cache = new CacheService();
  cache.set('a', 1);
  cache.set('b', 2);
  const count = cache.clear();
  assert.strictEqual(count, 2);
  assert.strictEqual(cache.cache.size, 0);
});

test('CacheService: stats are accurate', () => {
  const cache = new CacheService();
  cache.set('a', 1);
  cache.get('a'); // hit
  cache.get('b'); // miss
  const stats = cache.getStats();
  assert.strictEqual(stats.hits, 1);
  assert.strictEqual(stats.misses, 1);
  assert.strictEqual(stats.hitRate, '50.0%');
});

test('CacheService: generateKey is deterministic', () => {
  const cache = new CacheService();
  const k1 = cache.generateKey('tool', { a: 1, b: 2 });
  const k2 = cache.generateKey('tool', { a: 1, b: 2 });
  assert.strictEqual(k1, k2);
});

test('CacheService: generateKey differs for different inputs', () => {
  const cache = new CacheService();
  const k1 = cache.generateKey('tool', { a: 1 });
  const k2 = cache.generateKey('tool', { a: 2 });
  assert.notStrictEqual(k1, k2);
});

test('CacheService: invalidate removes specific entry', () => {
  const cache = new CacheService();
  cache.set('a', 1);
  cache.set('b', 2);
  cache.invalidate('a');
  assert.strictEqual(cache.get('a'), null);
  assert.strictEqual(cache.get('b'), 2);
});

// --- BaseTool.handleCached integration tests ---

class CacheableTool extends BaseTool {
  constructor(server) {
    super(server);
    this.handleCallCount = 0;
  }
  getToolDefinition() {
    return {
      name: 'cacheable_test',
      description: 'Test cacheable tool',
      cacheable: true,
      cacheTTL: 60_000,
      inputSchema: { type: 'object', properties: {} },
    };
  }
  async handle(args) {
    this.handleCallCount++;
    return { content: [{ type: 'text', text: `result-${this.handleCallCount}` }] };
  }
}

class NonCacheableTool extends BaseTool {
  constructor(server) {
    super(server);
    this.handleCallCount = 0;
  }
  getToolDefinition() {
    return {
      name: 'non_cacheable_test',
      description: 'Test non-cacheable tool',
      inputSchema: { type: 'object', properties: {} },
    };
  }
  async handle(args) {
    this.handleCallCount++;
    return { content: [{ type: 'text', text: `result-${this.handleCallCount}` }] };
  }
}

test('handleCached: returns cached result on second call', async () => {
  const server = new MockServer();
  server.cacheService = new CacheService();
  const tool = new CacheableTool(server);

  const r1 = await tool.handleCached({ q: 'test' });
  assert.strictEqual(tool.handleCallCount, 1);

  const r2 = await tool.handleCached({ q: 'test' });
  assert.strictEqual(tool.handleCallCount, 1); // handle NOT called again
  assert.ok(r2.content[0].text === '[cached result]');
  assert.ok(r2.content[1].text === 'result-1');
});

test('handleCached: non-cacheable tool always calls handle', async () => {
  const server = new MockServer();
  server.cacheService = new CacheService();
  const tool = new NonCacheableTool(server);

  await tool.handleCached({ q: 'test' });
  await tool.handleCached({ q: 'test' });
  assert.strictEqual(tool.handleCallCount, 2);
});

test('handleCached: works without cache service (disabled)', async () => {
  const server = new MockServer();
  server.cacheService = null;
  const tool = new CacheableTool(server);

  await tool.handleCached({ q: 'test' });
  await tool.handleCached({ q: 'test' });
  assert.strictEqual(tool.handleCallCount, 2); // No caching, called twice
});
