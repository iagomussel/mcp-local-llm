#!/usr/bin/env node

/**
 * IDE Token Savings Demo
 * Shows the real difference in IDE token usage between approaches
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';

const demoIDETokenSavings = () => {
  return new Promise((resolve, reject) => {
    console.log('💻 IDE Token Savings Demo\n');
    console.log('Demonstrating how different approaches affect IDE token usage...\n');
    
    // Create a larger test file to show the difference
    const largeContent = `This is an extensive technical document that presents a detailed and comprehensive analysis of the system requirements.
The document proposes a complete and robust solution to significantly optimize application performance.
The solution includes substantial architecture improvements, advanced code optimizations, and implementation of best practices.
The main goal is to drastically reduce response time and considerably improve user experience.
The implementation involves refactoring critical components and optimizing database queries.
The expected result is a more efficient, scalable, and responsive system.`;
    
    writeFileSync('large-document.txt', largeContent);
    console.log('📝 Created large test file: large-document.txt\n');
    
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

    // Test 1: BAD - Passing entire large content to IDE
    setTimeout(() => {
      console.log('❌ BAD: Passing entire large content to IDE...');
      const badRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'humanize_compact',
          arguments: {
            content: largeContent
          }
        }
      };
      server.stdin.write(JSON.stringify(badRequest) + '\n');
    }, 3000);

    // Test 2: GOOD - Passing only file reference + lines
    setTimeout(() => {
      console.log('✅ GOOD: Passing only file reference + line numbers...');
      const goodRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'humanize_file',
          arguments: {
            file_path: 'large-document.txt',
            start_line: 1,
            end_line: 3
          }
        }
      };
      server.stdin.write(JSON.stringify(goodRequest) + '\n');
    }, 8000);

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

        console.log('\n📊 IDE Token Usage Comparison:');
        console.log('='.repeat(80));
        
        // Calculate input token usage
        const inputContent = largeContent;
        const inputChars = inputContent.length;
        const inputWords = inputContent.split(' ').length;
        
        console.log(`\n📥 INPUT TO IDE (what gets sent to Cursor):`);
        console.log(`❌ BAD approach: ${inputChars} chars, ${inputWords} words`);
        console.log(`✅ GOOD approach: ~50 chars (file path + line numbers)`);
        
        const inputSavings = ((inputChars - 50) / inputChars * 100).toFixed(1);
        console.log(`📉 Input savings: ${inputSavings}%`);
        
        parsedResponses.forEach((response, index) => {
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            const charCount = text.length;
            const wordCount = text.split(' ').length;
            
            const approach = index === 0 ? '❌ BAD' : '✅ GOOD';
            console.log(`\n${approach} OUTPUT FROM MCP:`);
            console.log(`Characters: ${charCount} | Words: ${wordCount}`);
            console.log(`Response: ${text}`);
            
            responses.push({
              type: approach,
              chars: charCount,
              words: wordCount,
              text: text
            });
          }
        });

        console.log('\n' + '='.repeat(80));
        console.log('💰 TOTAL IDE TOKEN SAVINGS:');
        
        if (responses.length >= 2) {
          const bad = responses[0];
          const good = responses[1];
          
          // Total tokens = input + output
          const badTotal = inputChars + bad.chars;
          const goodTotal = 50 + good.chars;
          
          const totalSavings = ((badTotal - goodTotal) / badTotal * 100).toFixed(1);
          
          console.log(`❌ BAD total: ${badTotal} chars (${inputChars} input + ${bad.chars} output)`);
          console.log(`✅ GOOD total: ${goodTotal} chars (50 input + ${good.chars} output)`);
          console.log(`🎯 TOTAL SAVINGS: ${totalSavings}%`);
          
          console.log('\n🚀 Why This Matters for IDE:');
          console.log('✅ Cursor processes less data per interaction');
          console.log('✅ Faster response times in the IDE');
          console.log('✅ Lower token costs for IDE usage');
          console.log('✅ More efficient context management');
          console.log('✅ Better performance in long coding sessions');
          
          console.log('\n💡 Key Optimizations Implemented:');
          console.log('• humanize_file: Pass file path + line numbers');
          console.log('• run_command: Return only success/error summaries');
          console.log('• humanize_compact: Ultra-short responses');
          console.log('• File references: Instead of full content');
        }
        
        // Clean up
        try {
          const fs = require('fs');
          fs.unlinkSync('large-document.txt');
          console.log('\n🧹 Cleaned up test file');
        } catch (e) {
          // Ignore cleanup errors
        }
        
        resolve(true);
      } catch (error) {
        console.log('\n❌ Demo failed:', error.message);
        resolve(false);
      }
    }, 15000);

    server.on('error', (error) => {
      console.log('❌ Server error:', error.message);
      resolve(false);
    });
  });
};

const runDemo = async () => {
  const success = await demoIDETokenSavings();
  
  if (success) {
    console.log('\n🏆 IDE token savings demo completed!');
    console.log('\n🎯 The MCP now optimizes communication with the IDE to save tokens!');
  } else {
    console.log('\n❌ Demo failed.');
  }
};

runDemo().catch(console.error);

