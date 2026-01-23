# Gemini Adapter Setup and Testing Guide

## Prerequisites

1. **Get Gemini API Key**
   - Visit: https://aistudio.google.com/app/apikey
   - Create a new API key
   - Copy the key

## Configuration

### Option 1: Environment Variables (Recommended)

Set environment variables before running Cursor:

```bash
export GEMINI_API_KEY="your-api-key-here"
export LLM_PROVIDER="gemini"
export MODEL_NAME="gemini-2.5-flash"  # Optional, defaults to gemini-2.5-flash
```

### Option 2: Cursor MCP Configuration

Edit your Cursor MCP settings (`~/.cursor/mcp.json` or Cursor settings):

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/home/iagomussel/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your-api-key-here",
        "MODEL_NAME": "gemini-2.5-flash"
      }
    }
  }
}
```

**Important**: Restart Cursor after changing MCP configuration.

## Testing via Cursor MCP Tools

Once configured, you can test using Cursor's MCP tools:

### Test 1: Simple Question

Use `ask_llm` tool:
```
Question: "What is 2+2? Answer in one word."
```

### Test 2: Codebase Review

Use `ask_llm` tool:
```
Question: "Review the MCP Local LLM server codebase and provide specific, actionable suggestions for improvements. Focus on architecture, error handling, performance, security, and code quality."
```

### Test 3: File Analysis

1. Use `analyze_huge_file` tool:
   - Path: `/home/iagomussel/mcp-local-llm/src/index.js`

2. Then use `ask_llm` with the analysis results

### Test 4: Structured Analysis

Use `think_through` tool:
- task: "Review the adapter pattern implementation"
- context: "MCP server with plug-and-play adapter pattern"
- focus_areas: ["architecture", "code-quality"]
- output_format: "structured"

## Verification

Check which provider is active:

1. Use MCP resource: `mcp://local-llm/config`
2. Should show: `"provider": "gemini"`

Or check server logs (stderr):
```
[MCP] Using LLM provider: gemini
[MCP] Found X models for gemini
```

## Troubleshooting

### Error: "404 Not Found"

**Possible causes:**
1. Model name incorrect - verify model exists in `GEMINI_CONSTANTS.MODELS`
2. API endpoint incorrect - check `GEMINI_BASE_URL` is correct
3. API key invalid or missing

**Check logs:**
- Look for `[MCP] Gemini API Request:` in stderr
- Verify URL format: `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Verify model name doesn't include `models/` prefix

### Error: "API key is invalid"

- Verify API key is correct
- Check API key has proper permissions
- Ensure key is from Google AI Studio (not Vertex AI)
- Verify key is set in environment variables

### Error: "Rate limit exceeded"

- Wait a few seconds and try again
- Check your API quota at https://aistudio.google.com/

### Provider not switching

- Restart Cursor after changing `LLM_PROVIDER`
- Verify environment variable is set correctly
- Check server logs for initialization errors
- Verify `GEMINI_API_KEY` is set

## Expected Behavior

When properly configured:
- All `ask_llm` calls will use Gemini
- All tools that use LLM will use Gemini
- Model selection will work with Gemini models
- Responses will come from Gemini API
- Server logs will show Gemini API requests

## Debug Logging

The adapter includes debug logging. Check stderr for:
- `[MCP] Gemini API Request:` - Shows the full URL
- `[MCP] Gemini Model:` - Shows which model is being used
- `[MCP] Gemini Request Body:` - Shows the request payload
- `[MCP] Error calling Gemini:` - Shows any errors

## API Format

The adapter uses the correct Gemini API format:
- Endpoint: `POST /v1beta/models/{model}:generateContent`
- Header: `x-goog-api-key: {api-key}`
- Body: `{ contents: [...], generationConfig: {...} }`

Where `contents` is an array of objects with:
- `role`: "user" or "model"
- `parts`: [{ text: "..." }]
