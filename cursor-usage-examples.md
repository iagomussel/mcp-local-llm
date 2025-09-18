# Cursor MCP Usage Examples

## 🎯 How to Use MCP Tools in Cursor

### ❌ WRONG - Don't do this:
```
User: "Humanize this text: 'Este é um texto técnico que precisa ser humanizado'"

Cursor: *tries to humanize manually*
```

### ✅ CORRECT - Do this:
```
User: "Humanize this text: 'Este é um texto técnico que precisa ser humanizado'"

Cursor: *uses MCP tool*
humanize_compact: { content: "Este é um texto técnico que precisa ser humanizado" }
```

## 📝 File Processing Examples

### ❌ WRONG:
```
User: "Humanize the content in src/index.js"

Cursor: *reads entire file and tries to process it manually*
```

### ✅ CORRECT:
```
User: "Humanize the content in src/index.js"

Cursor: *uses MCP tool*
humanize_file: { file_path: "src/index.js" }
```

### ✅ CORRECT (specific lines):
```
User: "Humanize lines 10-20 in src/index.js"

Cursor: *uses MCP tool*
humanize_file: { 
  file_path: "src/index.js", 
  start_line: 10, 
  end_line: 20 
}
```

## ⚡ Command Execution Examples

### ❌ WRONG:
```
User: "Run npm install"

Cursor: *uses run_terminal_cmd directly*
```

### ✅ CORRECT:
```
User: "Run npm install"

Cursor: *uses MCP tool*
run_command: { 
  command: "npm install", 
  directory: "/current/project",
  summary_only: true 
}
```

## 🤖 AI Questions Examples

### ❌ WRONG:
```
User: "How can I optimize this code?"

Cursor: *tries to answer directly without using AI models*
```

### ✅ CORRECT:
```
User: "How can I optimize this code?"

Cursor: *uses MCP tool*
ask_llm: { question: "How can I optimize this code?" }
```

## 💰 Token Economy Examples

### High Token Usage (❌):
```
Input: 1000+ characters of file content
Output: 500+ characters of response
Total: 1500+ characters = High IDE token cost
```

### Low Token Usage (✅):
```
Input: 50 characters (file path + line numbers)
Output: 200 characters (compact response)
Total: 250 characters = 83% token savings
```

## 🎯 Best Practices

1. **Always use MCP tools** for text processing
2. **Use file references** instead of content
3. **Use compact responses** when possible
4. **Use command summaries** instead of full output
5. **Let MCP handle** model selection automatically

## 🚀 Expected Results

- **90%+ token savings** for IDE
- **Faster response times**
- **More efficient context management**
- **Lower costs** for Cursor usage
- **Better performance** in long sessions

