# LLM Adapter Pattern

This directory implements a plug-and-play adapter pattern for supporting multiple LLM providers.

## Directory Structure

Each adapter is organized in its own folder (similar to WordPress plugins), allowing for multiple files per adapter:

```
adapters/
├── base-adapter.js          # Base adapter class
├── common-constants.js      # Shared constants
├── adapter-factory.js        # Factory for creating adapters
├── index.js                 # Main exports
├── ollama/                  # Ollama adapter module
│   ├── ollama-adapter.js
│   ├── ollama-constants.js
│   ├── index.js
│   └── README.md
├── openai/                  # OpenAI adapter module
│   ├── openai-adapter.js
│   ├── openai-constants.js
│   ├── index.js
│   └── README.md
├── anthropic/               # Anthropic adapter module
│   ├── anthropic-adapter.js
│   ├── anthropic-constants.js
│   ├── index.js
│   └── README.md
└── gemini/                  # Gemini adapter module
    ├── gemini-adapter.js
    ├── gemini-constants.js
    ├── index.js
    └── README.md
```

## Architecture

The adapter pattern allows you to switch between different LLM providers (Ollama, OpenAI, Anthropic, etc.) without changing any application code.

```
┌─────────────────────┐
│  Application Code   │  ← Uses LLMService (abstraction)
│  (index.js, tools)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│    LLMService       │  ← Abstraction layer (ONLY interface for apps)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  AdapterFactory     │  ← Creates adapters internally
└──────────┬──────────┘
           │
           ├──► OllamaAdapter
           ├──► OpenAIAdapter
           ├──► AnthropicAdapter
           └──► GeminiAdapter
```

## ⚠️ Important: Abstraction Layer

**Application code should NEVER import specific adapters directly!**

❌ **WRONG** - Don't do this in application code:
```javascript
import { OllamaAdapter } from './adapters/ollama/index.js';
const adapter = new OllamaAdapter(config);
```

✅ **CORRECT** - Use LLMService instead:
```javascript
import { LLMService } from './services/llm-service.js';
const llmService = new LLMService(config);
const models = await llmService.getAvailableModels();
```

The `LLMService` provides a clean abstraction layer that hides adapter implementation details from application code.

## Base Adapter

All adapters extend `BaseAdapter` which defines the interface:

```javascript
class BaseAdapter {
  async getAvailableModels()     // Get list of models
  async callChat(payload)        // Call chat API
  validateConfig()               // Validate configuration
  getDefaultModel()              // Get default model
  transformResponse(response)    // Transform to standard format
}
```

## Available Adapters

### OllamaAdapter
Local LLM provider using Ollama.

**Configuration:**
```env
LLM_PROVIDER=ollama
OLLAMA_URL=http://localhost:11434
DEFAULT_MODEL=llama3
```

### OpenAIAdapter
OpenAI GPT models.

**Configuration:**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
DEFAULT_MODEL=gpt-3.5-turbo
```

### AnthropicAdapter
Anthropic Claude models.

**Configuration:**
```env
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_BASE_URL=https://api.anthropic.com/v1
DEFAULT_MODEL=claude-3-haiku-20240307
```

### GeminiAdapter
Google Gemini models (including Gemini Flash 1.5).

**Configuration:**
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-api-key
GEMINI_BASE_URL=https://generativelanguage.googleapis.com/v1beta
DEFAULT_MODEL=gemini-1.5-flash
```

## Usage

### Application Code (Recommended)

**Always use LLMService - the abstraction layer:**

```javascript
import { LLMService } from './services/llm-service.js';
import { CONFIG } from './config/index.js';

// Service automatically uses configured provider
const llmService = new LLMService(CONFIG);

// Get available models
const models = await llmService.getAvailableModels();

// Call chat API
const response = await llmService.callChat({
  model: 'gpt-3.5-turbo',
  messages: [{ role: 'user', content: 'Hello!' }],
  temperature: 0.7,
  max_tokens: 256
});
```

### Internal/Factory Usage (Advanced)

**Only for creating new adapters or factory registration:**

```javascript
// This is ONLY for adapter-factory.js or when creating new adapters
import { OllamaAdapter } from './adapters/internal.js';
```

### Switching Providers

```javascript
// Switch provider at runtime
llmService.switchProvider('openai', {
  OPENAI_API_KEY: 'sk-...',
  DEFAULT_MODEL: 'gpt-4'
});
```

### Creating Custom Adapters

1. **Create adapter folder:**

```bash
mkdir -p src/adapters/myprovider
```

2. **Create adapter constants file:**

```javascript
// src/adapters/myprovider/myprovider-constants.js
export const MYPROVIDER_CONSTANTS = {
  DEFAULT_BASE_URL: 'https://api.myprovider.com/v1',
  DEFAULT_MODEL: 'default-model',
  API_ENDPOINTS: {
    CHAT: '/chat',
    MODELS: '/models',
  },
  TIMEOUT: 30000,
};
```

3. **Create adapter implementation:**

```javascript
// src/adapters/myprovider/myprovider-adapter.js
import axios from 'axios';
import { BaseAdapter } from '../base-adapter.js';
import { MYPROVIDER_CONSTANTS } from './myprovider-constants.js';
import { COMMON_CONSTANTS, ERROR_MESSAGES } from '../common-constants.js';

export class MyProviderAdapter extends BaseAdapter {
  constructor(config) {
    super(config);
    this.apiKey = config.MYPROVIDER_API_KEY;
    this.baseUrl = config.MYPROVIDER_BASE_URL || MYPROVIDER_CONSTANTS.DEFAULT_BASE_URL;
  }

  validateConfig() {
    if (!this.apiKey) {
      throw new Error(ERROR_MESSAGES.API_KEY_REQUIRED('myprovider'));
    }
    return true;
  }

  async getAvailableModels() {
    // Return array of model names
    return ['model1', 'model2'];
  }

  async callChat(payload) {
    const response = await axios.post(
      `${this.baseUrl}${MYPROVIDER_CONSTANTS.API_ENDPOINTS.CHAT}`,
      {
        model: payload.model || this.getDefaultModel(),
        messages: payload.messages,
        temperature: payload.temperature ?? COMMON_CONSTANTS.DEFAULT_TEMPERATURE,
        max_tokens: payload.max_tokens ?? COMMON_CONSTANTS.DEFAULT_MAX_TOKENS,
      },
      {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: MYPROVIDER_CONSTANTS.TIMEOUT,
      }
    );
    
    return this.transformResponse(response.data);
  }

  getDefaultModel() {
    return this.config.DEFAULT_MODEL || MYPROVIDER_CONSTANTS.DEFAULT_MODEL;
  }
}

// Export constants
export { MYPROVIDER_CONSTANTS };
```

4. **Create index.js:**

```javascript
// src/adapters/myprovider/index.js
export { MyProviderAdapter, MYPROVIDER_CONSTANTS } from './myprovider-adapter.js';
```

5. **Register in adapter-factory.js:**

```javascript
// src/adapters/adapter-factory.js
import { MyProviderAdapter } from './myprovider/index.js';

// In constructor:
this.registeredAdapters.set('myprovider', MyProviderAdapter);
```

6. **Export in main index.js:**

```javascript
// src/adapters/index.js
export { MyProviderAdapter, MYPROVIDER_CONSTANTS } from './myprovider/index.js';
```

7. **Use it:**

```env
LLM_PROVIDER=myprovider
MYPROVIDER_API_KEY=your-key
DEFAULT_MODEL=model1
```

## Standardized Response Format

All adapters must return responses in this format:

```javascript
{
  choices: [{
    message: {
      content: "Response text",
      role: "assistant"
    }
  }]
}
```

## Configuration Priority

1. Environment variables (`.env` file)
2. Config object passed to constructor
3. Default values in adapter

## Error Handling

Adapters should throw descriptive errors:
- `ECONNREFUSED` → Service unavailable
- `401` → Invalid API key
- `429` → Rate limit exceeded
- Other → Provider-specific error message

## Testing Adapters

```javascript
import { MyAdapter } from './my-adapter.js';

const adapter = new MyAdapter({
  API_KEY: 'test-key',
  DEFAULT_MODEL: 'test-model'
});

// Test validation
try {
  adapter.validateConfig();
} catch (error) {
  console.error('Invalid config:', error.message);
}

// Test model listing
const models = await adapter.getAvailableModels();
console.log('Available models:', models);

// Test chat
const response = await adapter.callChat({
  model: 'test-model',
  messages: [{ role: 'user', content: 'Hello' }]
});
console.log('Response:', response);
```

## Benefits

✅ **Plug-and-play**: Switch providers via configuration  
✅ **Unified interface**: Same API for all providers  
✅ **Extensible**: Easy to add new providers  
✅ **Type-safe**: Consistent response format  
✅ **Testable**: Mock adapters for testing  
✅ **Backward compatible**: Existing code works unchanged
