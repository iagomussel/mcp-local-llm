/**
 * Integration tests for MCP Server
 */

import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

function sendMCPRequest(server, request) {
  return new Promise((resolve, reject) => {
    let output = '';
    let errorOutput = '';
    
    const timeout = setTimeout(() => {
      server.kill();
      reject(new Error('Request timeout'));
    }, 10000);
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      const lines = output.trim().split('\n');
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
      errorOutput += data.toString();
    });
    
    server.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    
    server.stdin.write(JSON.stringify(request) + '\n');
  });
}

test('Server should respond to list_tools request', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
      params: {},
    };
    
    const response = await sendMCPRequest(server, request);
    
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.tools));
    assert.ok(response.result.tools.length > 0);
    
    const askLLMTool = response.result.tools.find(t => t.name === 'ask_llm');
    assert.ok(askLLMTool);
    assert.ok(askLLMTool.description);
  } finally {
    server.kill();
  }
});

test('Server should respond to tools/call request', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    const request = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'check_llm_status',
        arguments: {},
      },
    };
    
    const response = await sendMCPRequest(server, request);
    
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.ok(response.result);
    assert.ok(response.result.content);
    assert.ok(Array.isArray(response.result.content));
  } finally {
    server.kill();
  }
});

test('Server should handle invalid tool name', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    const request = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'invalid_tool',
        arguments: {},
      },
    };
    
    const response = await sendMCPRequest(server, request);
    
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.ok(response.result);
    assert.strictEqual(response.result.isError, true);
    assert.ok(response.result.content[0].text.includes('Error'));
  } finally {
    server.kill();
  }
});

test('Server should respond to prompts/list request', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    const request = {
      jsonrpc: '2.0',
      id: 4,
      method: 'prompts/list',
      params: {},
    };
    
    const response = await sendMCPRequest(server, request);
    
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.prompts));
    assert.ok(response.result.prompts.length > 0);
  } finally {
    server.kill();
  }
});

test('Server should respond to resources/list request', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd(),
  });
  
  try {
    const request = {
      jsonrpc: '2.0',
      id: 5,
      method: 'resources/list',
      params: {},
    };
    
    const response = await sendMCPRequest(server, request);
    
    assert.strictEqual(response.jsonrpc, '2.0');
    assert.ok(response.result);
    assert.ok(Array.isArray(response.result.resources));
    assert.ok(response.result.resources.length > 0);
  } finally {
    server.kill();
  }
});
