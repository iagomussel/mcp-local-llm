/**
 * Integration test: Server initialization and tool registration
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { ALL_TOOLS } from '../../src/tools/index.js';

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

test('Server should initialize all tools without errors', () => {
  assert.doesNotThrow(() => {
    const tools = new Map();
    for (const ToolClass of ALL_TOOLS) {
      const tool = new ToolClass(mockServer);
      tools.set(tool.getToolDefinition().name, tool);
    }
    assert.ok(tools.size > 0);
  });
});

test('Server should register all tools from ALL_TOOLS', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  
  assert.strictEqual(
    tools.size,
    ALL_TOOLS.length,
    `Expected ${ALL_TOOLS.length} tools, but got ${tools.size}`
  );
});

test('Server should have all expected core tools', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  const toolNames = Array.from(tools.keys());
  
  const expectedTools = [
    'ask_llm',
    'check_llm_status',
    'humanize_content',
    'humanize_compact',
    'humanize_file',
    'run_command',
  ];
  
  expectedTools.forEach(toolName => {
    assert.ok(
      toolNames.includes(toolName),
      `Expected tool '${toolName}' not found. Available: ${toolNames.join(', ')}`
    );
  });
});

test('Server should have memory tools', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  const toolNames = Array.from(tools.keys());
  
  const memoryTools = [
    'memory_store',
    'memory_retrieve',
    'memory_update',
    'memory_delete',
    'memory_search',
  ];
  
  memoryTools.forEach(toolName => {
    assert.ok(
      toolNames.includes(toolName),
      `Expected memory tool '${toolName}' not found`
    );
  });
});

test('Server should have code analysis tools', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  const toolNames = Array.from(tools.keys());
  
  const codeTools = [
    'diff_files',
    'diff_branches',
    'debugger',
    'git_diff_file',
    'search_code_usage',
    'analyze_huge_file',
  ];
  
  codeTools.forEach(toolName => {
    assert.ok(
      toolNames.includes(toolName),
      `Expected code tool '${toolName}' not found`
    );
  });
});

test('Server should have documentor tools', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  const toolNames = Array.from(tools.keys());
  
  const docTools = [
    'documentor_api',
    'documentor_code',
    'documentor_readme',
  ];
  
  docTools.forEach(toolName => {
    assert.ok(
      toolNames.includes(toolName),
      `Expected documentor tool '${toolName}' not found`
    );
  });
});

test('Server should have thinking layer tool', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  const toolNames = Array.from(tools.keys());
  
  assert.ok(
    toolNames.includes('think_through'),
    'Expected think_through tool not found'
  );
});

test('Server should have context compression tools', () => {
  const tools = new Map();
  for (const ToolClass of ALL_TOOLS) {
    const tool = new ToolClass(mockServer);
    tools.set(tool.getToolDefinition().name, tool);
  }
  const toolNames = Array.from(tools.keys());
  
  const compressionTools = [
    'analyze_huge_file',
    'digest_error_logs',
    'codebase_discovery',
  ];
  
  compressionTools.forEach(toolName => {
    assert.ok(
      toolNames.includes(toolName),
      `Expected compression tool '${toolName}' not found`
    );
  });
});

test('Server CONFIG should have all required properties', () => {
  assert.ok(mockServer.CONFIG);
  assert.ok(mockServer.CONFIG.OLLAMA_URL);
  assert.ok(mockServer.CONFIG.DEFAULT_MODEL);
  assert.ok(typeof mockServer.CONFIG.MAX_TOKENS === 'number');
  assert.ok(typeof mockServer.CONFIG.TEMPERATURE === 'number');
});
