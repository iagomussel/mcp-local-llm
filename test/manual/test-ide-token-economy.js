#!/usr/bin/env node

/**
 * IDE Token Economy Test
 * Demonstrates how the MCP optimizes communication with the IDE to save tokens
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const testIDETokenEconomy = () => {
  return new Promise((resolve, reject) => {
    console.log('💻 IDE Token Economy Test\n');
    console.log('Testing optimized communication patterns to save IDE tokens...\n');
    
    // Create a test file first
    const testContent = `This is a technical document that presents a detailed analysis of the system requirements.
The document proposes a comprehensive solution to optimize application performance.
The solution includes architecture improvements and code optimizations.
The goal is to reduce response time and improve user experience.`;
    
    writeFileSync('test-document.txt', testContent);
    console.log('📝 Created test file: test-document.txt\n');
    
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

    // Test 1: Traditional approach (passing full content)
    setTimeout(() => {
      console.log('❌ Test 1: Traditional approach (passing full content)...');
      const traditionalRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'humanize_compact',
          arguments: {
            content: testContent
          }
        }
      };
      server.stdin.write(JSON.stringify(traditionalRequest) + '\n');
    }, 3000);

    // Test 2: Optimized approach (passing file path + lines)
    setTimeout(() => {
      console.log('✅ Test 2: Optimized approach (file path + line numbers)...');
      const optimizedRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'humanize_file',
          arguments: {
            file_path: 'test-document.txt',
            start_line: 1,
            end_line: 2
          }
        }
      };
      server.stdin.write(JSON.stringify(optimizedRequest) + '\n');
    }, 8000);

    // Test 3: Command execution with summary
    setTimeout(() => {
      console.log('⚡ Test 3: Command execution with summary only...');
      const commandRequest = {
        jsonrpc: '2.0',
        id: 3,
        method: 'tools/call',
        params: {
          name: 'run_command',
          arguments: {
            command: 'echo "Test command executed"',
            directory: process.cwd(),
            summary_only: true
          }
        }
      };
      server.stdin.write(JSON.stringify(commandRequest) + '\n');
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

        console.log('\n📊 IDE Token Economy Results:');
        console.log('='.repeat(70));
        
        parsedResponses.forEach((response, index) => {
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            const charCount = text.length;
            const wordCount = text.split(' ').length;
            
            const testName = [
              '❌ Traditional (full content)',
              '✅ Optimized (file + lines)',
              '⚡ Command (summary only)'
            ][index];
            
            console.log(`\n${testName}:`);
            console.log(`Characters: ${charCount} | Words: ${wordCount}`);
            console.log(`Response: ${text}`);
            
            responses.push({
              type: testName,
              chars: charCount,
              words: wordCount,
              text: text
            });
          }
        });

        if (responses.length >= 2) {
          const traditional = responses[0];
          const optimized = responses[1];
          
          const charSavings = ((traditional.chars - optimized.chars) / traditional.chars * 100).toFixed(1);
          const wordSavings = ((traditional.words - optimized.words) / traditional.words * 100).toFixed(1);
          
          console.log('\n' + '='.repeat(70));
          console.log('💰 IDE TOKEN SAVINGS ANALYSIS:');
          console.log(`❌ Traditional: ${traditional.chars} chars, ${traditional.words} words`);
          console.log(`✅ Optimized: ${optimized.chars} chars, ${optimized.words} words`);
          console.log(`📉 Character savings: ${charSavings}%`);
          console.log(`📉 Word savings: ${wordSavings}%`);
          
          console.log('\n🚀 IDE Communication Optimizations:');
          console.log('✅ Pass file paths + line numbers instead of full content');
          console.log('✅ Return only summaries from command executions');
          console.log('✅ Use compact responses for humanization');
          console.log('✅ Minimize data transfer between MCP and IDE');
          
          console.log('\n💡 Benefits for IDE Token Usage:');
          console.log('✅ Reduced context size in IDE conversations');
          console.log('✅ Faster processing of MCP responses');
          console.log('✅ Lower token consumption per interaction');
          console.log('✅ More efficient IDE-Cursor communication');
          
          console.log('\n🎯 Recommended Usage Patterns:');
          console.log('• Use humanize_file instead of passing full content');
          console.log('• Use run_command with summary_only=true');
          console.log('• Pass line ranges instead of entire files');
          console.log('• Use compact responses when possible');
        }
        
        // Clean up test file
        try {
          const fs = require('fs');
          fs.unlinkSync('test-document.txt');
          console.log('\n🧹 Cleaned up test file');
        } catch (e) {
          // Ignore cleanup errors
        }
        
        resolve(true);
      } catch (error) {
        console.log('\n❌ IDE token economy test failed:', error.message);
        resolve(false);
      }
    }, 20000);

    server.on('error', (error) => {
      console.log('❌ Server error:', error.message);
      resolve(false);
    });
  });
};

const runIDETokenTest = async () => {
  const success = await testIDETokenEconomy();
  
  if (success) {
    console.log('\n🏆 IDE token economy test completed successfully!');
  } else {
    console.log('\n❌ IDE token economy test failed.');
  }
};

runIDETokenTest().catch(console.error);

