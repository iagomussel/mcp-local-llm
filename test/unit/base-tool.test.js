/**
 * Unit tests for BaseTool
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { BaseTool } from '../../src/tools/BaseTool.js';
import { MockServer } from '../utils/mock-server.js';

class TestTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'test_tool',
      description: 'Test tool',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    };
  }

  async handle(args) {
    return {
      content: [{ type: 'text', text: 'test response' }],
    };
  }
}

test('BaseTool should initialize with server', () => {
  const mockServer = new MockServer();
  const tool = new TestTool(mockServer);
  
  assert.strictEqual(tool.server, mockServer);
});

test('BaseTool should throw error if getToolDefinition not implemented', () => {
  const mockServer = new MockServer();
  const tool = new BaseTool(mockServer);
  
  assert.throws(() => {
    tool.getToolDefinition();
  }, /getToolDefinition must be implemented/);
});

test('BaseTool should throw error if handle not implemented', async () => {
  const mockServer = new MockServer();
  const tool = new BaseTool(mockServer);
  
  await assert.rejects(async () => {
    await tool.handle({});
  }, /handle must be implemented/);
});

test('BaseTool should provide helper methods', () => {
  const mockServer = new MockServer();
  const tool = new TestTool(mockServer);
  
  assert.strictEqual(typeof tool.callModelRunner, 'function');
  assert.strictEqual(typeof tool.selectBestModel, 'function');
  assert.strictEqual(typeof tool.getOptimalTemperature, 'function');
  assert.strictEqual(typeof tool.getOptimalMaxTokens, 'function');
});

test('BaseTool helper methods should delegate to server', async () => {
  const mockServer = new MockServer();
  const tool = new TestTool(mockServer);
  
  await tool.callModelRunner({ model: 'test', messages: [] });
  assert.strictEqual(mockServer.callModelRunnerCalls.length, 1);
  
  await tool.selectBestModel('test question');
  assert.strictEqual(mockServer.selectBestModelCalls.length, 1);
  
  const temp = tool.getOptimalTemperature('test');
  assert.strictEqual(typeof temp, 'number');
  
  const tokens = tool.getOptimalMaxTokens('test');
  assert.strictEqual(typeof tokens, 'number');
});
