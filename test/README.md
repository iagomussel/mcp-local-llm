# MCP Local LLM - Test Suite

## Test Structure

The test suite is organized into the following directories:

### Core Test Directories

- **`unit/`** - Unit tests for individual components
  - `base-tool.test.js` - Tests for BaseTool class
  - `memory-store.test.js` - Tests for MemoryStore
  - `ask-llm-tool.test.js` - Tests for AskLLMTool
  - `check-llm-status-tool.test.js` - Tests for CheckLLMStatusTool
  - `humanize-content-tool.test.js` - Tests for HumanizeContentTool
  - `memory-tools.test.js` - Tests for memory-related tools
  - `gemini-adapter.test.js` - Tests for GeminiAdapter

- **`integration/`** - Integration tests for MCP server
  - `server.test.js` - Tests for MCP protocol compliance
  - `server-initialization.test.js` - Server initialization tests
  - `all-tools.test.js` - Tests for all tools integration
  - `full-server.test.js` - Full server integration tests

- **`utils/`** - Test utilities and helpers
  - `mock-server.js` - Mock server for testing tools
  - `test-helpers.js` - Helper functions for tests

### Additional Directories

- **`samples/`** - Sample code files for testing tools
  - `sample-javascript.js` - JavaScript sample code
  - `sample-python.py` - Python sample code
  - `sample-typescript.ts` - TypeScript sample code
  
  These files are used by tools like `search_code_usage` for testing code analysis capabilities.

- **`manual/`** - Manual test scripts for interactive testing
  - `test-search-code-usage.js` - Manual tests for code search tool
  - `test-token-economy.js` - Token economy testing
  - `test-git-diff-file.js` - Git diff file testing
  - `test-cursor-rules.js` - Cursor rules testing
  - `test-new-tools.js` - Testing new tool features
  - `test-ide-token-economy.js` - IDE token economy tests
  - `test-optional-lines.js` - Optional lines feature tests
  - `test-realistic-tokens.js` - Realistic token usage tests
  - `test-gemini-adapter.js` - Gemini adapter integration tests

- **`demos/`** - Demo scripts showcasing features
  - `demo-ide-token-savings.js` - Demonstrates token savings in IDE

- **`docs/`** - Documentation and guides
  - `example-git-diff-usage.md` - Git diff usage examples
  - `search-code-usage-guide.md` - Code search usage guide

## Running Tests

### Run all automated tests
```bash
npm test
```

Or directly:
```bash
node test/run-all-tests.js
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

### Run manual test scripts
```bash
# Example: Test code search functionality
node test/manual/test-search-code-usage.js

# Example: Test token economy
node test/manual/test-token-economy.js
```

### Run demo scripts
```bash
# Example: Demo token savings
node test/demos/demo-ide-token-savings.js
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

### Manual Test Script Example

```javascript
#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';

async function testTool() {
  console.log('Testing tool...');
  
  // Your test logic here
  // Can use samples from test/samples/
  const sampleFile = path.join(__dirname, '../samples/sample-javascript.js');
  
  // Test the tool with sample file
  // ...
}

testTool().catch(console.error);
```

## Test Coverage

Current test coverage includes:

- ✅ BaseTool class functionality
- ✅ MemoryStore CRUD operations
- ✅ AskLLMTool basic functionality
- ✅ CheckLLMStatusTool status checking
- ✅ HumanizeContentTool text processing
- ✅ Memory tools (store, retrieve, update, delete, search)
- ✅ MCP server protocol compliance
- ✅ Error handling

## Using Sample Files

Sample files in `samples/` can be used for testing tools that analyze code:

```javascript
import path from 'path';

const samplePath = path.join(__dirname, 'samples/sample-python.py');

// Use with search_code_usage tool
const result = await tool.handle({
  root_path: path.dirname(samplePath),
  term: 'UserService',
  file_types: ['.py']
});
```

## Adding More Tests

### To add a new unit test:

1. Create a new test file in `test/unit/` (e.g., `your-tool.test.js`)
2. Import the tool and MockServer
3. Write test cases using Node's test API
4. Add the test file to `test/run-all-tests.js`

### To add a new integration test:

1. Create a new test file in `test/integration/` (e.g., `your-feature.test.js`)
2. Write integration tests that spawn the actual server
3. Add the test file to `test/run-all-tests.js`

### To add a new manual test:

1. Create a new script in `test/manual/` (e.g., `test-your-feature.js`)
2. Make it executable: `chmod +x test/manual/test-your-feature.js`
3. Use samples from `test/samples/` if needed
4. Document usage in this README

### To add a new sample file:

1. Create a new file in `test/samples/` (e.g., `sample-rust.rs`)
2. Include representative code patterns for testing
3. Document what it's used for

## Notes

- Integration tests spawn the actual server process, so they may be slower
- Unit tests use mocks and don't require Ollama to be running
- Some integration tests may require Ollama to be available
- Manual tests are for interactive exploration and don't run automatically
- Tests clean up temporary files automatically
- Sample files are used by various tools for code analysis testing

## Directory Structure Summary

```
test/
├── README.md                 # This file
├── run-all-tests.js          # Test runner for automated tests
├── unit/                     # Unit tests
│   ├── *.test.js
├── integration/              # Integration tests
│   ├── *.test.js
├── manual/                   # Manual test scripts
│   ├── test-*.js
├── demos/                    # Demo scripts
│   ├── demo-*.js
├── samples/                  # Sample code files
│   ├── sample-*.js
│   ├── sample-*.py
│   └── sample-*.ts
├── docs/                     # Documentation and guides
│   ├── *.md
└── utils/                    # Test utilities
    ├── mock-server.js
    └── test-helpers.js
```
