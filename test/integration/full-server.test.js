/**
 * End-to-end integration test: Full server functionality
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

function sendMCPRequest(server, request) {
  return new Promise((resolve, reject) => {
    let output = '';
    let buffer = '';
    
    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Request timeout'));
    }, 15000);
    
    server.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.trim()) {
          try {
            const response = JSON.parse(line);
            if (response.id === request.id) {
              clearTimeout(timeout);
              resolve(response);
              return;
            }
          } catch {
            // Not JSON, continue
          }
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      // Ignore stderr for now
    });
    
    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

test('Server should start and respond to initialization', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    // Wait a bit for server to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test tools/list
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    };
    
    const response = await sendMCPRequest(server, listRequest);
    
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.tools));
    assert.ok(response.result.tools.length > 0);
    
    // Verify we have expected tools
    const toolNames = response.result.tools.map(t => t.name);
    assert.ok(toolNames.includes('ask_llm'), 'Should have ask_llm tool');
    assert.ok(toolNames.includes('check_llm_status'), 'Should have check_llm_status tool');
    assert.ok(toolNames.includes('humanize_content'), 'Should have humanize_content tool');
  } finally {
    server.kill();
  }
});

test('Server should handle multiple sequential requests', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Request 1: List tools
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    };
    const listResponse = await sendMCPRequest(server, listRequest);
    assert.ok(listResponse.result.tools);
    
    // Request 2: Check LLM status
    const statusRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'check_llm_status',
        arguments: {},
      },
    };
    const statusResponse = await sendMCPRequest(server, statusRequest);
    assert.ok(statusResponse.result);
    
    // Request 3: List prompts
    const promptsRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'prompts/list',
      params: {},
    };
    const promptsResponse = await sendMCPRequest(server, promptsRequest);
    assert.ok(promptsResponse.result.prompts);
  } finally {
    server.kill();
  }
});

test('Server should handle invalid requests gracefully', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Invalid tool name
    const invalidRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {},
      },
    };
    
    const response = await sendMCPRequest(server, invalidRequest);
    assert.ok(response.result);
    assert.strictEqual(response.result.isError, true);
    assert.ok(response.result.content[0].text.includes('Error'));
  } finally {
    server.kill();
  }
});

test('Server should handle tool calls with missing required parameters', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Call ask_llm without required 'question' parameter
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: 'ask_llm',
        arguments: {},
      },
    };
    
    const response = await sendMCPRequest(server, request);
    assert.ok(response.result);
    assert.strictEqual(response.result.isError, true);
  } finally {
    server.kill();
  }
});

test('Server should provide resources', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // List resources
    const listRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
      params: {},
    };
    const listResponse = await sendMCPRequest(server, listRequest);
    assert.ok(listResponse.result.resources);
    assert.ok(listResponse.result.resources.length > 0);
    
    // Read a resource
    const readRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: {
        uri: 'mcp://local-llm/config',
      },
    };
    const readResponse = await sendMCPRequest(server, readRequest);
    assert.ok(readResponse.result);
    assert.ok(readResponse.result.contents);
  } finally {
    server.kill();
  }
});
