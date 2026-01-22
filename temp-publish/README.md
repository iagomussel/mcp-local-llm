# mcp-local-llm

MCP server that uses a local LLM to respond to queries - Binary distribution

## Quick Start

Use directly with npx (no installation needed):

```bash
npx mcp-local-llm
```

## Installation

Install globally:

```bash
npm install -g mcp-local-llm
```

Then use:

```bash
mcp-local-llm
```

Or install as a dependency:

```bash
npm install mcp-local-llm
```

Then use:

```bash
npx mcp-local-llm
```

Or directly:

```bash
node_modules/.bin/mcp-local-llm
```

## Configuration

The server can be configured using environment variables:

```bash
export OLLAMA_URL=http://localhost:11434
export MODEL_NAME=llama3
export MAX_TOKENS=256
export TEMPERATURE=0.7
```

## Supported Platforms

- Linux (x64)
- Windows (x64)
- macOS (x64 and ARM64)

## Requirements

- Node.js 18 or higher
- Ollama installed and running (https://ollama.ai/)

## License

MIT
