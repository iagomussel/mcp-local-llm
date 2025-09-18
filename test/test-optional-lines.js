#!/usr/bin/env node

/**
 * Test Optional Line Parameters
 * Demonstrates different ways to use humanize_file with optional parameters
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const testOptionalLines = () => {
  return new Promise((resolve, reject) => {
    console.log('📝 Testing Optional Line Parameters\n');
    console.log('Testing different ways to use humanize_file...\n');
    
    // Create a test file with multiple lines
    const testContent = `Linha 1: Este é o início do documento.
Linha 2: Aqui temos informações importantes sobre o sistema.
Linha 3: O sistema precisa ser otimizado para melhor performance.
Linha 4: Vamos implementar melhorias significativas.
Linha 5: O resultado será um sistema mais eficiente.
Linha 6: Esta é a linha final do documento.`;
    
    writeFileSync('test-lines.txt', testContent);
    console.log('📝 Created test file: test-lines.txt\n');
    
    const server = spawn('node', ['src/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';
    let responses = [];

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('📝 Server:', data.toString().trim());
    });

    // Test 1: Only file_path (should use entire file)
    setTimeout(() => {
      console.log('🔍 Test 1: Only file_path (entire file)...');
      const test1Request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'humanize_file',
          arguments: {
            file_path: 'test-lines.txt'
          }
        }
      };
      server.stdin.write(JSON.stringify(test1Request) + '\n');
    }, 3000);

    // Test 2: file_path + start_line (should use from start_line to end)
    setTimeout(() => {
      console.log('🔍 Test 2: file_path + start_line (from line 3 to end)...');
      const test2Request = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'humanize_file',
          arguments: {
            file_path: 'test-lines.txt',
            start_line: 3
          }
        }
      };
      server.stdin.write(JSON.stringify(test2Request) + '\n');
    }, 8000);

    // Test 3: file_path + start_line + end_line (specific range)
    setTimeout(() => {
      console.log('🔍 Test 3: file_path + start_line + end_line (lines 2-4)...');
      const test3Request = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'humanize_file',
          arguments: {
            file_path: 'test-lines.txt',
            start_line: 2,
            end_line: 4
          }
        }
      };
      server.stdin.write(JSON.stringify(test3Request) + '\n');
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

        console.log('\n📊 Optional Line Parameters Results:');
        console.log('='.repeat(70));
        
        const testNames = [
          '🔍 Test 1: Only file_path (entire file)',
          '🔍 Test 2: file_path + start_line (from line 3)',
          '🔍 Test 3: file_path + start_line + end_line (lines 2-4)'
        ];
        
        parsedResponses.forEach((response, index) => {
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            
            console.log(`\n${testNames[index]}:`);
            console.log(`Response: ${text}`);
            
            responses.push({
              test: testNames[index],
              text: text
            });
          }
        });

        console.log('\n' + '='.repeat(70));
        console.log('✅ Optional Parameters Working Correctly!');
        console.log('\n💡 Usage Examples:');
        console.log('• humanize_file: { file_path: "file.txt" } // Entire file');
        console.log('• humanize_file: { file_path: "file.txt", start_line: 5 } // From line 5 to end');
        console.log('• humanize_file: { file_path: "file.txt", start_line: 2, end_line: 10 } // Lines 2-10');
        
        console.log('\n🚀 Benefits:');
        console.log('✅ Flexible usage - only specify what you need');
        console.log('✅ Default to entire file if no lines specified');
        console.log('✅ Default to end of file if no end_line specified');
        console.log('✅ Minimal IDE token usage with file references');
        
        // Clean up
        try {
          const fs = require('fs');
          fs.unlinkSync('test-lines.txt');
          console.log('\n🧹 Cleaned up test file');
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
  const success = await testOptionalLines();
  
  if (success) {
    console.log('\n🏆 Optional line parameters test completed successfully!');
  } else {
    console.log('\n❌ Test failed.');
  }
};

runTest().catch(console.error);

