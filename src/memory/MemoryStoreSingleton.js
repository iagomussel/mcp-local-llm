/**
 * Shared MemoryStore singleton for all tools
 * Ensures all tools use the same MemoryStore instance
 */

import { MemoryStore } from './MemoryStore.js';

let memoryStoreInstance = null;
let initializationPromise = null;

/**
 * Get the shared MemoryStore instance
 * Ensures initialization completes before returning
 */
export async function getMemoryStore() {
  if (!memoryStoreInstance) {
    memoryStoreInstance = new MemoryStore();
    // Wait for async initialization to complete
    initializationPromise = memoryStoreInstance.initialize();
    await initializationPromise;
  } else {
    // If instance exists, ensure initialization is complete
    if (initializationPromise) {
      await initializationPromise;
    } else {
      // If promise was cleared but instance exists, re-initialize
      initializationPromise = memoryStoreInstance.initialize();
      await initializationPromise;
    }
  }
  
  return memoryStoreInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetMemoryStore() {
  memoryStoreInstance = null;
  initializationPromise = null;
}
