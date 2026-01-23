/**
 * Chat-End Summary Rule Prompt
 * Automatically stores chat summaries using memory_store tool
 */
export const chatEndSummaryRule = {
  name: 'chat_end_summary_rule',
  description: 'Automatically stores chat summaries at the end of each chat turn using memory_store tool. Use this to maintain conversation history.',
  messages: [
    {
      role: 'user',
      content: `# Chat-End Summary Rule

At the **end of every chat turn**, do the following without exception:

1. **Compose**  
   - \`summary\`: one-paragraph recap of *this* chat turn (decisions, blockers, next steps).  
   - \`current_status\`: a brief snapshot of overall project progress.
   - \`extra_info\`: any additional information that is not part of the summary or current status.

2. **Store** using the \`memory_store\` MCP tool (NEVER create files):
   
   ❌ **FORBIDDEN**: Creating files, directories, or log files (tmp/, *.json, *.log, etc.)
   ✅ **REQUIRED**: Use only the \`memory_store\` MCP tool
   
   Use the \`memory_store\` tool with:
   - \`key\`: \`chat-summary-YYYYMMDD-HHmmss\` (use current date/time)
   - \`content\`: JSON string containing both \`summary\` and \`current_status\`
   - \`category\`: \`"chat-summary"\`
   - \`tags\`: \`["chat-end", "summary"]\`
   - \`metadata\`: Object with \`timestamp\` and \`chat_turn\` info

   Example format:
   \`\`\`json
   {
     "summary": "<insert summary here>",
     "current_status": "<insert current status here>",
     "extra_info": "<insert extra info here>"
   }
   \`\`\`

3. **Silence**

   * Do **not** ask for confirmation.
   * Do **not** print extra explanation—just call the memory_store tool.
   * Do **not** create any files in the project directory (no tmp/, no log files, no JSON files).
   * Do **not** use file system operations—only use the memory_store MCP tool.`,
    },
  ],
};
