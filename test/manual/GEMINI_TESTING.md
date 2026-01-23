# Gemini Adapter Testing Guide

## Quick Start

### 1. Set API Key

```bash
export GEMINI_API_KEY=your-gemini-api-key-here
```

Get your API key from: https://aistudio.google.com/app/apikey

### 2. Run Unit Tests (No API Key Required)

```bash
node --test test/unit/gemini-adapter.test.js
```

Tests adapter structure, validation, message transformation, and constants.

### 3. Run Integration Tests (API Key Required)

```bash
node test/manual/test-gemini-adapter.js
```

This will test:
- Direct adapter usage
- LLMService abstraction layer
- Full MCP server integration
- Error handling
- Constants export

## Test Coverage

### Unit Tests (`test/unit/gemini-adapter.test.js`)

✅ Adapter structure and inheritance  
✅ Configuration validation  
✅ Default model handling  
✅ Message transformation (to Gemini format)  
✅ Response transformation (to standard format)  
✅ Error handling for empty responses  
✅ Constants usage

### Integration Tests (`test/manual/test-gemini-adapter.js`)

✅ Direct adapter instantiation and API calls  
✅ LLMService abstraction layer  
✅ Full MCP server integration  
✅ Error handling (missing/invalid API keys)  
✅ Constants verification

## Codebase Review Test (`test/manual/test-gemini-codebase-review.js`)

Tests Gemini's ability to review the codebase and suggest improvements:
- Full codebase review with context
- Specific architectural questions
- Improvement suggestions

**Quick test:**
```bash
GEMINI_API_KEY=your-key node test/manual/test-gemini-simple.js
```

This will ask Gemini to review the codebase and provide improvement suggestions.

## Expected Output

### With API Key

```
🚀 Gemini Adapter Test Suite
======================================================================
🧪 Test 1: Direct Gemini Adapter Test
✅ Configuration validation passed
📋 Fetching available models...
✅ Found 4 models: gemini-1.5-flash, gemini-1.5-pro, ...
💬 Testing chat API...
✅ Chat API response received
📝 Response: Hello! How can I assist you today?...

🧪 Test 2: Gemini via LLMService (Abstraction Layer)
✅ LLMService initialized with provider: gemini
📋 Fetching available models via LLMService...
✅ Found 4 models via abstraction layer
💬 Testing chat via LLMService...
✅ Chat via abstraction layer successful
📝 Response: 4

🧪 Test 3: Gemini via MCP Server (Full Integration)
📝 Server: [MCP] Using LLM provider: gemini
💬 Testing ask_llm tool via MCP...
✅ MCP server test successful
📝 Response: Hello from Gemini!...

🧪 Test 4: Error Handling
✅ Correctly validates missing API key
✅ Correctly handles invalid API key

🧪 Test 5: Constants Export
✅ GEMINI_CONSTANTS exported: {...}
✅ Available models: gemini-1.5-flash, gemini-1.5-pro, ...

======================================================================
📊 Test Results Summary:
======================================================================
Direct Adapter Test:     ✅ PASSED
Abstraction Layer Test:  ✅ PASSED
MCP Server Test:         ✅ PASSED
Error Handling Test:     ✅ PASSED
Constants Test:          ✅ PASSED

Overall: 5/5 tests passed
🎉 All tests passed!
```

### Without API Key

Tests will skip API-dependent tests but still verify:
- Error handling
- Constants
- Structure validation

## Testing Specific Scenarios

### Test Default Model

```bash
GEMINI_API_KEY=your-key MODEL_NAME=gemini-1.5-pro node test/manual/test-gemini-adapter.js
```

### Test Custom Base URL

```bash
GEMINI_API_KEY=your-key GEMINI_BASE_URL=https://custom-url.com/v1beta node test/manual/test-gemini-adapter.js
```

### Test via MCP Server

```bash
GEMINI_API_KEY=your-key LLM_PROVIDER=gemini node src/index.js
```

Then use MCP client to call tools - they will use Gemini automatically.

## Troubleshooting

### "GEMINI_API_KEY is required"

Set the environment variable:
```bash
export GEMINI_API_KEY=your-key
```

### "Invalid API key"

- Verify your API key is correct
- Check API key has proper permissions
- Ensure API key is for Google AI Studio (not Vertex AI)

### "No candidate in Gemini response"

- Check API quota/limits
- Verify model name is correct
- Check request format

### Connection Errors

- Verify internet connection
- Check if Gemini API is accessible
- Verify base URL is correct

## Manual Testing

You can also test manually using curl:

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "role": "user",
      "parts": [{"text": "Hello!"}]
    }],
    "generationConfig": {
      "temperature": 0.7,
      "maxOutputTokens": 100
    }
  }'
```

## Integration with MCP

To test via MCP client configuration:

```json
{
  "mcpServers": {
    "local-llm": {
      "command": "node",
      "args": ["/path/to/mcp-local-llm/src/index.js"],
      "env": {
        "LLM_PROVIDER": "gemini",
        "GEMINI_API_KEY": "your-key",
        "MODEL_NAME": "gemini-1.5-flash"
      }
    }
  }
}
```

Then restart Cursor and use any MCP tool - it will automatically use Gemini!
