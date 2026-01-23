/**
 * Token Economy Guidelines Prompt
 * Provides guidelines for maximizing token savings
 */
export const tokenEconomyGuidelines = {
  name: 'token_economy_guidelines',
  description: 'Provides guidelines for maximizing token savings when working with files and commands.',
  messages: [
    {
      role: 'user',
      content: `# Token Economy Guidelines

## For Maximum IDE Token Savings:

### File References
- Always use file paths + line numbers instead of content
- Example: \`humanize_file: { file_path: "src/index.js", start_line: 10, end_line: 20 }\`
- Never read entire files just to process a small portion

### Compact Responses
- Prefer \`humanize_compact\` over \`humanize_content\`
- Use \`summary_only=true\` for all command executions
- Request structured summaries instead of full content

### Minimal Parameters
- Only specify required parameters, use defaults for optional ones
- Don't include unnecessary context in tool calls
- Let MCP tools handle defaults automatically

### Context Compression
- Use \`analyze_huge_file\` for files > 500 lines
- Use \`digest_error_logs\` for any log processing
- Use \`codebase_discovery\` instead of manual code search

### Thinking Layer
- Use \`think_through\` before complex refactoring
- Get structured plans instead of ad-hoc execution
- Consider multiple approaches before implementing

## Token Savings Examples:

**High Token Usage (❌):**
- Input: 1000+ characters of file content
- Output: 500+ characters of response
- Total: 1500+ characters = High IDE token cost

**Low Token Usage (✅):**
- Input: 50 characters (file path + line numbers)
- Output: 200 characters (compact response)
- Total: 250 characters = 83% token savings

## Priority Order:
1. \`humanize_file\` (for file content)
2. \`humanize_compact\` (for text content)
3. \`humanize_content\` (for detailed text)
4. \`run_command\` with \`summary_only=true\` (for commands)
5. \`ask_llm\` (for AI questions)
6. \`analyze_huge_file\` (for large files)
7. \`digest_error_logs\` (for logs)
8. \`codebase_discovery\` (for semantic search)
9. \`think_through\` (for complex tasks)`,
    },
  ],
};
