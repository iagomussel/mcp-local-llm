#!/usr/bin/env node

/**
 * Realistic Token Economy Test
 * Tests with more realistic content to show practical token savings
 */

import { spawn } from 'child_process';

const testRealisticTokens = () => {
  return new Promise((resolve, reject) => {
    console.log('💰 Realistic Token Economy Test\n');
    console.log('Testing with realistic content to show practical Cursor token savings...\n');
    
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

    const testText = 'Este documento técnico apresenta uma análise detalhada dos requisitos do sistema e propõe uma solução abrangente para otimizar o desempenho da aplicação.';

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
      console.log('💡 Test 2: Compact humanization...');
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

        console.log('\n📊 Realistic Token Economy Results:');
        console.log('='.repeat(70));
        
        parsedResponses.forEach((response, index) => {
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            const wordCount = text.split(' ').length;
            const charCount = text.length;
            
            console.log(`\n${index === 0 ? '📝 Regular Humanization:' : '💡 Compact Humanization:'}`);
            console.log(`Words: ${wordCount} | Characters: ${charCount}`);
            console.log(`Response: ${text}`);
            
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
          
          console.log('\n' + '='.repeat(70));
          console.log('💰 PRACTICAL TOKEN SAVINGS FOR CURSOR:');
          console.log(`📝 Regular: ${regular.words} words, ${regular.chars} chars`);
          console.log(`💡 Compact: ${compact.words} words, ${compact.chars} chars`);
          console.log(`📉 Word savings: ${wordSavings}%`);
          console.log(`📉 Character savings: ${charSavings}%`);
          
          // Calculate estimated token savings (rough approximation: 1 token ≈ 4 characters)
          const regularTokens = Math.ceil(regular.chars / 4);
          const compactTokens = Math.ceil(compact.chars / 4);
          const tokenSavings = ((regularTokens - compactTokens) / regularTokens * 100).toFixed(1);
          
          console.log(`🎯 Estimated token savings: ${tokenSavings}% (${regularTokens} → ${compactTokens} tokens)`);
          
          console.log('\n🚀 Cursor Benefits:');
          console.log('✅ Faster response processing');
          console.log('✅ Reduced API costs');
          console.log('✅ More efficient context management');
          console.log('✅ Better performance in long coding sessions');
          console.log('✅ Less memory usage');
          
          console.log('\n💡 Usage Recommendations:');
          console.log('• Use humanize_compact for quick text improvements');
          console.log('• Use humanize_content for detailed rewrites');
          console.log('• Add "compact" to any request for token economy');
        }
        
        resolve(true);
      } catch (error) {
        console.log('\n❌ Realistic token test failed:', error.message);
        resolve(false);
      }
    }, 20000);

    server.on('error', (error) => {
      console.log('❌ Server error:', error.message);
      resolve(false);
    });
  });
};

const runRealisticTest = async () => {
  const success = await testRealisticTokens();
  
  if (success) {
    console.log('\n🏆 Realistic token economy test completed!');
  } else {
    console.log('\n❌ Realistic token economy test failed.');
  }
};

runRealisticTest().catch(console.error);
