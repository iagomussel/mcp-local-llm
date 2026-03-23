#!/usr/bin/env node

/**
 * Test runner for all tests
 * Runs unit and integration tests using Node's built-in test runner
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const testFiles = [
  // Unit tests
  'test/unit/base-tool.test.js',
  'test/unit/memory-store.test.js',
  'test/unit/ask-llm-tool.test.js',
  'test/unit/humanize-content-tool.test.js',
  'test/unit/check-llm-status-tool.test.js',
  'test/unit/memory-tools.test.js',
  'test/unit/gemini-adapter.test.js',
  'test/unit/cache-service.test.js',
  // Integration tests
  'test/integration/all-tools.test.js',
  'test/integration/server-initialization.test.js',
  'test/integration/server.test.js',
  'test/integration/full-server.test.js',
];

async function runTests() {
  console.log('🧪 Running test suite...\n');
  
  let passed = 0;
  let failed = 0;
  const results = [];
  
  for (const testFile of testFiles) {
    console.log(`Running: ${testFile}`);
    
    try {
      const result = await runTestFile(testFile);
      if (result.success) {
        passed++;
        console.log(`✅ ${testFile} - PASSED\n`);
      } else {
        failed++;
        console.log(`❌ ${testFile} - FAILED\n`);
        if (result.error) {
          console.log(`Error: ${result.error}\n`);
        }
      }
      results.push({ file: testFile, ...result });
    } catch (error) {
      failed++;
      console.log(`❌ ${testFile} - ERROR: ${error.message}\n`);
      results.push({ file: testFile, success: false, error: error.message });
    }
  }
  
  console.log('\n' + '='.repeat(70));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(70));
  
  if (failed > 0) {
    console.log('\n❌ Some tests failed. Details:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.file}: ${r.error || 'Test failed'}`);
    });
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  }
}

function runTestFile(testFile) {
  return new Promise((resolve) => {
    const testPath = join(projectRoot, testFile);
    const child = spawn('node', ['--test', testPath], {
      cwd: projectRoot,
      stdio: 'pipe',
    });
    
    let output = '';
    let errorOutput = '';
    
    child.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    child.on('close', (code) => {
      const success = code === 0;
      resolve({
        success,
        code,
        output,
        error: errorOutput || (success ? null : 'Test failed'),
      });
    });
    
    child.on('error', (error) => {
      resolve({
        success: false,
        error: error.message,
      });
    });
  });
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
