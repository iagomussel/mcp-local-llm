# Architecture: Abstraction Layer Pattern

## Overview

The application uses a strict abstraction layer pattern where **application code never imports specific adapters directly**. All LLM interactions go through `LLMService`, which provides a clean, provider-agnostic interface.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│     Application Layer                   │
│  (index.js, handlers, tools)            │
│                                         │
│  ✅ Uses: LLMService                    │
│  ❌ Never imports: Specific adapters    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Service Layer (Abstraction)         │
│  (LLMService, ModelSelector)            │
│                                         │
│  ✅ Uses: adapterFactory                │
│  ❌ Never imports: Specific adapters    │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Factory Layer                       │
│  (AdapterFactory)                       │
│                                         │
│  ✅ Uses: internal.js (adapters)        │
│  ✅ Creates adapters dynamically        │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│     Adapter Layer (Implementation)      │
│  (ollama/, openai/, anthropic/, gemini/)│
│                                         │
│  ✅ Self-contained modules              │
│  ✅ Only imported by factory            │
└─────────────────────────────────────────┘
```

## Import Rules

### ✅ Application Code (index.js, handlers, tools)

**MUST use LLMService:**
```javascript
import { LLMService } from './services/llm-service.js';

const llmService = new LLMService(CONFIG);
const models = await llmService.getAvailableModels();
```

**MUST NOT import adapters:**
```javascript
// ❌ FORBIDDEN in application code
import { OllamaAdapter } from './adapters/ollama/index.js';
```

### ✅ Service Layer (services/)

**MUST use adapterFactory:**
```javascript
import { adapterFactory } from '../adapters/index.js';

const adapter = adapterFactory.createAdapter('ollama', config);
```

**MUST NOT import specific adapters:**
```javascript
// ❌ FORBIDDEN in service layer
import { OllamaAdapter } from '../adapters/ollama/index.js';
```

### ✅ Factory Layer (adapters/adapter-factory.js)

**MUST use internal.js:**
```javascript
import { OllamaAdapter, OpenAIAdapter } from './internal.js';
```

**This is the ONLY place adapters are imported directly.**

## File Structure

```
src/
├── index.js                    # ✅ Uses LLMService only
├── handlers/                   # ✅ Uses LLMService only
├── services/
│   ├── llm-service.js          # ✅ Uses adapterFactory only
│   └── model-selector.js      # ✅ Uses LLMService only
└── adapters/
    ├── index.js               # ✅ Public API (no adapter exports)
    ├── internal.js            # ✅ Internal exports (factory only)
    ├── adapter-factory.js     # ✅ Uses internal.js
    └── [provider]/             # ✅ Self-contained modules
```

## Benefits

1. **Provider Agnostic**: Switch providers without changing application code
2. **Clean Separation**: Application code doesn't know about adapters
3. **Easy Testing**: Mock LLMService instead of adapters
4. **Maintainable**: Changes to adapters don't affect application code
5. **Extensible**: Add new providers without touching application code

## Verification

To verify the abstraction layer is maintained:

```bash
# Check for direct adapter imports in application code
grep -r "from.*adapters.*\(ollama\|openai\|anthropic\|gemini\)" src/index.js src/handlers src/services

# Should return no results (except in adapters/ directory)
```

## Adding New Providers

When adding a new provider:

1. Create adapter folder: `src/adapters/myprovider/`
2. Add to `src/adapters/internal.js`
3. Register in `src/adapters/adapter-factory.js`
4. **No changes needed** in application code!

The abstraction layer ensures new providers work automatically.
