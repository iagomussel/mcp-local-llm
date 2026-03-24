/**
 * Unit tests for ResponseCache
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ResponseCache } from '../../src/services/response-cache.js';

const makePayload = (content = 'hello') => ({
  model: 'llama3',
  messages: [{ role: 'user', content }],
  temperature: 0.7,
  max_tokens: 256,
});

const makeResponse = (text = 'Mock response') => ({
  choices: [{ message: { content: text, role: 'assistant' } }],
});

test('ResponseCache should initialize with defaults', () => {
  const cache = new ResponseCache({});
  assert.ok(cache);
  assert.strictEqual(cache.enabled, true);
  assert.strictEqual(cache.maxSize, 100);
  assert.strictEqual(cache.ttlMs, 300000);
});

test('ResponseCache should respect CACHE_ENABLED=false', () => {
  const cache = new ResponseCache({ CACHE_ENABLED: false });
  assert.strictEqual(cache.enabled, false);

  const payload = makePayload();
  const response = makeResponse();
  cache.set(payload, response);
  assert.strictEqual(cache.get(payload), null);
});

test('ResponseCache should store and retrieve responses', () => {
  const cache = new ResponseCache({});
  const payload = makePayload();
  const response = makeResponse();

  cache.set(payload, response);
  const result = cache.get(payload);

  assert.deepStrictEqual(result, response);
});

test('ResponseCache should return null for cache miss', () => {
  const cache = new ResponseCache({});
  const result = cache.get(makePayload('unknown'));

  assert.strictEqual(result, null);
});

test('ResponseCache should track hit/miss metrics', () => {
  const cache = new ResponseCache({});
  const payload = makePayload();
  cache.set(payload, makeResponse());

  cache.get(payload); // hit
  cache.get(makePayload('miss')); // miss

  const metrics = cache.getMetrics();
  assert.strictEqual(metrics.hits, 1);
  assert.strictEqual(metrics.misses, 1);
  assert.strictEqual(metrics.hitRatePercent, 50);
});

test('ResponseCache should evict oldest entry when at capacity', () => {
  const cache = new ResponseCache({ CACHE_MAX_SIZE: 2 });

  const p1 = makePayload('first');
  const p2 = makePayload('second');
  const p3 = makePayload('third');

  cache.set(p1, makeResponse('r1'));
  cache.set(p2, makeResponse('r2'));
  cache.set(p3, makeResponse('r3')); // should evict p1

  assert.strictEqual(cache.get(p1), null); // evicted
  assert.deepStrictEqual(cache.get(p2), makeResponse('r2'));
  assert.deepStrictEqual(cache.get(p3), makeResponse('r3'));

  const metrics = cache.getMetrics();
  assert.strictEqual(metrics.evictions, 1);
});

test('ResponseCache should expire entries after TTL', () => {
  const cache = new ResponseCache({ CACHE_TTL_MS: 1 }); // 1ms TTL
  const payload = makePayload();
  cache.set(payload, makeResponse());

  // Wait for TTL to expire
  const start = Date.now();
  while (Date.now() - start < 5) { /* busy wait */ }

  const result = cache.get(payload);
  assert.strictEqual(result, null);

  const metrics = cache.getMetrics();
  assert.strictEqual(metrics.expirations, 1);
});

test('ResponseCache should update LRU order on access', () => {
  const cache = new ResponseCache({ CACHE_MAX_SIZE: 2 });

  const p1 = makePayload('first');
  const p2 = makePayload('second');
  const p3 = makePayload('third');

  cache.set(p1, makeResponse('r1'));
  cache.set(p2, makeResponse('r2'));

  // Access p1 to make it most-recently-used
  cache.get(p1);

  // Add p3 - should evict p2 (now the oldest)
  cache.set(p3, makeResponse('r3'));

  assert.deepStrictEqual(cache.get(p1), makeResponse('r1')); // still present
  assert.strictEqual(cache.get(p2), null); // evicted
});

test('ResponseCache clear should remove all entries', () => {
  const cache = new ResponseCache({});
  cache.set(makePayload('a'), makeResponse('ra'));
  cache.set(makePayload('b'), makeResponse('rb'));

  const cleared = cache.clear();
  assert.strictEqual(cleared, 2);
  assert.strictEqual(cache.getMetrics().size, 0);
});

test('ResponseCache should produce different keys for different payloads', () => {
  const cache = new ResponseCache({});
  const p1 = makePayload('question one');
  const p2 = makePayload('question two');

  cache.set(p1, makeResponse('r1'));
  cache.set(p2, makeResponse('r2'));

  assert.deepStrictEqual(cache.get(p1), makeResponse('r1'));
  assert.deepStrictEqual(cache.get(p2), makeResponse('r2'));
});

test('ResponseCache resetMetrics should zero counters', () => {
  const cache = new ResponseCache({});
  cache.set(makePayload(), makeResponse());
  cache.get(makePayload());

  cache.resetMetrics();
  const metrics = cache.getMetrics();

  assert.strictEqual(metrics.hits, 0);
  assert.strictEqual(metrics.misses, 0);
  assert.strictEqual(metrics.sets, 0);
});

test('ResponseCache getMetrics should include all fields', () => {
  const cache = new ResponseCache({});
  const metrics = cache.getMetrics();

  assert.strictEqual(typeof metrics.hits, 'number');
  assert.strictEqual(typeof metrics.misses, 'number');
  assert.strictEqual(typeof metrics.evictions, 'number');
  assert.strictEqual(typeof metrics.expirations, 'number');
  assert.strictEqual(typeof metrics.sets, 'number');
  assert.strictEqual(typeof metrics.size, 'number');
  assert.strictEqual(typeof metrics.maxSize, 'number');
  assert.strictEqual(typeof metrics.ttlMs, 'number');
  assert.strictEqual(typeof metrics.enabled, 'boolean');
  assert.strictEqual(typeof metrics.hitRatePercent, 'number');
  assert.strictEqual(typeof metrics.startedAt, 'string');
});
