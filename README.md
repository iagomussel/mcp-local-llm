# MCP Local LLM Server

A Model Context Protocol (MCP) server that provides access to local Large Language Models (LLMs) using Docker Model Runner. This server allows MCP clients to interact with AI models running via Docker's Model Runner feature for various AI-powered tasks.

## Features

- 🤖 **Docker Model Runner Integration**: Works with AI models via Docker's Model Runner feature
- 🔧 **Multiple Tools**: Ask questions, start models, and check server status
- ⚙️ **Configurable**: Customizable model, temperature, and token limits
- 🚀 **Easy Setup**: Simple installation and configuration
- 📡 **MCP Compatible**: Works with any MCP-compatible client
- 🐳 **Docker Ready**: Designed to work with Docker Desktop Model Runner
- 🌐 **OpenAI Compatible**: Uses OpenAI-compatible API endpoints

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **Docker Desktop** (version 4.41+ for Windows, 4.40+ for macOS)
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop
3. **Docker Model Runner** enabled
   - Enable in Docker Desktop settings
   - Start a model using: `docker model run <model-name>`

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The server can be configured using environment variables:

```bash
# Docker Model Runner server URL (default: http://localhost:12434)
export MODEL_RUNNER_URL=http://localhost:12434

# Default model to use (default: ai/smollm2)
export MODEL_NAME=ai/smollm2

# Maximum tokens in response (default: 2048)
export MAX_TOKENS=2048

# Temperature for response generation (default: 0.7)
export TEMPERATURE=0.7
```

## Usage

### Starting the Server

```bash
# Start the MCP server
npm start

# Or for development with auto-restart
npm run dev
```

### Available Tools

The server provides three main tools:

#### 1. `ask_llm`
Ask a question to the AI model running via Docker Model Runner and get a response.

**Parameters:**
- `question` (required): The question or prompt to send to the AI model
- `model` (optional): Specific model to use (defaults to configured model)
- `temperature` (optional): Temperature for response generation (0.0-1.0)
- `max_tokens` (optional): Maximum tokens in response

**Example:**
```json
{
  "name": "ask_llm",
  "arguments": {
    "question": "What is the capital of France?",
    "model": "ai/smollm2",
    "temperature": 0.5,
    "max_tokens": 100
  }
}
```

#### 2. `start_model`
Start a Docker model using Docker Model Runner.

**Parameters:**
- `model` (required): The model name to start (e.g., ai/smollm2)

**Example:**
```json
{
  "name": "start_model",
  "arguments": {
    "model": "ai/smollm2"
  }
}
```

#### 3. `check_llm_status`
Check if Docker Model Runner is running and accessible.

**Example:**
```json
{
  "name": "check_llm_status",
  "arguments": {}
}
```

## MCP Client Integration

To use this server with an MCP client, add it to your client configuration:

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["path/to/your/mcp-local-llm/src/index.js"],
      "env": {
        "MODEL_RUNNER_URL": "http://localhost:12434",
        "MODEL_NAME": "ai/smollm2"
      }
    }
  }
}
```

## Troubleshooting

### Common Issues

1. **Connection Refused Error**
   - Make sure Docker Desktop is running
   - Check if Docker Model Runner is enabled in Docker Desktop settings
   - Verify Model Runner is accessible at http://localhost:12434

2. **Docker Model Runner Not Found**
   - Enable Docker Model Runner in Docker Desktop settings
   - Update Docker Desktop to version 4.41+ (Windows) or 4.40+ (macOS)
   - Start a model using: `docker model run <model-name>`

3. **No Models Available**
   - Run a model using: `docker model run ai/smollm2`
   - Check available models: `docker model ls`
   - Ensure the model is running: `docker model ps`

4. **Timeout Errors**
   - Large models may take time to respond
   - Consider using smaller models for faster responses
   - Increase timeout in the code if needed
   - Check Docker resource allocation

### Testing the Server

You can test the server manually by sending MCP requests:

```bash
# Test checking Model Runner status
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "check_llm_status", "arguments": {}}}' | node src/index.js

# Test starting a model
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "start_model", "arguments": {"model": "ai/smollm2"}}}' | node src/index.js

# Test asking a question
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "ask_llm", "arguments": {"question": "Hello, how are you?"}}}' | node src/index.js
```

## Development

### Project Structure

```
mcp-local-llm/
├── src/
│   └── index.js          # Main MCP server implementation
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Adding New Tools

To add new tools, extend the `setupToolHandlers()` method in `src/index.js`:

1. Add the tool definition to the `ListToolsRequestSchema` handler
2. Add a case in the `CallToolRequestSchema` handler
3. Implement the tool logic in a new method

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
