# Testing Gemini Adapter via Cursor MCP Tools

## Setup

1. **Configure Cursor MCP settings** to use Gemini:

Edit your Cursor MCP configuration file (usually `~/.cursor/mcp.json` or Cursor settings):

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your-gemini-api-key",
        "MODEL_NAME": "gemini-1.5-flash"
      }
    }
  }
}
```

2. **Restart Cursor** to load the new configuration

3. **Get your Gemini API key** from: https://aistudio.google.com/app/apikey

## Testing via Cursor Tools

Once configured, you can use Cursor's MCP tools to test Gemini:

### Test 1: Simple Question

Use the `ask_llm` tool in Cursor:

```
Ask: "What is 2+2? Answer in one word."
```

This will use Gemini via the MCP server.

### Test 2: Codebase Review

Use the `ask_llm` tool to review the codebase:

```
Ask: "Please review the MCP Local LLM server codebase located at src/ and provide specific, actionable suggestions for improvements. Focus on architecture, error handling, performance, security, and code quality."
```

### Test 3: Analyze Files First

Use `analyze_huge_file` tool to get context, then ask:

1. First, analyze: `analyze_huge_file` with `path: "src/index.js"`
2. Then ask: Use `ask_llm` with the analysis results

### Test 4: Use think_through Tool

For complex analysis:

```
Use think_through tool with:
- task: "Review the adapter pattern implementation in this codebase"
- context: "MCP server with plug-and-play adapter pattern for multiple LLM providers"
- focus_areas: ["architecture", "code-quality"]
- output_format: "structured"
```

## Verification

Check which provider is active:

1. Use MCP resource: `mcp://local-llm/config`
2. Should show: `"provider": "gemini"`

Or check server logs (stderr):
```
[MCP] Using LLM provider: gemini
[MCP] Found X models for gemini
```

## Expected Behavior

- All `ask_llm` calls will use Gemini
- All tools that use LLM will use Gemini
- Model selection will work with Gemini models
- Responses will come from Gemini API

## Troubleshooting

### "Gemini API key is invalid"
- Verify API key is correct
- Check API key has proper permissions
- Ensure key is from Google AI Studio (not Vertex AI)

### "404 Not Found"
- Verify base URL is correct: `https://generativelanguage.googleapis.com/v1beta`
- Check model name is valid: `gemini-1.5-flash`

### "Rate limit exceeded"
- Wait a few seconds and try again
- Check your API quota

### Provider not switching
- Restart Cursor after changing `LLM_PROVIDER`
- Verify environment variable is set correctly
- Check server logs for initialization errors
