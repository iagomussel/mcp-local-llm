# Services Layer

This directory contains the service layer that provides abstraction over LLM adapters.

## Architecture

```
Application Code (index.js, handlers, tools)
         ↓
    LLMService (abstraction layer)
         ↓
  AdapterFactory (creates adapters)
         ↓
  Specific Adapters (ollama, openai, etc.)
```

## LLMService

The `LLMService` is the **only** interface that application code should use to interact with LLM providers.

### Usage

```javascript
import { LLMService } from './services/llm-service.js';
import { CONFIG } from './config/index.js';

// Create service - automatically uses configured provider
const llmService = new LLMService(CONFIG);

// Use the service - no adapter-specific code needed
const models = await llmService.getAvailableModels();
const response = await llmService.callChat({
  model: 'llama3',
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

### Methods

- `getAvailableModels()` - Get list of available models
- `callChat(payload)` - Call LLM chat API
- `getProviderName()` - Get current provider name
- `switchProvider(name, config)` - Switch to different provider
- `getDefaultModel()` - Get default model for current provider

## ModelSelector

Service for intelligent model selection based on request characteristics.

### Usage

```javascript
import { ModelSelector } from './services/model-selector.js';
import { LLMService } from './services/llm-service.js';

const llmService = new LLMService(CONFIG);
const selector = new ModelSelector(llmService);

// Auto-select best model based on question
const model = await selector.selectBestModel('How to optimize this code?');
```

## Important Rules

❌ **NEVER** import specific adapters in application code:
```javascript
// BAD - Don't do this!
import { OllamaAdapter } from './adapters/ollama/index.js';
```

✅ **ALWAYS** use LLMService:
```javascript
// GOOD - Use the abstraction layer
import { LLMService } from './services/llm-service.js';
```

## Benefits

- **Provider agnostic**: Switch providers without changing application code
- **Clean abstraction**: Application code doesn't know about adapters
- **Easy testing**: Mock LLMService instead of adapters
- **Consistent API**: Same interface regardless of provider
