#!/usr/bin/env node

/**
 * List Available Gemini Models
 * Tests Gemini API to list available models
 */

import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

console.log('🔍 Listing available Gemini models\n');

const url = 'https://generativelanguage.googleapis.com/v1beta/models';

const headers = {
  'Content-Type': 'application/json',
  'x-goog-api-key': GEMINI_API_KEY,
};

console.log('Request URL:', url);
console.log('Request Headers:', JSON.stringify(headers, null, 2));
console.log('\n---\n');

try {
  const response = await axios.get(url, { headers });
  console.log('✅ Success!\n');
  
  const models = response.data?.models || [];
  console.log(`Found ${models.length} models:\n`);
  
  models.forEach(model => {
    const supportedMethods = model.supportedGenerationMethods || [];
    const hasGenerateContent = supportedMethods.includes('generateContent');
    console.log(`- ${model.name}${hasGenerateContent ? ' ✅' : ' ❌'} (${supportedMethods.join(', ')})`);
  });
  
  console.log('\n---\n');
  console.log('Models that support generateContent:');
  models
    .filter(model => model.supportedGenerationMethods?.includes('generateContent'))
    .forEach(model => {
      console.log(`  - ${model.name}`);
    });
    
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Response:', JSON.stringify(error.response.data, null, 2));
  }
  process.exit(1);
}
