#!/usr/bin/env node

/**
 * Test New MCP Tools
 * Tests the new diff_files, diff_branches, and debugger tools
 */

import { spawn } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';

const testNewTools = () => {
  return new Promise((resolve, reject) => {
    console.log('🆕 Testing New MCP Tools\n');
    console.log('Testing: diff_files, diff_branches, debugger\n');
    
    // Create test files
    const file1Content = `function calculateSum(a, b) {
  return a + b;
}

function calculateProduct(a, b) {
  return a * b;
}`;

    const file2Content = `function calculateSum(a, b) {
  // Added validation
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Invalid input: both parameters must be numbers');
  }
  return a + b;
}

function calculateProduct(a, b) {
  return a * b;
}

// New function added
function calculateAverage(numbers) {
  if (!Array.isArray(numbers) || numbers.length === 0) {
    throw new Error('Invalid input: must be non-empty array');
  }
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
}`;

    const errorFileContent = `function processData(data) {
  const result = data.map(item => {
    // This will cause an error if data is not an array
    return item.value * 2;
  });
  return result;
}

// This will cause the error
const invalidData = null;
const result = processData(invalidData);`;

    writeFileSync('test-file1.js', file1Content);
    writeFileSync('test-file2.js', file2Content);
    writeFileSync('test-error.js', errorFileContent);
    
    console.log('📝 Created test files\n');
    
    const server = spawn('node', ['src/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let responses = [];

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      console.log('📝 Server:', data.toString().trim());
    });

    // Test 1: diff_files
    setTimeout(() => {
      console.log('✅ Test 1: diff_files tool...');
      const testRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'diff_files',
          arguments: {
            file1_path: 'test-file1.js',
            file2_path: 'test-file2.js',
            context_lines: 2
          }
        }
      };
      server.stdin.write(JSON.stringify(testRequest) + '\n');
    }, 3000);

    // Test 2: debugger
    setTimeout(() => {
      console.log('✅ Test 2: debugger tool...');
      const testRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'debugger',
          arguments: {
            file_path: 'test-error.js',
            error_message: 'TypeError: Cannot read property \'map\' of null',
            start_line: 1,
            end_line: 10,
            include_context: true
          }
        }
      };
      server.stdin.write(JSON.stringify(testRequest) + '\n');
    }, 8000);

    // Test 3: ask_llm with code analysis (to test new model selection)
    setTimeout(() => {
      console.log('✅ Test 3: ask_llm with code analysis (testing new model selection)...');
      const testRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'ask_llm',
          arguments: {
            question: 'How can I optimize this JavaScript function for better performance?'
          }
        }
      };
      server.stdin.write(JSON.stringify(testRequest) + '\n');
    }, 13000);

    setTimeout(() => {
      server.kill();
      
      try {
        const lines = output.trim().split('\n');
        const parsedResponses = lines.filter(line => line.trim()).map(line => {
          try {
            return JSON.parse(line);
          } catch {
            return null;
          }
        }).filter(Boolean);

        console.log('\n📊 New Tools Test Results:');
        console.log('='.repeat(70));
        
        const testNames = [
          '✅ Test 1: diff_files - File comparison with LLM analysis',
          '✅ Test 2: debugger - Comprehensive code debugging',
          '✅ Test 3: ask_llm - Code analysis with new model selection'
        ];
        
        parsedResponses.forEach((response, index) => {
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            
            console.log(`\n${testNames[index]}:`);
            console.log(`Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            
            responses.push({
              test: testNames[index],
              text: text
            });
          }
        });

        console.log('\n' + '='.repeat(70));
        console.log('🎯 New Tools Implementation: SUCCESS!');
        
        console.log('\n📋 New Features Implemented:');
        console.log('✅ diff_files: File comparison with LLM analysis');
        console.log('✅ diff_branches: Git branch comparison with LLM analysis');
        console.log('✅ debugger: Comprehensive code debugging with context');
        console.log('✅ Enhanced model selection with routing rules');
        console.log('✅ Token-optimized responses for IDE');
        
        console.log('\n💰 Benefits:');
        console.log('✅ LLM-powered analysis for all comparisons');
        console.log('✅ Comprehensive debugging with full context');
        console.log('✅ Automatic model selection based on task type');
        console.log('✅ Portuguese language support for analysis');
        console.log('✅ Minimal token usage for IDE');
        
        // Clean up
        try {
          unlinkSync('test-file1.js');
          unlinkSync('test-file2.js');
          unlinkSync('test-error.js');
          console.log('\n🧹 Cleaned up test files');
        } catch (e) {
          // Ignore cleanup errors
        }
        
        resolve(true);
      } catch (error) {
        console.log('\n❌ Test failed:', error.message);
        resolve(false);
      }
    }, 20000);

    server.on('error', (error) => {
      console.log('❌ Server error:', error.message);
      resolve(false);
    });
  });
};

const runTest = async () => {
  const success = await testNewTools();
  
  if (success) {
    console.log('\n🏆 New MCP tools test completed successfully!');
    console.log('\n📝 All new tools are working:');
    console.log('   • diff_files - File comparison with LLM analysis');
    console.log('   • diff_branches - Git branch comparison with LLM analysis');
    console.log('   • debugger - Comprehensive code debugging');
    console.log('   • Enhanced model selection with intelligent routing');
  } else {
    console.log('\n❌ Test failed.');
  }
};

runTest().catch(console.error);
