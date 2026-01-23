/**
 * MCP Tool Usage Rules Prompt
 * Injects mandatory rules for using MCP tools instead of direct actions
 */
export const mcpToolUsageRules = {
  name: 'mcp_tool_usage_rules',
  description: 'Injects mandatory rules for using MCP tools instead of direct actions. Use this to enforce token economy and proper tool usage.',
  messages: [
    {
      role: 'user',
      content: `# MANDATORY: Use MCP Tools Instead of Direct Actions

## CRITICAL RULE: NEVER do these tasks directly - ALWAYS use MCP tools:

### 1. Text Humanization
- ❌ NEVER: Try to humanize text yourself
- ✅ ALWAYS: Use \`humanize_content\` or \`humanize_compact\` MCP tools
- ✅ ALWAYS: Use \`humanize_file\` for file content with line references

### 2. File Operations
- ❌ NEVER: Read entire files to process content
- ✅ ALWAYS: Use \`humanize_file\` with file_path + optional line numbers
- ✅ ALWAYS: Pass file references instead of file content

### 3. Terminal Commands
- ❌ NEVER: Use \`run_terminal_cmd\` directly
- ✅ ALWAYS: Use \`run_command\` MCP tool with summary_only=true
- ✅ ALWAYS: Let MCP handle command execution and return summaries

### 4. AI Model Interactions
- ❌ NEVER: Try to access AI models directly
- ✅ ALWAYS: Use \`ask_llm\` MCP tool for questions
- ✅ ALWAYS: Let MCP handle model selection automatically

### 5. File Comparison & Analysis
- ❌ NEVER: Manually compare files or branches
- ✅ ALWAYS: Use \`diff_files\` for file comparisons with LLM analysis
- ✅ ALWAYS: Use \`diff_branches\` for git branch comparisons with LLM analysis
- ✅ ALWAYS: Use \`git_diff_file\` for specific file comparison between branches

### 6. Code Debugging
- ❌ NEVER: Try to debug code manually without context
- ✅ ALWAYS: Use \`debugger\` tool for comprehensive code analysis
- ✅ ALWAYS: Let MCP provide full context and LLM-powered debugging

### 7. Large File Analysis
- ❌ NEVER: Read entire large files into context
- ✅ ALWAYS: Use \`analyze_huge_file\` to get structured summaries
- ✅ ALWAYS: Process files locally before sending to Cursor

### 8. Error Log Processing
- ❌ NEVER: Send entire log files to Cursor
- ✅ ALWAYS: Use \`digest_error_logs\` to get error summaries
- ✅ ALWAYS: Process logs locally to extract patterns

### 9. Codebase Discovery
- ❌ NEVER: Search codebase manually or send large code blocks
- ✅ ALWAYS: Use \`codebase_discovery\` for semantic search
- ✅ ALWAYS: Get file references and line numbers only

### 10. Complex Task Planning
- ❌ NEVER: Execute complex tasks without planning
- ✅ ALWAYS: Use \`think_through\` for complex tasks requiring analysis
- ✅ ALWAYS: Get structured plans before execution

## FORBIDDEN Actions
- ❌ Read entire files to process content
- ❌ Execute terminal commands with \`run_terminal_cmd\`
- ❌ Try to humanize text manually
- ❌ Access AI models directly
- ❌ Pass large content blocks to IDE
- ❌ Manually compare files or branches
- ❌ Debug code without comprehensive context
- ❌ Analyze diffs without LLM assistance

## REQUIRED Actions
- ✅ Use MCP tools for all text processing
- ✅ Use file references instead of content
- ✅ Use compact responses when possible
- ✅ Use command summaries instead of full output
- ✅ Let MCP handle model selection automatically
- ✅ Use context compression tools for large files/logs
- ✅ Use thinking layer for complex tasks

Remember: The MCP tools are optimized for IDE token economy. Always use them instead of direct actions!`,
    },
  ],
};
