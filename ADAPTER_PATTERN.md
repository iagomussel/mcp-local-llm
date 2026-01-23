# LLM Adapter Pattern Documentation

## Overview

The MCP Local LLM server now supports multiple LLM providers through a plug-and-play adapter pattern. You can switch between Ollama, OpenAI, Anthropic, or any custom provider without changing code.

## Quick Start

### Using Ollama (Default)

```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=llama3
```

### Using OpenAI

```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-api-key-here
DEFAULT_MODEL=gpt-3.5-turbo
```

### Using Anthropic

```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
DEFAULT_MODEL=claude-3-haiku-20240307
```

### Using Google Gemini

```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-api-key-here
DEFAULT_MODEL=gemini-1.5-flash
```

## Architecture

```
Application Code
      ↓
  LLMService (unified interface)
      ↓
  AdapterFactory
      ↓
  ┌──────────┬──────────┬─────────────┐
  │ Ollama   │ OpenAI   │ Anthropic   │
  │ Adapter  │ Adapter  │ Adapter     │
  └──────────┴──────────┴─────────────┘
```

## Adding a New Provider

1. Create adapter file: `src/adapters/my-provider-adapter.js`

```javascript
import { BaseAdapter } from './base-adapter.js';

export class MyProviderAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.MY_PROVIDER_API_KEY;
  }

  async getAvailableModels() {
    // Return array of model names
    return ['model1', 'model2'];
  }

  async callChat(payload) {
    // Call your API and return standardized format
    const response = await fetch('your-api-endpoint', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: payload.model,
        messages: payload.messages,
        temperature: payload.temperature,
        max_tokens: payload.max_tokens
      })
    });

    const data = await response.json();
    return this.transformResponse(data);
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error('MY_PROVIDER_API_KEY is required');
    }
    return true;
  }

  getDefaultModel() {
    return this.config.DEFAULT_MODEL || 'default-model';
  }
}
```

2. Register in `src/adapters/adapter-factory.js`:

```javascript
import { MyProviderAdapter } from './my-provider-adapter.js';

// In AdapterFactory constructor:
this.registeredAdapters.set('myprovider', MyProviderAdapter);
```

3. Export in `src/adapters/index.js`:

```javascript
export { MyProviderAdapter } from './my-provider-adapter.js';
```

4. Use it:

```env
LLM_PROVIDER=myprovider
MY_PROVIDER_API_KEY=your-key
DEFAULT_MODEL=model1
```

## Configuration Reference

### Common Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `LLM_PROVIDER` | Provider name (`ollama`, `openai`, `anthropic`, `gemini`) | `ollama` |
| `DEFAULT_MODEL` | Default model name | Provider-specific |
| `MAX_TOKENS` | Maximum tokens per response | `256` |
| `TEMPERATURE` | Temperature setting | `0.7` |

### Ollama Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `OLLAMA_URL` | Ollama API URL | `http://localhost:11434` |

### OpenAI Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_BASE_URL` | OpenAI API base URL | `https://api.openai.com/v1` |

### Anthropic Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Anthropic API key | Required |
| `ANTHROPIC_BASE_URL` | Anthropic API base URL | `https://api.anthropic.com/v1` |

### Google Gemini Settings

| Variable | Description | Default |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | Required |
| `GEMINI_BASE_URL` | Gemini API base URL | `https://generativelanguage.googleapis.com/v1beta` |

## Runtime Provider Switching

You can switch providers at runtime:

```javascript
import { LLMService } from './services/llm-service.js';

const llmService = new LLMService();

// Switch to OpenAI
llmService.switchProvider('openai', {
  OPENAI_API_KEY: 'sk-...',
  DEFAULT_MODEL: 'gpt-4'
});

// Switch back to Ollama
llmService.switchProvider('ollama', {
  OLLAMA_URL: 'http://localhost:11434',
  DEFAULT_MODEL: 'llama3'
});
```

## Response Format

All adapters return responses in a standardized format:

```javascript
{
  choices: [{
    message: {
      content: "The response text",
      role: "assistant"
    }
  }]
}
```

This ensures compatibility across all providers.

## Error Handling

Adapters handle errors consistently:

- **Connection errors**: `ECONNREFUSED` → "Service unavailable"
- **Authentication errors**: `401` → "API key is invalid"
- **Rate limiting**: `429` → "Rate limit exceeded"
- **Other errors**: Provider-specific error message

## Testing

Test adapters independently:

```javascript
import { OllamaAdapter } from './adapters/ollama-adapter.js';

const adapter = new OllamaAdapter({
  OLLAMA_URL: 'http://localhost:11434',
  DEFAULT_MODEL: 'llama3'
});

// Test
const models = await adapter.getAvailableModels();
console.log('Models:', models);
```

## Benefits

✅ **No code changes**: Switch providers via environment variables  
✅ **Consistent API**: Same interface for all providers  
✅ **Easy to extend**: Add new providers in minutes  
✅ **Type-safe**: Standardized response format  
✅ **Backward compatible**: Existing code works unchanged  
✅ **Testable**: Mock adapters for unit tests

## Migration Guide

### From OllamaService to LLMService

**Before:**
```javascript
import { OllamaService } from './services/ollama-service.js';
const service = new OllamaService();
```

**After:**
```javascript
import { LLMService } from './services/llm-service.js';
const service = new LLMService(); // Automatically uses configured provider
```

The `OllamaService` is still available for backward compatibility but internally uses `LLMService`.

## Examples

See `src/adapters/` for complete adapter implementations.
