# Source Code Structure

This directory contains the modularized MCP Local LLM server codebase.

## Directory Structure

```
src/
├── config/           # Configuration and constants
├── handlers/         # MCP request handlers (tools, prompts, resources)
├── prompts/          # Prompt definitions
├── services/         # Business logic services (Ollama, model selection)
├── tools/            # MCP tool implementations
├── memory/           # Memory store implementation
└── index.js          # Main server entry point
```

## Modules

### `config/`
- **`index.js`**: Server configuration loaded from environment variables
  - `CONFIG`: Ollama URL, default model, max tokens, temperature
  - `SERVER_INFO`: Server name and version

### `prompts/`
Contains all MCP prompt definitions:
- **`mcp-tool-usage-rules.js`**: Mandatory rules for using MCP tools
- **`token-economy-guidelines.js`**: Guidelines for token savings
- **`thinking-layer-instructions.js`**: Instructions for think_through tool
- **`context-compression-rules.js`**: Rules for compression tools
- **`index.js`**: Exports all prompts and helper functions

### `handlers/`
MCP protocol request handlers:
- **`tool-handler.js`**: Handles tool listing and execution
- **`prompt-handler.js`**: Handles prompt listing and retrieval
- **`resource-handler.js`**: Handles resource listing and reading
- **`index.js`**: Exports all handlers

### `services/`
Business logic services:
- **`ollama-service.js`**: Ollama API interactions
  - `getAvailableModels()`: Fetch available models
  - `callChat()`: Call Ollama chat API
- **`model-selector.js`**: Intelligent model selection
  - `selectBestModel()`: Auto-select model based on request
  - `getOptimalTemperature()`: Get optimal temperature
  - `getOptimalMaxTokens()`: Get optimal token limit
- **`index.js`**: Exports all services

### `tools/`
MCP tool implementations (see `tools/README.md` for details)

### `memory/`
Memory store implementation for persistent memory features

### `index.js`
Main server entry point:
- Initializes server and all components
- Sets up handlers
- Exposes services to tools via getters
- Handles server lifecycle

## Architecture

The server follows a modular architecture:

1. **Configuration** (`config/`): Centralized configuration
2. **Services** (`services/`): Business logic and external API interactions
3. **Handlers** (`handlers/`): MCP protocol request/response handling
4. **Prompts** (`prompts/`): Prompt definitions separated from handlers
5. **Tools** (`tools/`): Tool implementations that use services
6. **Main** (`index.js`): Orchestrates all components

## Benefits

- **Modularity**: Each module has a single responsibility
- **Maintainability**: Easy to locate and modify specific functionality
- **Testability**: Services and handlers can be tested independently
- **Scalability**: Easy to add new prompts, handlers, or services
- **Organization**: Clear separation of concerns

## Adding New Components

### Adding a New Prompt
1. Create a new file in `prompts/` (e.g., `my-prompt.js`)
2. Export prompt object with `name`, `description`, and `messages`
3. Add to `prompts/index.js` exports

### Adding a New Service
1. Create a new file in `services/` (e.g., `my-service.js`)
2. Export service class or functions
3. Add to `services/index.js` exports
4. Use in handlers or tools as needed

### Adding a New Handler
1. Create a new file in `handlers/` (e.g., `my-handler.js`)
2. Export handler class with `setup()` method
3. Add to `handlers/index.js` exports
4. Initialize in `index.js` `setupHandlers()` method
