import { 
  ListResourcesRequestSchema, 
  ReadResourceRequestSchema,
  ListResourceTemplatesRequestSchema 
} from '@modelcontextprotocol/sdk/types.js';
import { CONFIG } from '../config/index.js';
import { getPromptList } from '../prompts/index.js';

/**
 * Resource Handler
 * Handles resource listing and reading
 */
export class ResourceHandler {
  constructor(server, llmService) {
    this.server = server;
    this.llmService = llmService;
  }

  /**
   * Setup resource request handlers
   */
  setup() {
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
        return await this.handleResourceRead(uri);
      } catch (error) {
        throw new Error(`Failed to read resource: ${error.message}`);
      }
    });

    // List resource templates (for parameterized resources)
    this.server.setRequestHandler(ListResourceTemplatesRequestSchema, async () => {
      return {
        resourceTemplates: [],
      };
    });
  }

  /**
   * Handle resource read based on URI
   */
  async handleResourceRead(uri) {
    switch (uri) {
      case 'mcp://local-llm/config':
        return this.getConfigResource(uri);

      case 'mcp://local-llm/models':
        return await this.getModelsResource(uri);

      case 'mcp://local-llm/tools':
        return this.getToolsResource(uri);

      case 'mcp://local-llm/prompts':
        return this.getPromptsResource(uri);

      case 'mcp://local-llm/usage_stats':
        return this.getUsageStatsResource(uri);

      default:
        throw new Error(`Unknown resource: ${uri}`);
    }
  }

  /**
   * Get config resource
   */
  getConfigResource(uri) {
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            provider: this.llmService.getProviderName(),
            ollama_url: CONFIG.OLLAMA_URL,
            openai_base_url: CONFIG.OPENAI_BASE_URL,
            anthropic_base_url: CONFIG.ANTHROPIC_BASE_URL,
            default_model: this.llmService.getDefaultModel(),
            max_tokens: CONFIG.MAX_TOKENS,
            temperature: CONFIG.TEMPERATURE,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Get models resource
   */
  async getModelsResource(uri) {
    const availableModels = await this.llmService.getAvailableModels();
    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            models: availableModels,
            count: availableModels.length,
            default: this.llmService.getDefaultModel(),
            provider: this.llmService.getProviderName(),
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Get tools resource
   */
  getToolsResource(uri) {
    // This will be set by the server instance
    if (!this.tools) {
      throw new Error('Tools not available');
    }

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

  /**
   * Get prompts resource
   */
  getPromptsResource(uri) {
    const prompts = getPromptList();

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({
            prompts,
            count: prompts.length,
          }, null, 2),
        },
      ],
    };
  }

  /**
   * Get usage stats resource
   */
  getUsageStatsResource(uri) {
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

  /**
   * Set tools reference (called by server)
   */
  setTools(tools) {
    this.tools = tools;
  }
}
