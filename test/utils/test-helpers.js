/**
 * Test helper functions
 */

import { writeFileSync, unlinkSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

export function createTempFile(content, extension = '.js') {
  const tempDir = join(tmpdir(), 'mcp-local-llm-tests');
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  
  const filePath = join(tempDir, `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}${extension}`);
  writeFileSync(filePath, content, 'utf-8');
  return filePath;
}

export function cleanupTempFile(filePath) {
  try {
    if (existsSync(filePath)) {
      unlinkSync(filePath);
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

export function createTempDir() {
  const tempDir = join(tmpdir(), 'mcp-local-llm-tests', `test-${Date.now()}`);
  if (!existsSync(tempDir)) {
    mkdirSync(tempDir, { recursive: true });
  }
  return tempDir;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function assertResponseFormat(response) {
  if (!response || typeof response !== 'object') {
    throw new Error('Response must be an object');
  }
  
  if (!response.content || !Array.isArray(response.content)) {
    throw new Error('Response must have content array');
  }
  
  if (response.content.length === 0) {
    throw new Error('Response content array must not be empty');
  }
  
  const firstContent = response.content[0];
  if (!firstContent.type || !firstContent.text) {
    throw new Error('Response content must have type and text properties');
  }
  
  return true;
}
