#!/usr/bin/env node

/**
 * Test Gemini Adapter Implementation
 * Tests the Gemini adapter directly and through the abstraction layer
 */

import { spawn } from 'child_process';
import { GeminiAdapter } from '../../src/adapters/gemini/index.js';
import { LLMService } from '../../src/services/llm-service.js';
import { GEMINI_CONSTANTS } from '../../src/adapters/gemini/index.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function testGeminiAdapterDirect() {
  console.log('🧪 Test 1: Direct Gemini Adapter Test\n');
  
  if (!GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not set. Skipping direct adapter test.');
    console.log('   Set GEMINI_API_KEY environment variable to test.\n');
    return false;
  }

  try {
    const adapter = new GeminiAdapter({
      GEMINI_API_KEY: GEMINI_API_KEY,
      DEFAULT_MODEL: 'gemini-1.5-flash',
    });

    // Test validation
    console.log('✅ Configuration validation passed');

    // Test getAvailableModels
    console.log('📋 Fetching available models...');
    const models = await adapter.getAvailableModels();
    console.log(`✅ Found ${models.length} models:`, models.slice(0, 5).join(', '));

    // Test callChat
    console.log('\n💬 Testing chat API...');
    const response = await adapter.callChat({
      model: 'gemini-1.5-flash',
      messages: [
        { role: 'user', content: 'Say hello in one sentence.' }
      ],
      temperature: 0.7,
      max_tokens: 50,
    });

    console.log('✅ Chat API response received');
    console.log(`📝 Response: ${response.choices[0].message.content.substring(0, 100)}...`);

    // Test default model
    const defaultModel = adapter.getDefaultModel();
    console.log(`✅ Default model: ${defaultModel}`);

    return true;
  } catch (error) {
    console.error('❌ Direct adapter test failed:', error.message);
    return false;
  }
}

async function testGeminiViaLLMService() {
  console.log('\n🧪 Test 2: Gemini via LLMService (Abstraction Layer)\n');

  if (!GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not set. Skipping LLMService test.\n');
    return false;
  }

  try {
    const llmService = new LLMService({
      LLM_PROVIDER: 'gemini',
      GEMINI_API_KEY: GEMINI_API_KEY,
      DEFAULT_MODEL: 'gemini-1.5-flash',
      MAX_TOKENS: 100,
      TEMPERATURE: 0.7,
    });

    console.log(`✅ LLMService initialized with provider: ${llmService.getProviderName()}`);

    // Test getAvailableModels
    console.log('📋 Fetching available models via LLMService...');
    const models = await llmService.getAvailableModels();
    console.log(`✅ Found ${models.length} models via abstraction layer`);

    // Test callChat
    console.log('\n💬 Testing chat via LLMService...');
    const response = await llmService.callChat({
      model: 'gemini-1.5-flash',
      messages: [
        { role: 'user', content: 'What is 2+2? Answer in one word.' }
      ],
    });

    console.log('✅ Chat via abstraction layer successful');
    console.log(`📝 Response: ${response.choices[0].message.content}`);

    // Test default model
    const defaultModel = llmService.getDefaultModel();
    console.log(`✅ Default model via service: ${defaultModel}`);

    return true;
  } catch (error) {
    console.error('❌ LLMService test failed:', error.message);
    return false;
  }
}

async function testGeminiViaMCPServer() {
  console.log('\n🧪 Test 3: Gemini via MCP Server (Full Integration)\n');

  if (!GEMINI_API_KEY) {
    console.log('⚠️  GEMINI_API_KEY not set. Skipping MCP server test.\n');
    return false;
  }

  return new Promise((resolve) => {
    const server = spawn('node', ['src/index.js'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        LLM_PROVIDER: 'gemini',
        GEMINI_API_KEY: GEMINI_API_KEY,
        MODEL_NAME: 'gemini-1.5-flash',
      },
    });

    let output = '';
    let errorOutput = '';

    server.stdout.on('data', (data) => {
      output += data.toString();
    });

    server.stderr.on('data', (data) => {
      errorOutput += data.toString();
      const line = data.toString().trim();
      if (line.includes('Using LLM provider') || line.includes('Found')) {
        console.log(`📝 Server: ${line}`);
      }
    });

    // Test ask_llm tool
    setTimeout(() => {
      console.log('💬 Testing ask_llm tool via MCP...');
      const request = {
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'ask_llm',
          arguments: {
            question: 'Say "Hello from Gemini" in one sentence.'
          }
        }
      };
      server.stdin.write(JSON.stringify(request) + '\n');
    }, 3000);

    setTimeout(() => {
      server.kill();
      
      try {
        const lines = output.trim().split('\n');
        const parsedResponses = lines
          .filter(line => line.trim())
          .map(line => {
            try {
              return JSON.parse(line);
            } catch {
              return null;
            }
          })
          .filter(Boolean);

        if (parsedResponses.length > 0) {
          const response = parsedResponses[0];
          if (response.result && response.result.content) {
            const text = response.result.content[0].text;
            console.log('✅ MCP server test successful');
            console.log(`📝 Response: ${text.substring(0, 150)}...`);
            resolve(true);
          } else {
            console.log('⚠️  Unexpected response format');
            resolve(false);
          }
        } else {
          console.log('⚠️  No response received from server');
          resolve(false);
        }
      } catch (error) {
        console.error('❌ MCP server test failed:', error.message);
        resolve(false);
      }
    }, 10000);
  });
}

async function testGeminiErrorHandling() {
  console.log('\n🧪 Test 4: Error Handling\n');

  // Test missing API key
  try {
    const adapter = new GeminiAdapter({});
    adapter.validateConfig();
    console.log('❌ Should have thrown error for missing API key');
    return false;
  } catch (error) {
    console.log('✅ Correctly validates missing API key');
  }

  // Test invalid API key (if provided)
  if (GEMINI_API_KEY) {
    try {
      const adapter = new GeminiAdapter({
        GEMINI_API_KEY: 'invalid-key',
        DEFAULT_MODEL: 'gemini-1.5-flash',
      });

      await adapter.callChat({
        model: 'gemini-1.5-flash',
        messages: [{ role: 'user', content: 'test' }],
      });
      console.log('⚠️  Should have thrown error for invalid API key');
    } catch (error) {
      if (error.message.includes('invalid') || error.message.includes('401') || error.message.includes('403')) {
        console.log('✅ Correctly handles invalid API key');
      } else {
        console.log(`⚠️  Unexpected error: ${error.message}`);
      }
    }
  }

  return true;
}

async function testGeminiConstants() {
  console.log('\n🧪 Test 5: Constants Export\n');

  try {
    console.log('✅ GEMINI_CONSTANTS exported:', {
      defaultModel: GEMINI_CONSTANTS.DEFAULT_MODEL,
      baseUrl: GEMINI_CONSTANTS.DEFAULT_BASE_URL,
      modelsCount: GEMINI_CONSTANTS.MODELS.length,
    });

    console.log(`✅ Available models: ${GEMINI_CONSTANTS.MODELS.join(', ')}`);
    return true;
  } catch (error) {
    console.error('❌ Constants test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Gemini Adapter Test Suite\n');
  console.log('='.repeat(70));

  const results = {
    direct: false,
    abstraction: false,
    mcp: false,
    errors: false,
    constants: false,
  };

  // Test 1: Direct adapter
  results.direct = await testGeminiAdapterDirect();

  // Test 2: Via LLMService
  results.abstraction = await testGeminiViaLLMService();

  // Test 3: Via MCP Server
  results.mcp = await testGeminiViaMCPServer();

  // Test 4: Error handling
  results.errors = await testGeminiErrorHandling();

  // Test 5: Constants
  results.constants = await testGeminiConstants();

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 Test Results Summary:');
  console.log('='.repeat(70));
  console.log(`Direct Adapter Test:     ${results.direct ? '✅ PASSED' : '❌ FAILED/SKIPPED'}`);
  console.log(`Abstraction Layer Test:  ${results.abstraction ? '✅ PASSED' : '❌ FAILED/SKIPPED'}`);
  console.log(`MCP Server Test:         ${results.mcp ? '✅ PASSED' : '❌ FAILED/SKIPPED'}`);
  console.log(`Error Handling Test:     ${results.errors ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Constants Test:          ${results.constants ? '✅ PASSED' : '❌ FAILED'}`);

  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;

  console.log('\n' + '='.repeat(70));
  console.log(`Overall: ${passed}/${total} tests passed`);

  if (!GEMINI_API_KEY) {
    console.log('\n💡 Note: Set GEMINI_API_KEY environment variable to run full tests');
    console.log('   Example: GEMINI_API_KEY=your-key node test/manual/test-gemini-adapter.js');
  }

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed or were skipped');
    process.exit(1);
  }
}

runAllTests().catch((error) => {
  console.error('❌ Test suite error:', error);
  process.exit(1);
});
