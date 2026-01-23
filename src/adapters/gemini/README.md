# Gemini Adapter

Google Gemini adapter for Gemini models (including Gemini Flash 1.5).

## Files

- `gemini-adapter.js` - Main adapter implementation
- `gemini-constants.js` - Adapter-specific constants
- `index.js` - Module exports

## Usage

```javascript
import { GeminiAdapter, GEMINI_CONSTANTS } from './adapters/gemini/index.js';

const adapter = new GeminiAdapter({
  GEMINI_API_KEY: 'your-api-key',
  DEFAULT_MODEL: 'gemini-1.5-flash'
});
```

## Configuration

- `GEMINI_API_KEY` - Google Gemini API key (required)
- `GEMINI_BASE_URL` - API base URL (default: `https://generativelanguage.googleapis.com/v1beta`)
- `DEFAULT_MODEL` - Default model name (default: `gemini-1.5-flash`)

## Adding Files

You can add additional files to this adapter folder as needed:
- Utility functions
- Type definitions
- Tests
- Documentation

All exports should go through `index.js`.
