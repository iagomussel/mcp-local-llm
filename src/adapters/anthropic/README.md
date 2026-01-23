# Anthropic Adapter

Anthropic adapter for Claude models.

## Files

- `anthropic-adapter.js` - Main adapter implementation
- `anthropic-constants.js` - Adapter-specific constants
- `index.js` - Module exports

## Usage

```javascript
import { AnthropicAdapter, ANTHROPIC_CONSTANTS } from './adapters/anthropic/index.js';

const adapter = new AnthropicAdapter({
  ANTHROPIC_API_KEY: 'sk-ant-...',
  DEFAULT_MODEL: 'claude-3-haiku-20240307'
});
```

## Configuration

- `ANTHROPIC_API_KEY` - Anthropic API key (required)
- `ANTHROPIC_BASE_URL` - API base URL (default: `https://api.anthropic.com/v1`)
- `DEFAULT_MODEL` - Default model name (default: `claude-3-haiku-20240307`)

## Adding Files

You can add additional files to this adapter folder as needed:
- Utility functions
- Type definitions
- Tests
- Documentation

All exports should go through `index.js`.
