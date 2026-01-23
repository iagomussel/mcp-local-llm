# OpenAI Adapter

OpenAI adapter for GPT models.

## Files

- `openai-adapter.js` - Main adapter implementation
- `openai-constants.js` - Adapter-specific constants
- `index.js` - Module exports

## Usage

```javascript
import { OpenAIAdapter, OPENAI_CONSTANTS } from './adapters/openai/index.js';

const adapter = new OpenAIAdapter({
  OPENAI_API_KEY: 'sk-...',
  DEFAULT_MODEL: 'gpt-3.5-turbo'
});
```

## Configuration

- `OPENAI_API_KEY` - OpenAI API key (required)
- `OPENAI_BASE_URL` - API base URL (default: `https://api.openai.com/v1`)
- `DEFAULT_MODEL` - Default model name (default: `gpt-3.5-turbo`)

## Adding Files

You can add additional files to this adapter folder as needed:
- Utility functions
- Type definitions
- Tests
- Documentation

All exports should go through `index.js`.
