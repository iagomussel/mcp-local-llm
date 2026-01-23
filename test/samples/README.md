# Sample Files

This directory contains sample code files used for testing various MCP tools, particularly those that analyze code structure and usage.

## Files

### `sample-javascript.js`
JavaScript sample code demonstrating:
- Class definitions
- Function declarations
- Variable usage
- Method calls

Used for testing `search_code_usage` tool with JavaScript files.

### `sample-python.py`
Python sample code demonstrating:
- Class definitions (`UserService`)
- Method implementations
- Function definitions
- Dictionary usage

Used for testing `search_code_usage` tool with Python files.

### `sample-typescript.ts`
TypeScript sample code demonstrating:
- Type definitions
- Interface declarations
- Class implementations
- Type annotations

Used for testing `search_code_usage` tool with TypeScript files.

## Usage

These files are referenced by manual test scripts and can be used with tools like:

- `search_code_usage` - Find code element declarations and usages
- `analyze_huge_file` - Analyze file structure and content
- `codebase_discovery` - Semantic code search

## Example

```javascript
import path from 'path';

const samplePath = path.join(__dirname, 'samples/sample-python.py');

// Use with search_code_usage tool
const result = await tool.handle({
  root_path: path.dirname(samplePath),
  term: 'UserService',
  file_types: ['.py'],
  include_declarations: true,
  include_usages: true
});
```

## Adding New Samples

When adding new sample files:

1. Use descriptive names: `sample-<language>.<ext>`
2. Include common code patterns (classes, functions, variables)
3. Add documentation in this README
4. Ensure the code is syntactically correct
