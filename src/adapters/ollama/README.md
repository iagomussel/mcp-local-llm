# Ollama Adapter

Ollama adapter for local LLM models.

## Files

- `ollama-adapter.js` - Main adapter implementation
- `ollama-constants.js` - Adapter-specific constants
- `index.js` - Module exports

## Usage

```javascript
import { OllamaAdapter, OLLAMA_CONSTANTS } from './adapters/ollama/index.js';

const adapter = new OllamaAdapter({
  OLLAMA_URL: 'http://localhost:11434',
  DEFAULT_MODEL: 'llama3'
});
```

## Configuration

- `OLLAMA_URL` - Ollama API URL (default: `http://localhost:11434`)
- `DEFAULT_MODEL` - Default model name (default: `llama3`)

## Adding Files

You can add additional files to this adapter folder as needed:
- Utility functions
- Type definitions
- Tests
- Documentation

All exports should go through `index.js`.
