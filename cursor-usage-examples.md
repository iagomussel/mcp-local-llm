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

## 🧠 Thinking Layer Examples

### Using `think_through` for Complex Tasks

The `think_through` tool adds an extra layer of reasoning before executing complex tasks. It analyzes the task, considers multiple approaches, and provides structured planning.

### ✅ CORRECT - Planning before execution:
```
User: "Refactor the authentication system to use JWT tokens"

Cursor: *uses MCP tool for thinking*
think_through: {
  task: "Refactor the authentication system to use JWT tokens",
  context: "Current system uses session-based auth, Node.js backend, Express framework",
  focus_areas: ["security", "maintainability", "performance"],
  output_format: "structured"
}

Result: *Returns structured analysis with approaches, plan, risks, and recommendations*
```

### ✅ CORRECT - Quick analysis format:
```
User: "Should I use TypeScript or JavaScript for this new feature?"

Cursor: *uses MCP tool*
think_through: {
  task: "Should I use TypeScript or JavaScript for this new feature?",
  output_format: "considerations"
}

Result: *Returns pros/cons, tradeoffs, and recommendation*
```

### ✅ CORRECT - Step-by-step planning:
```
User: "Implement a caching layer for the API"

Cursor: *uses MCP tool*
think_through: {
  task: "Implement a caching layer for the API",
  context: "REST API with high read traffic, PostgreSQL database",
  output_format: "plan"
}

Result: *Returns structured plan with ordered steps, dependencies, and complexity estimate*
```

### Use Cases for `think_through`:

1. **Before major refactoring** - Analyze impact and plan approach
2. **Architecture decisions** - Compare multiple approaches
3. **Complex bug fixes** - Understand root cause and plan solution
4. **Performance optimization** - Analyze bottlenecks and plan improvements
5. **Security considerations** - Evaluate risks and mitigation strategies

### Output Formats:

- **`plan`**: Step-by-step execution plan
- **`analysis`**: Deep technical analysis with multiple approaches
- **`considerations`**: Pros/cons and tradeoffs
- **`structured`**: Complete analysis (default) - includes plan, analysis, considerations, risks, and metrics

## 🚀 Expected Results

- **90%+ token savings** for IDE
- **Faster response times**
- **More efficient context management**
- **Lower costs** for Cursor usage
- **Better performance** in long sessions
- **Better decision making** with thinking layer analysis

