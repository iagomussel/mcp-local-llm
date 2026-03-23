/**
 * Unit tests for RequestQueue
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { RequestQueue } from '../../src/services/request-queue.js';

const makePayload = (question = 'test') => ({
  model: 'test-model',
  messages: [{ role: 'user', content: question }],
  temperature: 0.7,
  max_tokens: 256,
});

const makeExecuteFn = (response = { choices: [{ message: { content: 'ok' } }] }, delayMs = 0) => {
  return async () => {
    if (delayMs > 0) await new Promise(r => setTimeout(r, delayMs));
    return response;
  };
};

const makeFailingFn = (failCount, response = { choices: [{ message: { content: 'ok' } }] }) => {
  let calls = 0;
  return async () => {
    calls++;
    if (calls <= failCount) {
      const error = new Error('Connection refused');
      error.code = 'ECONNREFUSED';
      throw error;
    }
    return response;
  };
};

test('RequestQueue should initialize with default config', () => {
  const queue = new RequestQueue({});
  assert.strictEqual(queue.maxConcurrent, 3);
  assert.strictEqual(queue.maxRetries, 2);
  assert.strictEqual(queue.activeRequests, 0);
});

test('RequestQueue should initialize with custom config', () => {
  const queue = new RequestQueue({
    QUEUE_MAX_CONCURRENT: '5',
    QUEUE_MAX_RETRIES: '3',
    QUEUE_RETRY_DELAY_MS: '500',
    QUEUE_DEDUP_TTL_MS: '10000',
  });
  assert.strictEqual(queue.maxConcurrent, 5);
  assert.strictEqual(queue.maxRetries, 3);
  assert.strictEqual(queue.retryBaseDelay, 500);
  assert.strictEqual(queue.deduplicationTTL, 10000);
});

test('RequestQueue should execute a single request', async () => {
  const queue = new RequestQueue({});
  const payload = makePayload();
  const result = await queue.enqueue(makeExecuteFn({ answer: 'hello' }), payload);

  assert.deepStrictEqual(result, { answer: 'hello' });
  assert.strictEqual(queue.metrics.totalRequests, 1);
  assert.strictEqual(queue.metrics.completedRequests, 1);
});

test('RequestQueue should deduplicate identical in-flight requests', async () => {
  const queue = new RequestQueue({ QUEUE_DEDUP_TTL_MS: '100' });
  const payload = makePayload('same question');
  let callCount = 0;
  const executeFn = async () => {
    callCount++;
    await new Promise(r => setTimeout(r, 50));
    return { result: 'deduped' };
  };

  const [r1, r2] = await Promise.all([
    queue.enqueue(executeFn, payload),
    queue.enqueue(executeFn, payload),
  ]);

  assert.deepStrictEqual(r1, { result: 'deduped' });
  assert.deepStrictEqual(r2, { result: 'deduped' });
  assert.strictEqual(callCount, 1); // Only one actual call
  assert.strictEqual(queue.metrics.deduplicatedRequests, 1);
});

test('RequestQueue should not deduplicate different payloads', async () => {
  const queue = new RequestQueue({});
  let callCount = 0;
  const executeFn = async () => {
    callCount++;
    await new Promise(r => setTimeout(r, 10));
    return { result: callCount };
  };

  await Promise.all([
    queue.enqueue(executeFn, makePayload('question A')),
    queue.enqueue(executeFn, makePayload('question B')),
  ]);

  assert.strictEqual(callCount, 2);
});

test('RequestQueue should respect concurrency limit', async () => {
  const queue = new RequestQueue({ QUEUE_MAX_CONCURRENT: '2' });
  let peakConcurrent = 0;
  let currentConcurrent = 0;

  const executeFn = async () => {
    currentConcurrent++;
    peakConcurrent = Math.max(peakConcurrent, currentConcurrent);
    await new Promise(r => setTimeout(r, 50));
    currentConcurrent--;
    return { ok: true };
  };

  await Promise.all([
    queue.enqueue(executeFn, makePayload('a')),
    queue.enqueue(executeFn, makePayload('b')),
    queue.enqueue(executeFn, makePayload('c')),
    queue.enqueue(executeFn, makePayload('d')),
  ]);

  assert.ok(peakConcurrent <= 2, `Peak concurrent was ${peakConcurrent}, expected <= 2`);
  assert.strictEqual(queue.metrics.completedRequests, 4);
});

test('RequestQueue should retry on retryable errors', async () => {
  const queue = new RequestQueue({ QUEUE_MAX_RETRIES: '2', QUEUE_RETRY_DELAY_MS: '10' });
  const executeFn = makeFailingFn(1, { retried: true });

  const result = await queue.enqueue(executeFn, makePayload());

  assert.deepStrictEqual(result, { retried: true });
  assert.strictEqual(queue.metrics.retriedRequests, 1);
  assert.strictEqual(queue.metrics.completedRequests, 1);
});

test('RequestQueue should fail after exhausting retries', async () => {
  const queue = new RequestQueue({ QUEUE_MAX_RETRIES: '1', QUEUE_RETRY_DELAY_MS: '10' });
  const executeFn = makeFailingFn(5); // Fails more times than retries allow

  await assert.rejects(
    () => queue.enqueue(executeFn, makePayload()),
    { message: 'Connection refused' }
  );

  assert.strictEqual(queue.metrics.failedRequests, 1);
});

test('RequestQueue should not retry 4xx errors', async () => {
  const queue = new RequestQueue({ QUEUE_MAX_RETRIES: '2', QUEUE_RETRY_DELAY_MS: '10' });
  let callCount = 0;
  const executeFn = async () => {
    callCount++;
    const error = new Error('Bad request');
    error.response = { status: 400 };
    throw error;
  };

  await assert.rejects(
    () => queue.enqueue(executeFn, makePayload()),
    { message: 'Bad request' }
  );

  assert.strictEqual(callCount, 1); // No retries for 4xx
  assert.strictEqual(queue.metrics.retriedRequests, 0);
});

test('RequestQueue getMetrics should return correct snapshot', async () => {
  const queue = new RequestQueue({});
  await queue.enqueue(makeExecuteFn(), makePayload());

  const metrics = queue.getMetrics();

  assert.strictEqual(metrics.totalRequests, 1);
  assert.strictEqual(metrics.completedRequests, 1);
  assert.strictEqual(metrics.failedRequests, 0);
  assert.strictEqual(metrics.activeRequests, 0);
  assert.strictEqual(metrics.pendingRequests, 0);
  assert.ok(metrics.avgLatencyMs >= 0);
  assert.ok(typeof metrics.uptime === 'string');
});

test('RequestQueue resetMetrics should clear counters', async () => {
  const queue = new RequestQueue({});
  await queue.enqueue(makeExecuteFn(), makePayload());
  queue.resetMetrics();

  const metrics = queue.getMetrics();
  assert.strictEqual(metrics.totalRequests, 0);
  assert.strictEqual(metrics.completedRequests, 0);
});

test('RequestQueue getQueueStatus should return state', () => {
  const queue = new RequestQueue({ QUEUE_MAX_CONCURRENT: '5' });
  const status = queue.getQueueStatus();

  assert.strictEqual(status.active, 0);
  assert.strictEqual(status.pending, 0);
  assert.strictEqual(status.maxConcurrent, 5);
});
