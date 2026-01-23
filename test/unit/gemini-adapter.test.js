import { test } from 'node:test';
import assert from 'node:assert';
import { GeminiAdapter } from '../../src/adapters/gemini/index.js';
import { GEMINI_CONSTANTS } from '../../src/adapters/gemini/index.js';

test('GeminiAdapter should have correct structure', () => {
  const adapter = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
  });

  assert.ok(adapter instanceof GeminiAdapter);
  assert.strictEqual(adapter.getProviderName(), 'gemini');
});

test('GeminiAdapter should validate configuration', () => {
  // Test missing API key
  const adapter1 = new GeminiAdapter({});
  assert.throws(() => {
    adapter1.validateConfig();
  }, /GEMINI_API_KEY is required/);

  // Test with API key
  const adapter2 = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
  });
  assert.doesNotThrow(() => {
    adapter2.validateConfig();
  });
});

test('GeminiAdapter should use default model', () => {
  const adapter = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
  });

  const defaultModel = adapter.getDefaultModel();
  assert.strictEqual(defaultModel, GEMINI_CONSTANTS.DEFAULT_MODEL);
});

test('GeminiAdapter should use custom default model', () => {
  const adapter = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
    DEFAULT_MODEL: 'gemini-1.5-pro',
  });

  const defaultModel = adapter.getDefaultModel();
  assert.strictEqual(defaultModel, 'gemini-1.5-pro');
});

test('GeminiAdapter should transform messages to Gemini format', () => {
  const adapter = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
  });

  const messages = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there!' },
    { role: 'user', content: 'How are you?' },
  ];

  const transformed = adapter.transformMessagesToGeminiFormat(messages);

  assert.strictEqual(transformed.length, 3);
  assert.strictEqual(transformed[0].role, 'user');
  assert.strictEqual(transformed[1].role, 'model');
  assert.strictEqual(transformed[2].role, 'user');
  assert.ok(transformed[0].parts);
  assert.ok(transformed[0].parts[0].text);
});

test('GeminiAdapter should transform response to standard format', () => {
  const adapter = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
  });

  const geminiResponse = {
    candidates: [{
      content: {
        parts: [
          { text: 'Hello, ' },
          { text: 'world!' }
        ]
      }
    }]
  };

  const transformed = adapter.transformResponse(geminiResponse);

  assert.ok(transformed.choices);
  assert.strictEqual(transformed.choices.length, 1);
  assert.strictEqual(transformed.choices[0].message.content, 'Hello, world!');
  assert.strictEqual(transformed.choices[0].message.role, 'assistant');
});

test('GeminiAdapter should throw error on empty response', () => {
  const adapter = new GeminiAdapter({
    GEMINI_API_KEY: 'test-key',
  });

  assert.throws(() => {
    adapter.transformResponse({ candidates: [] });
  }, /No candidate in Gemini response/);
});

test('GeminiAdapter should use constants', () => {
  assert.ok(GEMINI_CONSTANTS);
  assert.strictEqual(GEMINI_CONSTANTS.DEFAULT_MODEL, 'gemini-2.5-flash');
  assert.ok(Array.isArray(GEMINI_CONSTANTS.MODELS));
  assert.ok(GEMINI_CONSTANTS.MODELS.length > 0);
});
