/**
 * Unit tests for CheckLLMStatusTool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { CheckLLMStatusTool } from '../../src/tools/CheckLLMStatusTool.js';
import { MockServer } from '../utils/mock-server.js';
import { assertResponseFormat } from '../utils/test-helpers.js';

test('CheckLLMStatusTool should have correct tool definition', () => {
  const mockServer = new MockServer();
  const tool = new CheckLLMStatusTool(mockServer);
  const definition = tool.getToolDefinition();
  
  assert.strictEqual(definition.name, 'check_llm_status');
  assert.ok(definition.description);
  assert.ok(definition.inputSchema);
});

test('CheckLLMStatusTool should check Ollama status', async () => {
  const mockServer = new MockServer();
  
  // Mock getAvailableModels to return models
  mockServer.getAvailableModels = async () => ['llama3', 'llama3.1'];
  
  const tool = new CheckLLMStatusTool(mockServer);
  const response = await tool.handle({});
  
  assertResponseFormat(response);
  assert.ok(response.content[0].text);
});

test('CheckLLMStatusTool should handle Ollama unavailable', async () => {
  const mockServer = new MockServer();
  
  // Mock getAvailableModels to throw an error (simulating Ollama not accessible)
  mockServer.getAvailableModels = async () => {
    throw new Error('ECONNREFUSED');
  };
  
  const tool = new CheckLLMStatusTool(mockServer);
  const response = await tool.handle({});
  
  assertResponseFormat(response);
  assert.ok(response.content[0].text.includes('not accessible') || 
            response.content[0].text.includes('Error') ||
            response.content[0].text.includes('ECONNREFUSED'));
});
