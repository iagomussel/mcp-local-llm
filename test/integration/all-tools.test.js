/**
 * Integration test: Verify all tools are registered and have valid definitions
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ALL_TOOLS } from '../../src/tools/index.js';

test('All tools should be exported from index', () => {
  assert.ok(Array.isArray(ALL_TOOLS));
  assert.ok(ALL_TOOLS.length > 0, 'Should have at least one tool');
  
  // Verify all tools are classes
  ALL_TOOLS.forEach((ToolClass, index) => {
    assert.ok(ToolClass, `Tool at index ${index} should exist`);
    assert.strictEqual(typeof ToolClass, 'function', `Tool at index ${index} should be a class`);
  });
});

test('Server should initialize all tools', async () => {
  // Test tool initialization by creating instances
  const mockServer = {
    CONFIG: {
      OLLAMA_URL: 'http://localhost:11434',
      DEFAULT_MODEL: 'llama3',
      MAX_TOKENS: 256,
      TEMPERATURE: 0.7,
    },
    async callModelRunner() {},
    async selectBestModel() {},
    getOptimalTemperature() {},
    getOptimalMaxTokens() {},
  };
  
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  
  assert.ok(tools.size > 0, 'Server should have tools registered');
  assert.strictEqual(
    tools.size,
    ALL_TOOLS.length,
    `Expected ${ALL_TOOLS.length} tools, got ${tools.size}`
  );
});

test('All tools should have valid tool definitions', () => {
  const mockServer = {
    CONFIG: {
      OLLAMA_URL: 'http://localhost:11434',
      DEFAULT_MODEL: 'llama3',
      MAX_TOKENS: 256,
      TEMPERATURE: 0.7,
    },
    async callModelRunner() {
      return { choices: [{ message: { content: 'test' } }] };
    },
    async selectBestModel() {
      return 'llama3';
    },
    getOptimalTemperature() {
      return 0.7;
    },
    getOptimalMaxTokens() {
      return 256;
    },
  };

  ALL_TOOLS.forEach((ToolClass) => {
    try {
      const tool = new ToolClass(mockServer);
      const definition = tool.getToolDefinition();
      
      // Verify tool definition structure
      assert.ok(definition, 'Tool should have a definition');
      assert.strictEqual(typeof definition.name, 'string', 'Tool should have a name');
      assert.ok(definition.name.length > 0, 'Tool name should not be empty');
      assert.strictEqual(typeof definition.description, 'string', 'Tool should have a description');
      assert.ok(definition.inputSchema, 'Tool should have an inputSchema');
      assert.strictEqual(definition.inputSchema.type, 'object', 'inputSchema should be an object');
      assert.ok(definition.inputSchema.properties, 'inputSchema should have properties');
    } catch (error) {
      throw new Error(`Tool ${ToolClass.name} failed validation: ${error.message}`);
    }
  });
});

test('All tool names should be unique', () => {
  const mockServer = {
    CONFIG: {},
    async callModelRunner() {},
    async selectBestModel() {},
    getOptimalTemperature() {},
    getOptimalMaxTokens() {},
  };

  const toolNames = new Set();
  
  ALL_TOOLS.forEach((ToolClass) => {
    const tool = new ToolClass(mockServer);
    const definition = tool.getToolDefinition();
    const name = definition.name;
    
    assert.ok(!toolNames.has(name), `Duplicate tool name found: ${name}`);
    toolNames.add(name);
  });
  
  assert.strictEqual(toolNames.size, ALL_TOOLS.length, 'All tools should have unique names');
});

test('Server should list all tools via MCP protocol', async () => {
  const mockServer = {
    CONFIG: {},
    async callModelRunner() {},
    async selectBestModel() {},
    getOptimalTemperature() {},
    getOptimalMaxTokens() {},
  };
  
  // Simulate MCP tools/list request
  const tools = ALL_TOOLS.map(ToolClass => {
    const tool = new ToolClass(mockServer);
    return tool.getToolDefinition();
  });
  
  assert.ok(Array.isArray(tools));
  assert.strictEqual(tools.length, ALL_TOOLS.length);
  
  // Verify each tool has required fields
  tools.forEach((tool, index) => {
    assert.ok(tool.name, `Tool at index ${index} should have a name`);
    assert.ok(tool.description, `Tool at index ${index} should have a description`);
    assert.ok(tool.inputSchema, `Tool at index ${index} should have an inputSchema`);
  });
});
