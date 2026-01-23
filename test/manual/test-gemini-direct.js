#!/usr/bin/env node

/**
 * Direct Gemini API Test
 * Tests Gemini API directly to verify configuration
 */

import axios from 'axios';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.MODEL_NAME || 'gemini-2.5-flash';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

console.log('🧪 Testing Gemini API directly\n');
console.log(`Model: ${MODEL}`);
console.log(`API Key: ${GEMINI_API_KEY.substring(0, 10)}...\n`);

const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const payload = {
  contents: [{
    parts: [{
      text: 'What is 2+2? Answer in one word.'
    }]
  }],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 256,
  }
};

const headers = {
  'Content-Type': 'application/json',
  'x-goog-api-key': GEMINI_API_KEY,
};

console.log('Request URL:', url);
console.log('Request Headers:', JSON.stringify(headers, null, 2));
console.log('Request Body:', JSON.stringify(payload, null, 2));
console.log('\n---\n');

try {
  const response = await axios.post(url, payload, { headers });
  console.log('✅ Success!');
  console.log('Response:', JSON.stringify(response.data, null, 2));
  
  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text) {
    console.log('\n📝 Answer:', text);
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  if (error.response) {
    console.error('Status:', error.response.status);
    console.error('Response:', JSON.stringify(error.response.data, null, 2));
    console.error('Request URL:', error.config?.url);
  }
  process.exit(1);
}
