/**
 * Unit tests for AskLLMTool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { AskLLMTool } from '../../src/tools/AskLLMTool.js';
import { MockServer } from '../utils/mock-server.js';
import { assertResponseFormat } from '../utils/test-helpers.js';

test('AskLLMTool should have correct tool definition', () => {
  const mockServer = new MockServer();
  const tool = new AskLLMTool(mockServer);
  const definition = tool.getToolDefinition();
  
  assert.strictEqual(definition.name, 'ask_llm');
  assert.ok(definition.description);
  assert.ok(definition.inputSchema);
  assert.strictEqual(definition.inputSchema.required[0], 'question');
});

test('AskLLMTool should throw error if question is missing', async () => {
  const mockServer = new MockServer();
  const tool = new AskLLMTool(mockServer);
  
  await assert.rejects(async () => {
    await tool.handle({});
  }, /Question is required/);
});

test('AskLLMTool should throw error if question is not a string', async () => {
  const mockServer = new MockServer();
  const tool = new AskLLMTool(mockServer);
  
  await assert.rejects(async () => {
    await tool.handle({ question: 123 });
  }, /must be a string/);
});

test('AskLLMTool should call model runner with correct parameters', async () => {
  const mockServer = new MockServer();
  const tool = new AskLLMTool(mockServer);
  
  await tool.handle({ question: 'What is 2+2?' });
  
  assert.strictEqual(mockServer.callModelRunnerCalls.length, 1);
  const call = mockServer.callModelRunnerCalls[0];
  
  assert.ok(call.model);
  assert.ok(call.messages);
  assert.strictEqual(call.messages[0].role, 'user');
  assert.strictEqual(call.messages[0].content, 'What is 2+2?');
  assert.ok(typeof call.temperature === 'number');
  assert.ok(typeof call.max_tokens === 'number');
});

test('AskLLMTool should return properly formatted response', async () => {
  const mockServer = new MockServer();
  const tool = new AskLLMTool(mockServer);
  
  const response = await tool.handle({ question: 'Test question' });
  
  assertResponseFormat(response);
  assert.strictEqual(response.content[0].type, 'text');
  assert.ok(response.content[0].text);
});

test('AskLLMTool should select best model based on question', async () => {
  const mockServer = new MockServer();
  const tool = new AskLLMTool(mockServer);
  
  await tool.handle({ question: 'How to debug this code?' });
  
  assert.strictEqual(mockServer.selectBestModelCalls.length, 1);
  assert.ok(mockServer.selectBestModelCalls[0].includes('debug') || 
            mockServer.selectBestModelCalls[0].includes('code'));
});
