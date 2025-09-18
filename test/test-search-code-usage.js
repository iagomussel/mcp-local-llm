#!/usr/bin/env node

/**
 * Test script for the search_code_usage tool
 * This demonstrates how to use the new MCP tool for code analysis
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test the search_code_usage tool
async function testSearchCodeUsage() {
  console.log('🔍 Testing search_code_usage tool...\n');

  const testCases = [
    {
      name: 'Search for "userService" in JavaScript files',
      args: {
        root_path: path.join(__dirname),
        term: 'userService',
        file_types: ['.js'],
        include_declarations: true,
        include_usages: true,
        context_lines: 2,
        max_results: 10
      }
    },
    {
      name: 'Search for "UserService" class declarations',
      args: {
        root_path: path.join(__dirname),
        term: 'UserService',
        file_types: ['.js', '.ts', '.py'],
        include_declarations: true,
        include_usages: false,
        context_lines: 3,
        max_results: 20
      }
    },
    {
      name: 'Search for "getUserById" function usage',
      args: {
        root_path: path.join(__dirname),
        term: 'getUserById',
        file_types: ['.js', '.ts', '.py'],
        include_declarations: true,
        include_usages: true,
        context_lines: 2,
        max_results: 15
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n📋 Test: ${testCase.name}`);
    console.log('─'.repeat(50));
    
    try {
      const result = await callMCPTool('search_code_usage', testCase.args);
      console.log('✅ Success!');
      console.log('Result:', result);
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

// Helper function to call MCP tool
function callMCPTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const serverPath = path.join(__dirname, '..', 'src', 'index.js');
    
    const process = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // Send MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    process.stdin.write(JSON.stringify(request) + '\n');
    process.stdin.end();

    process.on('close', (code) => {
      if (code === 0) {
        try {
          const lines = output.trim().split('\n');
          const lastLine = lines[lines.length - 1];
          const response = JSON.parse(lastLine);
          resolve(response.result);
        } catch (error) {
          reject(new Error(`Failed to parse response: ${error.message}`));
        }
      } else {
        reject(new Error(`Process exited with code ${code}: ${errorOutput}`));
      }
    });

    process.on('error', (error) => {
      reject(new Error(`Process error: ${error.message}`));
    });
  });
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testSearchCodeUsage().catch(console.error);
}

export { testSearchCodeUsage, callMCPTool };
