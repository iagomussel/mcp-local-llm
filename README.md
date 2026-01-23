# MCP Local LLM Server - Context Compressor

A Model Context Protocol (MCP) server that uses Ollama as a context preprocessor to reduce token consumption in Cursor by up to 80%. This server processes large files, error logs, and codebase searches locally before sending optimized summaries to Cursor.

## Features

- 🤖 **Ollama Integration**: Uses Ollama for local LLM processing
- 📉 **Token Reduction**: Reduces token usage by processing context locally
- 🔧 **Multiple Tools**: Context compression, code analysis, log processing, and semantic search
- 📝 **MCP Prompts**: Dynamic instruction injection for Cursor
- 📦 **MCP Resources**: Read-only data resources (config, models, tools, prompts, stats)
- ⚙️ **Configurable**: Customizable model, temperature, and token limits
- 🚀 **Easy Setup**: Simple installation and configuration
- 📡 **MCP Compatible**: Works with any MCP-compatible client
- 🔒 **Privacy**: Processes sensitive data locally, only sends summaries to Cursor
- ✅ **Full MCP Support**: Implements all core MCP capabilities (Tools, Prompts, Resources)

## Prerequisites

1. **Node.js** (version 18 or higher)
2. **Ollama** installed and running
   - Download from: https://ollama.ai/
   - Install and start Ollama service
   - Pull at least one model: `ollama pull llama3`

## Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

## Configuration

The server can be configured using environment variables in the MCP client configuration file.

### Provider Selection

Set `LLM_PROVIDER` to choose which LLM provider to use:

```bash
# Select provider: 'ollama', 'openai', 'anthropic', or 'gemini'
export LLM_PROVIDER=ollama
```

### Provider-Specific Configuration

**Ollama (default):**
```bash
export LLM_PROVIDER=ollama
export OLLAMA_URL=http://localhost:11434
export MODEL_NAME=llama3
```

**OpenAI:**
```bash
export LLM_PROVIDER=openai
export OPENAI_API_KEY=sk-your-api-key
export MODEL_NAME=gpt-3.5-turbo
```

**Anthropic:**
```bash
export LLM_PROVIDER=anthropic
export ANTHROPIC_API_KEY=sk-ant-your-api-key
export MODEL_NAME=claude-3-haiku-20240307
```

**Gemini:**
```bash
export LLM_PROVIDER=gemini
export GEMINI_API_KEY=your-api-key
export MODEL_NAME=gemini-1.5-flash
```

### Common Settings

```bash
# Maximum tokens in response (default: 256)
export MAX_TOKENS=256

# Temperature for response generation (default: 0.7)
export TEMPERATURE=0.7
```

See [MCP_CONFIGURATION.md](./MCP_CONFIGURATION.md) for detailed configuration examples.

## Usage

### Starting the Server

```bash
# Start the MCP server
npm start

# Or for development with auto-restart
npm run dev
```

### Available Tools

The server provides multiple tools for context compression and code analysis:

#### 1. `analyze_huge_file`
Analyzes large files locally and returns a structured summary with architecture, global variables, entry points, and main logic. Reduces token usage by processing files locally before sending to Cursor.

**Parameters:**
- `path` (required): Path to the file to analyze

**Example:**
```json
{
  "name": "analyze_huge_file",
  "arguments": {
    "path": "/path/to/large-file.js"
  }
}
```

**Returns:** JSON with `architecture`, `global_variables`, `entry_points`, `main_logic`, and `original_size`

#### 2. `digest_error_logs`
Processes error logs locally to identify patterns, remove repetitive timestamps, and group similar errors. Returns a structured summary with probable cause and statistics.

**Parameters:**
- `log_file_path` (optional): Path to the log file
- `terminal_output` (optional): Direct terminal output content

**Example:**
```json
{
  "name": "digest_error_logs",
  "arguments": {
    "log_file_path": "/path/to/error.log"
  }
}
```

**Returns:** JSON with `probable_cause`, `occurrences`, `period`, `error_types`, and `recommendation`

#### 3. `codebase_discovery`
Performs semantic search in the codebase to find files and specific lines where related logic is implemented. Uses local processing to reduce token usage.

**Parameters:**
- `query` (required): Semantic query about the code (e.g., "where is payment processed?")
- `root_path` (optional): Root directory path to search in (default: current directory)

**Example:**
```json
{
  "name": "codebase_discovery",
  "arguments": {
    "query": "where is payment processed?",
    "root_path": "/path/to/project"
  }
}
```

**Returns:** JSON with `files` (array of file references with line numbers), `total_occurrences`, and `summary`

#### 4. `ask_llm`
Ask a question to the AI model running via Ollama and get a response.

**Parameters:**
- `question` (required): The question or prompt to send to the AI model

**Example:**
```json
{
  "name": "ask_llm",
  "arguments": {
    "question": "What is the capital of France?"
  }
}
```

#### 5. `check_llm_status`
Check if Ollama is running and accessible.

**Example:**
```json
{
  "name": "check_llm_status",
  "arguments": {}
}
```

#### 6. `think_through`
Adds an extra thinking layer by analyzing tasks, considering multiple approaches, and providing structured reasoning before execution.

**Parameters:**
- `task` (required): The task, question, or problem to think through
- `context` (optional): Additional context about the situation
- `focus_areas` (optional): Specific areas to focus on (e.g., ["security", "performance"])
- `output_format` (optional): Format of output - "plan", "analysis", "considerations", or "structured" (default)

**Example:**
```json
{
  "name": "think_through",
  "arguments": {
    "task": "Refactor authentication to use JWT",
    "context": "Current: session-based, Node.js/Express",
    "focus_areas": ["security", "maintainability"],
    "output_format": "structured"
  }
}
```

### Available Prompts

The server provides MCP prompts that inject dynamic instructions into Cursor:

1. **`mcp_tool_usage_rules`**: Mandatory rules for using MCP tools instead of direct actions
2. **`token_economy_guidelines`**: Guidelines for maximizing token savings
3. **`thinking_layer_instructions`**: Instructions for using the thinking layer
4. **`context_compression_rules`**: Rules for using context compression tools
5. **`chat_end_summary_rule`**: Automatically stores chat summaries using memory_store tool (can be disabled via `DISABLE_CHAT_SUMMARY_RULE`)

**Note:** The `chat_end_summary_rule` prompt is automatically available to all projects using this MCP server. To disable it, set the environment variable `DISABLE_CHAT_SUMMARY_RULE=true` in your MCP configuration.

### Available Resources

The server exposes read-only resources via MCP:

1. **`mcp://local-llm/config`**: Current server configuration
2. **`mcp://local-llm/models`**: List of available Ollama models
3. **`mcp://local-llm/tools`**: List of all available tools
4. **`mcp://local-llm/prompts`**: List of all available prompts
5. **`mcp://local-llm/usage_stats`**: Usage statistics and token savings info

**Example:**
```json
{
  "method": "resources/read",
  "params": {
    "uri": "mcp://local-llm/config"
  }
}
```

## MCP Client Integration

To use this server with an MCP client (like Cursor), add it to your client configuration.

### Basic Configuration (Ollama)

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["path/to/your/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "ollama",
        "OLLAMA_URL": "http://localhost:11434",
        "MODEL_NAME": "llama3"
      }
    }
  }
}
```

### Using Different Providers

The server supports multiple LLM providers. Set `LLM_PROVIDER` to switch:

**OpenAI:**
```json
{
  "env": {
    "LLM_PROVIDER": "openai",
    "OPENAI_API_KEY": "sk-your-key",
    "MODEL_NAME": "gpt-3.5-turbo"
  }
}
```

**Anthropic:**
```json
{
  "env": {
    "LLM_PROVIDER": "anthropic",
    "ANTHROPIC_API_KEY": "sk-ant-your-key",
    "MODEL_NAME": "claude-3-haiku-20240307"
  }
}
```

**Gemini:**
```json
{
  "env": {
    "LLM_PROVIDER": "gemini",
    "GEMINI_API_KEY": "your-key",
    "MODEL_NAME": "gemini-1.5-flash"
  }
}
```

See [MCP_CONFIGURATION.md](./MCP_CONFIGURATION.md) for complete configuration guide.

## Troubleshooting

### Common Issues

1. **Connection Refused Error**
   - Make sure Ollama is running: `ollama serve` or check if the service is running
   - Verify Ollama is accessible at http://localhost:11434
   - Check if Ollama is installed: `ollama --version`

2. **No Models Available**
   - Pull a model: `ollama pull llama3`
   - Check available models: `ollama list`
   - Recommended models: `llama3`, `deepseek-coder`, `codellama`, `mistral`

3. **Timeout Errors**
   - Large files may take time to process (max 15 seconds)
   - Consider using smaller models for faster responses
   - Check Ollama resource allocation

4. **Tool Errors**
   - Tools return generic error messages (identity hiding)
   - Check server logs for detailed error information
   - Verify file paths are correct and accessible

### Testing the Server

You can test the server manually by sending MCP requests:

```bash
# Test checking Ollama status
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "check_llm_status", "arguments": {}}}' | node src/index.js

# Test asking a question
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "ask_llm", "arguments": {"question": "Hello, how are you?"}}}' | node src/index.js

# Test analyzing a file
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "analyze_huge_file", "arguments": {"path": "src/index.js"}}}' | node src/index.js
```

## Development

### Project Structure

```
mcp-local-llm/
├── src/
│   ├── index.js          # Main MCP server implementation
│   └── tools/            # Tool implementations
│       ├── AnalyzeHugeFileTool.js
│       ├── DigestErrorLogsTool.js
│       ├── CodebaseDiscoveryTool.js
│       └── ... (other tools)
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

### Adding New Tools

To add new tools:

1. Create a new tool class extending `BaseTool` in `src/tools/`
2. Implement `getToolDefinition()` and `handle()` methods
3. Add the tool to `src/tools/index.js` exports and `ALL_TOOLS` array
4. The tool will be automatically registered with the MCP server

## License

MIT License - feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.
