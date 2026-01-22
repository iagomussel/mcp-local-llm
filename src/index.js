#!/usr/bin/env node

import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { ALL_TOOLS } from './tools/index.js';

// Load environment variables from .env file
// Suppress dotenv warnings by setting silent mode
config({ debug: false });

// Configuration
const CONFIG = {
  OLLAMA_URL: process.env.OLLAMA_URL || 'http://localhost:11434',
  DEFAULT_MODEL: process.env.MODEL_NAME || 'llama3',
  MAX_TOKENS: parseInt(process.env.MAX_TOKENS) || 256,
  TEMPERATURE: parseFloat(process.env.TEMPERATURE) || 0.7,
};

class LocalLLMServer {
  constructor() {
    this.server = new Server(
      {
        name: 'mcp-local-llm',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.CONFIG = CONFIG;
    this.tools = new Map();
    
    this.initializeTools();
    this.setupToolHandlers();
    this.setupPromptHandlers();
    this.setupResourceHandlers();
    this.setupErrorHandling();
    this.initializeModels();
  }

  // Initialize all tools
  initializeTools() {
    for (const ToolClass of ALL_TOOLS) {
      const tool = new ToolClass(this);
      this.tools.set(tool.getToolDefinition().name, tool);
    }
  }

  // Initialize models on startup
  async initializeModels() {
    try {
      // Check if Ollama is accessible
      const availableModels = await this.getAvailableModels();
      
      if (availableModels.length === 0) {
        // Only log to stderr (not stdout) to avoid interfering with MCP protocol
        console.error('[MCP] Warning: No models found. Make sure Ollama is running and has models installed.');
        console.error('[MCP] Install a model with: ollama pull llama3');
      }
    } catch (error) {
      // Only log to stderr to avoid interfering with MCP protocol
      console.error('[MCP] Failed to initialize models:', error.message);
      console.error('[MCP] Make sure Ollama is running at', CONFIG.OLLAMA_URL);
    }
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      const tools = Array.from(this.tools.values()).map(tool => tool.getToolDefinition());
      
      return {
        tools,
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        const tool = this.tools.get(name);
        if (!tool) {
          throw new Error(`Unknown tool: ${name}`);
        }

        return await tool.handle(args);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  setupPromptHandlers() {
    // List available prompts
    this.server.setRequestHandler(ListPromptsRequestSchema, async () => {
      return {
        prompts: [
          {
            name: 'mcp_tool_usage_rules',
            description: 'Injects mandatory rules for using MCP tools instead of direct actions. Use this to enforce token economy and proper tool usage.',
            arguments: [],
          },
          {
            name: 'token_economy_guidelines',
            description: 'Provides guidelines for maximizing token savings when working with files and commands.',
            arguments: [],
          },
          {
            name: 'thinking_layer_instructions',
            description: 'Instructions for using the thinking layer (think_through tool) for complex tasks.',
            arguments: [],
          },
          {
            name: 'context_compression_rules',
            description: 'Rules for using context compression tools (analyze_huge_file, digest_error_logs, codebase_discovery).',
            arguments: [],
          },
        ],
      };
    });

    // Handle prompt requests
    this.server.setRequestHandler(GetPromptRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const prompts = {
        mcp_tool_usage_rules: {
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
        },
        token_economy_guidelines: {
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
        },
        thinking_layer_instructions: {
          messages: [
            {
              role: 'user',
              content: `# Thinking Layer Instructions

## When to Use \`think_through\` Tool:

Use the thinking layer for complex tasks that require:
- Planning and analysis before execution
- Multiple approach evaluation
- Risk assessment
- Structured decision making

## Use Cases:

### 1. Before Major Refactoring
- Analyze impact and plan approach
- Consider multiple refactoring strategies
- Evaluate risks and dependencies

### 2. Architecture Decisions
- Compare multiple approaches
- Evaluate pros/cons of each option
- Get structured recommendations

### 3. Complex Bug Fixes
- Understand root cause deeply
- Plan solution approach
- Consider side effects

### 4. Performance Optimization
- Analyze bottlenecks
- Plan optimization strategy
- Evaluate tradeoffs

### 5. Security Considerations
- Evaluate risks
- Plan mitigation strategies
- Consider attack vectors

## Output Formats:

- **\`plan\`**: Step-by-step execution plan
- **\`analysis\`**: Deep technical analysis with multiple approaches
- **\`considerations\`**: Pros/cons and tradeoffs
- **\`structured\`**: Complete analysis (default) - includes plan, analysis, considerations, risks, and metrics

## Example Usage:

\`\`\`json
{
  "name": "think_through",
  "arguments": {
    "task": "Refactor authentication to use JWT",
    "context": "Current: session-based, Node.js/Express",
    "focus_areas": ["security", "maintainability"],
    "output_format": "structured"
  }
}
\`\`\`

## Benefits:
- Better decision making with structured analysis
- Reduced execution errors through planning
- Multiple approaches considered
- Risk mitigation before implementation`,
            },
          ],
        },
        context_compression_rules: {
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
        },
      };

      const prompt = prompts[name];
      if (!prompt) {
        throw new Error(`Unknown prompt: ${name}`);
      }

      return prompt;
    });
  }

  setupResourceHandlers() {
    // List available resources
    this.server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'mcp://local-llm/config',
            name: 'server_config',
            description: 'Current server configuration (Ollama URL, default model, etc.)',
            mimeType: 'application/json',
          },
          {
            uri: 'mcp://local-llm/models',
            name: 'available_models',
            description: 'List of available Ollama models',
            mimeType: 'application/json',
          },
          {
            uri: 'mcp://local-llm/tools',
            name: 'tools_list',
            description: 'List of all available MCP tools with descriptions',
            mimeType: 'application/json',
          },
          {
            uri: 'mcp://local-llm/prompts',
            name: 'prompts_list',
            description: 'List of all available MCP prompts with descriptions',
            mimeType: 'application/json',
          },
          {
            uri: 'mcp://local-llm/usage_stats',
            name: 'usage_statistics',
            description: 'Usage statistics and token savings information',
            mimeType: 'application/json',
          },
        ],
      };
    });

    // Handle resource read requests
    this.server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      const { uri } = request.params;

      try {
        switch (uri) {
          case 'mcp://local-llm/config': {
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    ollama_url: CONFIG.OLLAMA_URL,
                    default_model: CONFIG.DEFAULT_MODEL,
                    max_tokens: CONFIG.MAX_TOKENS,
                    temperature: CONFIG.TEMPERATURE,
                  }, null, 2),
                },
              ],
            };
          }

          case 'mcp://local-llm/models': {
            const availableModels = await this.getAvailableModels();
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    models: availableModels,
                    count: availableModels.length,
                    default: CONFIG.DEFAULT_MODEL,
                  }, null, 2),
                },
              ],
            };
          }

          case 'mcp://local-llm/tools': {
            const tools = Array.from(this.tools.values()).map(tool => {
              const def = tool.getToolDefinition();
              return {
                name: def.name,
                description: def.description,
                inputSchema: def.inputSchema,
              };
            });
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    tools,
                    count: tools.length,
                  }, null, 2),
                },
              ],
            };
          }

          case 'mcp://local-llm/prompts': {
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    prompts: [
                      {
                        name: 'mcp_tool_usage_rules',
                        description: 'Injects mandatory rules for using MCP tools instead of direct actions',
                      },
                      {
                        name: 'token_economy_guidelines',
                        description: 'Provides guidelines for maximizing token savings',
                      },
                      {
                        name: 'thinking_layer_instructions',
                        description: 'Instructions for using the thinking layer (think_through tool)',
                      },
                      {
                        name: 'context_compression_rules',
                        description: 'Rules for using context compression tools',
                      },
                    ],
                    count: 4,
                  }, null, 2),
                },
              ],
            };
          }

          case 'mcp://local-llm/usage_stats': {
            // This could be enhanced to track actual usage statistics
            return {
              contents: [
                {
                  uri,
                  mimeType: 'application/json',
                  text: JSON.stringify({
                    token_savings_estimate: '80-90%',
                    features: {
                      context_compression: true,
                      local_processing: true,
                      thinking_layer: true,
                      prompt_injection: true,
                      resources: true,
                    },
                    capabilities: ['tools', 'prompts', 'resources'],
                  }, null, 2),
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown resource: ${uri}`);
        }
      } catch (error) {
        throw new Error(`Failed to read resource: ${error.message}`);
      }
    });
  }

  // Auto-select the best model based on request characteristics
  async selectBestModel(question) {
    const availableModels = await this.getAvailableModels();

    // Simple routing rules for Ollama models
    if (/code|debug|function|regex|algorithm|script/i.test(question)) {
      if (availableModels.includes("deepseek-coder")) return "deepseek-coder";
      if (availableModels.includes("codellama")) return "codellama";
      if (availableModels.includes("qwen2.5-coder")) return "qwen2.5-coder";
    }

    if (/math|calculation|logic|reason/i.test(question)) {
      if (availableModels.includes("deepseek-r1")) return "deepseek-r1";
      if (availableModels.includes("llama3.1")) return "llama3.1";
    }

    if (/story|creative|escreva|texto longo|ensaio/i.test(question)) {
      if (availableModels.includes("llama3.1")) return "llama3.1";
      if (availableModels.includes("mistral")) return "mistral";
    }

    if (/chat|menu|pedido|resposta curta/i.test(question)) {
      if (availableModels.includes("llama3")) return "llama3";
      if (availableModels.includes("mistral")) return "mistral";
    }

    // Fallback default
    return availableModels[0] || CONFIG.DEFAULT_MODEL;
  }

  // Get list of available models from Ollama
  async getAvailableModels() {
    try {
      const response = await axios.get(`${CONFIG.OLLAMA_URL}/api/tags`);
      const modelsData = response.data?.models || [];
      
      if (Array.isArray(modelsData)) {
        return modelsData.map(model => model.name).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      // Log to stderr only, don't interfere with MCP protocol
      console.error('[MCP] Failed to get available models:', error.message);
      return [];
    }
  }


  // Get optimal temperature based on request type
  getOptimalTemperature(question) {
    const isCreative = question.includes('creative') || question.includes('write') || question.includes('story') || question.includes('humanize') || question.includes('book');
    const isTechnical = question.includes('code') || question.includes('technical') || question.includes('algorithm');
    
    if (isCreative) return 0.8;
    if (isTechnical) return 0.3;
    return 0.7; // Default
  }

  // Get optimal max tokens based on request length and type
  getOptimalMaxTokens(question) {
    const questionLength = question.length;
    const isLongForm = question.includes('essay') || question.includes('detailed') || question.includes('comprehensive');
    const isCompact = question.includes('compact') || question.includes('summary') || question.includes('brief');
    
    // Token optimization for Cursor
    if (isCompact) return 150; // Very short for token economy
    if (isLongForm) return 1024; // Reduced from 2048
    if (questionLength > 500) return 512; // Reduced from 1024
    return 256; // Reduced from 512 for token economy
  }

  async callModelRunner(payload) {
    try {
      // Ollama uses /api/chat endpoint
      const response = await axios.post(
        `${CONFIG.OLLAMA_URL}/api/chat`,
        {
          model: payload.model || CONFIG.DEFAULT_MODEL,
          messages: payload.messages,
          stream: false,
          options: {
            temperature: payload.temperature || CONFIG.TEMPERATURE,
            num_predict: payload.max_tokens || CONFIG.MAX_TOKENS,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 15000, // 15 second timeout for Ollama
        }
      );

      // Transform Ollama response to match expected format
      const ollamaResponse = response.data;
      return {
        choices: [{
          message: {
            content: ollamaResponse.message?.content || '',
            role: ollamaResponse.message?.role || 'assistant',
          },
        }],
      };
    } catch (error) {
      // Log to stderr only, don't interfere with MCP protocol
      console.error('[MCP] Error calling model runner:', error.message);
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNREFUSED') {
        throw new Error(`Failed to process request: service unavailable`);
      }
      throw new Error(`Failed to process request: ${error.message}`);
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      // Log to stderr only
      console.error('[MCP] Server error:', error.message);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Don't log to stdout/stderr - MCP protocol uses stdio for JSON-RPC
    // Any logging should be minimal and to stderr only
  }
}

// Start the server
const server = new LocalLLMServer();
server.run().catch(console.error);