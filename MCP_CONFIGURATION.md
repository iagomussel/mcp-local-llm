# MCP Configuration Guide

This guide explains how clients configure which LLM provider/adapter to use via MCP configuration files.

## How It Works

The MCP server reads configuration from **environment variables** passed through the MCP client configuration file (typically `mcp.json` or `.cursor/mcp.json`). The client never directly selects adapters - instead, it sets the `LLM_PROVIDER` environment variable, and the server's `LLMService` automatically initializes the correct adapter.

## Configuration Flow

```
Client (Cursor/IDE)
    ↓
MCP Configuration (mcp.json)
    ↓
Environment Variables (env)
    ↓
Server reads CONFIG
    ↓
LLMService initializes adapter
    ↓
AdapterFactory creates adapter
```

## MCP Configuration File Location

### Cursor
- **macOS**: `~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Linux**: `~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json`
- **Windows**: `%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json`

### VS Code with MCP Extension
- `~/.vscode/mcp.json` or workspace-specific configuration

## Configuration Examples

### Using Ollama (Default)

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "ollama",
        "OLLAMA_URL": "http://localhost:11434",
        "MODEL_NAME": "llama3",
        "MAX_TOKENS": "256",
        "TEMPERATURE": "0.7"
      }
    }
  }
}
```

### Using OpenAI

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "openai",
        "OPENAI_API_KEY": "sk-your-api-key-here",
        "OPENAI_BASE_URL": "https://api.openai.com/v1",
        "MODEL_NAME": "gpt-3.5-turbo",
        "MAX_TOKENS": "256",
        "TEMPERATURE": "0.7"
      }
    }
  }
}
```

### Using Anthropic Claude

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "anthropic",
        "ANTHROPIC_API_KEY": "sk-ant-your-api-key-here",
        "ANTHROPIC_BASE_URL": "https://api.anthropic.com/v1",
        "MODEL_NAME": "claude-3-haiku-20240307",
        "MAX_TOKENS": "256",
        "TEMPERATURE": "0.7"
      }
    }
  }
}
```

### Using Google Gemini

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your-gemini-api-key",
        "GEMINI_BASE_URL": "https://generativelanguage.googleapis.com/v1beta",
        "MODEL_NAME": "gemini-1.5-flash",
        "MAX_TOKENS": "256",
        "TEMPERATURE": "0.7"
      }
    }
  }
}
```

## Environment Variables Reference

### Provider Selection

| Variable | Values | Default | Description |
|----------|--------|---------|-------------|
| `LLM_PROVIDER` | `ollama`, `openai`, `anthropic`, `gemini` | `ollama` | Selects which LLM provider to use |

### Ollama Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama API URL |
| `MODEL_NAME` | Provider default | Default model name |

### OpenAI Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key |
| `OPENAI_BASE_URL` | No | API base URL (default: `https://api.openai.com/v1`) |
| `MODEL_NAME` | No | Default model (default: `gpt-3.5-turbo`) |

### Anthropic Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key |
| `ANTHROPIC_BASE_URL` | No | API base URL (default: `https://api.anthropic.com/v1`) |
| `MODEL_NAME` | No | Default model (default: `claude-3-haiku-20240307`) |

### Gemini Configuration

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `GEMINI_BASE_URL` | No | API base URL (default: `https://generativelanguage.googleapis.com/v1beta`) |
| `MODEL_NAME` | No | Default model (default: `gemini-1.5-flash`) |

### Common Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `MAX_TOKENS` | `256` | Maximum tokens per response |
| `TEMPERATURE` | `0.7` | Temperature for generation |

## How the Server Processes Configuration

1. **Server starts** → Reads environment variables
2. **CONFIG object** → Loads all environment variables
3. **LLMService constructor** → Receives CONFIG
4. **initializeAdapter()** → Checks `LLM_PROVIDER` env var
5. **AdapterFactory** → Creates adapter based on provider name
6. **Adapter instance** → Validates configuration and initializes

## Example: Complete Cursor Configuration

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": [
        "/home/user/mcp-local-llm/src/index.js"
      ],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "AIzaSy...",
        "MODEL_NAME": "gemini-1.5-flash",
        "MAX_TOKENS": "512",
        "TEMPERATURE": "0.8"
      }
    }
  }
}
```

## Switching Providers

To switch providers, simply change the `LLM_PROVIDER` environment variable in your MCP configuration:

```json
{
  "env": {
    "LLM_PROVIDER": "openai",  // Change this to switch providers
    "OPENAI_API_KEY": "sk-...",
    "MODEL_NAME": "gpt-4"
  }
}
```

After changing the configuration:
1. Restart Cursor/your MCP client
2. The server will automatically use the new provider
3. No code changes needed!

## Verification

After configuration, you can verify which provider is active:

1. **Check server logs** (stderr):
   ```
   [MCP] Using LLM provider: gemini
   ```

2. **Use MCP resource**:
   ```json
   {
     "method": "resources/read",
     "params": {
       "uri": "mcp://local-llm/config"
     }
   }
   ```
   
   Response will show:
   ```json
   {
     "provider": "gemini",
     "default_model": "gemini-1.5-flash",
     ...
   }
   ```

## Security Notes

- **Never commit API keys** to version control
- **Use environment variables** in MCP config (not hardcoded)
- **Consider using secrets management** for production
- **API keys are only used server-side** (never sent to client)

## Troubleshooting

### Provider Not Switching

- Check `LLM_PROVIDER` is set correctly in `env` section
- Restart Cursor/MCP client after configuration changes
- Check server logs for initialization errors

### Invalid API Key

- Verify API key is correct for selected provider
- Check API key has required permissions
- Ensure API key is set in `env` section (not just environment)

### Provider Not Found

- Verify provider name is correct: `ollama`, `openai`, `anthropic`, or `gemini`
- Check server logs for available adapters
- Ensure adapter is registered in `adapter-factory.js`

## Summary

The client configures the adapter by setting the `LLM_PROVIDER` environment variable in the MCP configuration file. The server's abstraction layer (`LLMService`) automatically handles adapter selection and initialization - the client never needs to know about specific adapters!
