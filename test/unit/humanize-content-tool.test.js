/**
 * Unit tests for HumanizeContentTool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { HumanizeContentTool } from '../../src/tools/HumanizeContentTool.js';
import { MockServer } from '../utils/mock-server.js';
import { assertResponseFormat } from '../utils/test-helpers.js';
import { createTempFile, cleanupTempFile } from '../utils/test-helpers.js';

test('HumanizeContentTool should have correct tool definition', () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  const definition = tool.getToolDefinition();
  
  assert.strictEqual(definition.name, 'humanize_content');
  assert.ok(definition.description);
  assert.ok(definition.inputSchema);
  assert.strictEqual(definition.inputSchema.required[0], 'content');
});

test('HumanizeContentTool should throw error if content is missing', async () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  await assert.rejects(async () => {
    await tool.handle({});
  }, /Content is required/);
});

test('HumanizeContentTool should handle plain text content', async () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  const response = await tool.handle({ content: 'This is a test text' });
  
  assertResponseFormat(response);
  assert.strictEqual(mockServer.callModelRunnerCalls.length, 1);
});

test('HumanizeContentTool should detect file paths', () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  assert.strictEqual(tool.isFilePath('./test.js'), true);
  assert.strictEqual(tool.isFilePath('/path/to/file.txt'), true);
  assert.strictEqual(tool.isFilePath('C:\\path\\to\\file.md'), true);
  assert.strictEqual(tool.isFilePath('plain text'), false);
});

test('HumanizeContentTool should detect URLs', () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  assert.strictEqual(tool.isUrl('https://example.com'), true);
  assert.strictEqual(tool.isUrl('http://example.com'), true);
  assert.strictEqual(tool.isUrl('not a url'), false);
});

test('HumanizeContentTool should read file content', async () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  const filePath = createTempFile('Test file content');
  
  try {
    const text = await tool.extractTextFromFile(filePath);
    assert.strictEqual(text, 'Test file content');
  } finally {
    cleanupTempFile(filePath);
  }
});

test('HumanizeContentTool should use higher temperature for humanization', async () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  await tool.handle({ content: 'Test content' });
  
  const call = mockServer.callModelRunnerCalls[0];
  assert.ok(call.temperature >= 0.8);
});

test('HumanizeContentTool should handle compact requests', async () => {
  const mockServer = new MockServer();
  const tool = new HumanizeContentTool(mockServer);
  
  await tool.handle({ content: 'compact summary text' });
  
  const call = mockServer.callModelRunnerCalls[0];
  assert.ok(call.messages[0].content.includes('Concise'));
});
