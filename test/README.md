# MCP Local LLM - Test Suite

## Test Structure

The test suite is organized into:

- **`unit/`** - Unit tests for individual components
  - `base-tool.test.js` - Tests for BaseTool class
  - `memory-store.test.js` - Tests for MemoryStore
  - `ask-llm-tool.test.js` - Tests for AskLLMTool
  - `humanize-content-tool.test.js` - Tests for HumanizeContentTool

- **`integration/`** - Integration tests for MCP server
  - `server.test.js` - Tests for MCP protocol compliance

- **`utils/`** - Test utilities and helpers
  - `mock-server.js` - Mock server for testing tools
  - `test-helpers.js` - Helper functions for tests

## Running Tests

### Run all tests
```bash
npm test
```

### Run only unit tests
```bash
npm run test:unit
```

### Run only integration tests
```bash
npm run test:integration
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run legacy tests
```bash
npm run test:legacy
```

## Test Framework

Tests use Node.js built-in test runner (available in Node 18+), which:
- Requires no additional dependencies
- Works seamlessly with ES modules
- Provides good test output and reporting
- Supports async/await and promises

## Writing New Tests

### Unit Test Example

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { YourTool } from '../../src/tools/YourTool.js';
import { MockServer } from '../utils/mock-server.js';

test('YourTool should work correctly', async () => {
  const mockServer = new MockServer();
  const tool = new YourTool(mockServer);
  
  const result = await tool.handle({ param: 'value' });
  
  assert.ok(result);
  assert.strictEqual(result.content[0].type, 'text');
});
```

### Integration Test Example

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { spawn } from 'child_process';

test('Server should handle request', async () => {
  const server = spawn('node', ['src/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  
  // Send MCP request and verify response
  // ...
  
  server.kill();
});
```

## Test Coverage

Current test coverage includes:

- ✅ BaseTool class functionality
- ✅ MemoryStore CRUD operations
- ✅ AskLLMTool basic functionality
- ✅ HumanizeContentTool text processing
- ✅ MCP server protocol compliance
- ✅ Error handling

## Adding More Tests

To add tests for additional tools:

1. Create a new test file in `test/unit/` (e.g., `your-tool.test.js`)
2. Import the tool and MockServer
3. Write test cases using Node's test API
4. Add the test file to `test/run-all-tests.js` if using the custom runner

## Notes

- Integration tests spawn the actual server process, so they may be slower
- Unit tests use mocks and don't require Ollama to be running
- Some integration tests may require Ollama to be available
- Tests clean up temporary files automatically
