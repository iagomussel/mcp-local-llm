#!/usr/bin/env node

/**
 * Token Economy Test
 * Compares regular vs compact humanization to demonstrate token savings
 */

import { spawn } from 'child_process';

const testTokenEconomy = () => {
  return new Promise((resolve, reject) => {
    console.log('💰 Token Economy Test\n');
    console.log('Comparing regular vs compact humanization for Cursor token savings...\n');
    
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

    const testText = 'Este é um texto de exemplo que precisa ser humanizado para soar mais natural e menos como uma IA.';

    // Test 1: Regular humanization
    setTimeout(() => {
      console.log('📝 Test 1: Regular humanization...');
      const regularRequest = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'humanize_content',
          arguments: {
            content: testText
          }
        }
      };
      server.stdin.write(JSON.stringify(regularRequest) + '\n');
    }, 3000);

    // Test 2: Compact humanization
    setTimeout(() => {
      console.log('💡 Test 2: Compact humanization (token optimized)...');
      const compactRequest = {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'humanize_compact',
          arguments: {
            content: testText
          }
        }
      };
      server.stdin.write(JSON.stringify(compactRequest) + '\n');
    }, 10000);

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

        console.log('\n📊 Token Economy Results:');
        console.log('='.repeat(60));
        
        parsedResponses.forEach((response, index) => {
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            const wordCount = text.split(' ').length;
            const charCount = text.length;
            
            console.log(`\n${index === 0 ? '📝 Regular Humanization:' : '💡 Compact Humanization:'}`);
            console.log(`Words: ${wordCount} | Characters: ${charCount}`);
            console.log(`Response: ${text.substring(0, 200)}${text.length > 200 ? '...' : ''}`);
            
            responses.push({
              type: index === 0 ? 'regular' : 'compact',
              words: wordCount,
              chars: charCount,
              text: text
            });
          }
        });

        if (responses.length >= 2) {
          const regular = responses[0];
          const compact = responses[1];
          
          const wordSavings = ((regular.words - compact.words) / regular.words * 100).toFixed(1);
          const charSavings = ((regular.chars - compact.chars) / regular.chars * 100).toFixed(1);
          
          console.log('\n' + '='.repeat(60));
          console.log('💰 TOKEN SAVINGS ANALYSIS:');
          console.log(`📝 Regular: ${regular.words} words, ${regular.chars} chars`);
          console.log(`💡 Compact: ${compact.words} words, ${compact.chars} chars`);
          console.log(`📉 Word savings: ${wordSavings}%`);
          console.log(`📉 Character savings: ${charSavings}%`);
          
          if (parseFloat(wordSavings) > 50) {
            console.log('🎉 EXCELLENT token economy! Over 50% savings achieved!');
          } else if (parseFloat(wordSavings) > 30) {
            console.log('✅ GOOD token economy! Significant savings achieved!');
          } else {
            console.log('⚠️ MODERATE token economy. Consider further optimization.');
          }
          
          console.log('\n🚀 Benefits for Cursor:');
          console.log('✅ Faster response times');
          console.log('✅ Lower token usage costs');
          console.log('✅ More efficient context usage');
          console.log('✅ Better performance in long conversations');
        }
        
        resolve(true);
      } catch (error) {
        console.log('\n❌ Token economy test failed:', error.message);
        console.log('Output:', output);
        resolve(false);
      }
    }, 20000); // 20 second timeout

    server.on('error', (error) => {
      console.log('❌ Server error:', error.message);
      resolve(false);
    });
  });
};

const runTokenEconomyTest = async () => {
  const success = await testTokenEconomy();
  
  if (success) {
    console.log('\n🏆 Token economy test completed successfully!');
  } else {
    console.log('\n❌ Token economy test failed.');
  }
};

runTokenEconomyTest().catch(console.error);

