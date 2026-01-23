/**
 * Context Compression Rules Prompt
 * Rules for using context compression tools
 */
export const contextCompressionRules = {
  name: 'context_compression_rules',
  description: 'Rules for using context compression tools (analyze_huge_file, digest_error_logs, codebase_discovery).',
  messages: [
    {
      role: 'user',
      content: `# Context Compression Rules

## Tools for Reducing Token Usage:

### 1. \`analyze_huge_file\`
**Use when:** File is > 500 lines or complex structure
**Returns:** Structured JSON with:
- Architecture overview
- Global variables
- Entry points
- Main logic summary
- Original size

**Example:**
\`\`\`json
{
  "name": "analyze_huge_file",
  "arguments": {
    "path": "src/large-file.js"
  }
}
\`\`\`

### 2. \`digest_error_logs\`
**Use when:** Processing any error logs or terminal output
**Returns:** Structured JSON with:
- Probable cause
- Occurrence count
- Time period
- Error types
- Technical recommendation

**Example:**
\`\`\`json
{
  "name": "digest_error_logs",
  "arguments": {
    "log_file_path": "logs/error.log"
  }
}
\`\`\`

### 3. \`codebase_discovery\`
**Use when:** Searching for code logic or implementation
**Returns:** Structured JSON with:
- File references with line numbers
- Total occurrences
- Summary of findings

**Example:**
\`\`\`json
{
  "name": "codebase_discovery",
  "arguments": {
    "query": "where is payment processed?",
    "root_path": "/project"
  }
}
\`\`\`

## Rules:

1. **Always use compression tools** before reading large files
2. **Never send full file content** when a summary is sufficient
3. **Process logs locally** before sending to Cursor
4. **Use semantic search** instead of manual code reading
5. **Get structured summaries** instead of raw content

## Token Savings:
- Large file (1000 lines) → Summary (200 chars): **80% savings**
- Error log (5000 lines) → Digest (300 chars): **94% savings**
- Codebase search → File references only: **90% savings**`,
    },
  ],
};
