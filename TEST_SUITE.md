# Test Suite Documentation

## Overview

A comprehensive test suite has been created for the MCP Local LLM project using Node.js built-in test runner (Node 18+). The suite includes unit tests for core components and integration tests for MCP protocol compliance.

## Test Structure

```
test/
├── unit/                          # Unit tests
│   ├── base-tool.test.js         # BaseTool class tests
│   ├── memory-store.test.js       # MemoryStore CRUD tests
│   ├── ask-llm-tool.test.js       # AskLLMTool tests
│   └── humanize-content-tool.test.js # HumanizeContentTool tests
├── integration/                   # Integration tests
│   └── server.test.js             # MCP server protocol tests
├── utils/                         # Test utilities
│   ├── mock-server.js            # Mock server for testing
│   └── test-helpers.js            # Helper functions
├── run-all-tests.js              # Test runner script
└── README.md                      # Test documentation
```

## Test Coverage

### Unit Tests

1. **BaseTool Tests** (`test/unit/base-tool.test.js`)
   - Tool initialization
   - Abstract method enforcement
   - Helper method delegation
   - Server integration

2. **MemoryStore Tests** (`test/unit/memory-store.test.js`)
   - Store and retrieve operations
   - Search functionality
   - Update and delete operations
   - Memory counting and clearing
   - File persistence

3. **AskLLMTool Tests** (`test/unit/ask-llm-tool.test.js`)
   - Tool definition validation
   - Input validation
   - Model runner integration
   - Response formatting
   - Model selection logic

4. **HumanizeContentTool Tests** (`test/unit/humanize-content-tool.test.js`)
   - Tool definition validation
   - Content type detection (text, URL, file)
   - File reading functionality
   - Temperature optimization
   - Compact mode handling

### Integration Tests

1. **Server Tests** (`test/integration/server.test.js`)
   - MCP protocol compliance
   - Tool listing
   - Tool execution
   - Error handling
   - Prompt and resource listing

## Running Tests

### Quick Start

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch
```

### Test Scripts

- `npm test` - Runs all tests using custom test runner
- `npm run test:unit` - Runs only unit tests
- `npm run test:integration` - Runs only integration tests
- `npm run test:watch` - Runs tests in watch mode
- `npm run test:legacy` - Runs legacy manual tests

## Test Utilities

### MockServer

The `MockServer` class provides a mock implementation of the server for unit testing:

```javascript
import { MockServer } from '../utils/mock-server.js';

const mockServer = new MockServer();
// Tracks calls to callModelRunner and selectBestModel
```

### Test Helpers

Helper functions for common test operations:

- `createTempFile(content, extension)` - Create temporary test files
- `cleanupTempFile(filePath)` - Clean up temporary files
- `createTempDir()` - Create temporary directories
- `assertResponseFormat(response)` - Validate MCP response format
- `sleep(ms)` - Async delay utility

## Writing New Tests

### Example: Unit Test

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { YourTool } from '../../src/tools/YourTool.js';
import { MockServer } from '../utils/mock-server.js';

test('YourTool should handle valid input', async () => {
  const mockServer = new MockServer();
  const tool = new YourTool(mockServer);
  
  const result = await tool.handle({ param: 'value' });
  
  assert.ok(result);
  assert.strictEqual(result.content[0].type, 'text');
});
```

### Example: Integration Test

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';

test('Server should respond to MCP request', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  
  // Send MCP JSON-RPC request
  // Verify response format
  
  server.kill();
});
```

## Test Requirements

- **Node.js**: Version 18.0.0 or higher (for built-in test runner)
- **No external dependencies**: Uses only Node.js built-in modules
- **ES Modules**: All tests use ES module syntax

## Notes

- Unit tests use mocks and don't require Ollama to be running
- Integration tests spawn the actual server process
- Some integration tests may require Ollama to be available
- Tests automatically clean up temporary files
- MemoryStore tests use temporary directories

## Future Enhancements

Potential additions to the test suite:

1. **More Tool Tests**
   - Tests for all remaining tools
   - Edge case coverage
   - Error scenario testing

2. **Performance Tests**
   - Token usage tracking
   - Response time benchmarks
   - Memory usage tests

3. **E2E Tests**
   - Full workflow tests
   - Multi-tool interaction tests
   - Real Ollama integration tests

4. **Coverage Reports**
   - Code coverage metrics
   - Coverage reporting tools
   - Coverage thresholds

## Troubleshooting

### Tests fail with "Cannot find module"

Ensure you're running tests from the project root directory.

### Integration tests timeout

Integration tests spawn the server process. If they timeout:
- Check if Ollama is running (for tests that require it)
- Increase timeout values if needed
- Verify server starts correctly

### MemoryStore tests fail

MemoryStore tests create temporary directories. Ensure:
- Write permissions in temp directory
- Sufficient disk space
- No file locks on test files
