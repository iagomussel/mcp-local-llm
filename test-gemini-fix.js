#!/usr/bin/env node

/**
 * Test script to verify Gemini adapter fix
 * Tests the getAvailableModels method with proper error handling
 */

import { GeminiAdapter } from './src/adapters/gemini/index.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.log('⚠️  GEMINI_API_KEY not set. Please set it to test the fix.');
  console.log('   Usage: GEMINI_API_KEY=your-key node test-gemini-fix.js');
  process.exit(1);
}

async function testGeminiFix() {
  console.log('🧪 Testing Gemini Adapter Fix\n');
  
  try {
    const adapter = new GeminiAdapter({
      GEMINI_API_KEY: GEMINI_API_KEY,
      GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
      DEFAULT_MODEL: 'gemini-1.5-flash',
    });

    console.log('✅ Adapter initialized successfully');
    console.log(`   Default model: ${adapter.getDefaultModel()}\n`);

    console.log('📋 Fetching available models...');
    const models = await adapter.getAvailableModels();
    
    console.log(`✅ Found ${models.length} models:`);
    models.forEach(model => console.log(`   - ${model}`));
    
    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Response status:', error.response.status);
      console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

testGeminiFix();
