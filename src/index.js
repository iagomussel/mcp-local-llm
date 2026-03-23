#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ALL_TOOLS } from './tools/index.js';
import { CONFIG, SERVER_INFO } from './config/index.js';
import { LLMService, ModelSelector, CacheService } from './services/index.js';
import { ToolHandler, PromptHandler, ResourceHandler } from './handlers/index.js';

/**
 * MCP Local LLM Server
 * Provides local LLM processing capabilities through Ollama
 */
class LocalLLMServer {
  constructor() {
    this.server = new Server(
      SERVER_INFO,
      {
        capabilities: {
          tools: {},
          prompts: {},
          resources: {},
        },
      }
    );

    this.config = CONFIG;
    this.tools = new Map();
    
    // Initialize services with adapter pattern
    this.llmService = new LLMService(CONFIG);
    this.modelSelector = new ModelSelector(this.llmService);
    this.cacheService = CONFIG.CACHE_ENABLED
      ? new CacheService({ maxEntries: CONFIG.CACHE_MAX_ENTRIES, defaultTTL: CONFIG.CACHE_DEFAULT_TTL })
      : null;
    
    // Initialize components
    this.initializeTools();
    this.setupHandlers();
    this.setupErrorHandling();
    // Don't call initializeModels() here - it will be called after transport connection
  }

  /**
   * Initialize all tools
   */
  initializeTools() {
    for (const ToolClass of ALL_TOOLS) {
      const tool = new ToolClass(this);
      this.tools.set(tool.getToolDefinition().name, tool);
    }
  }

  /**
   * Setup all request handlers
   */
  setupHandlers() {
    // Setup tool handlers
    const toolHandler = new ToolHandler(this.server, this.tools);
    toolHandler.setup();

    // Setup prompt handlers
    const promptHandler = new PromptHandler(this.server);
    promptHandler.setup();

    // Setup resource handlers
    const resourceHandler = new ResourceHandler(this.server, this.llmService);
    resourceHandler.setTools(this.tools);
    resourceHandler.setCacheService(this.cacheService);
    resourceHandler.setup();
  }

  /**
   * Initialize models on startup
   */
  async initializeModels() {
    try {
      await this.llmService.getAvailableModels();
    } catch (error) {
      // Silent failure - server continues running
    }
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    this.server.onerror = (error) => {
      // Silent error handling
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Run the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    // Wait a bit for the MCP handshake to complete before logging
    // This prevents stderr output from interfering with the initialize call
    setImmediate(async () => {
      await this.initializeModels();
      await this.detectClientWorkdir();
    });
    
    // Don't log to stdout/stderr - MCP protocol uses stdio for JSON-RPC
    // Any logging should be minimal and to stderr only
  }

  /**
   * Detect client workspace directory
   * Option 3: Try MCP Roots first (if client supports it)
   * Option 2: Fallback to process.cwd()
   */
  async detectClientWorkdir() {
    try {
      if (this.server && typeof this.server.requestRoots === 'function') {
        try {
          const roots = await this.server.requestRoots();
          if (roots && roots.length > 0 && roots[0].uri) {
            let workdir = roots[0].uri;
            if (workdir.startsWith('file://')) {
              workdir = decodeURIComponent(workdir.replace('file://', ''));
            }
            CONFIG.CLIENT_WORKDIR = workdir;
            CONFIG.WORKDIR_SOURCE = 'mcp_roots';
            return;
          }
        } catch (error) {
          // MCP Roots not available, fallback
        }
      }
      
      CONFIG.CLIENT_WORKDIR = process.cwd();
      CONFIG.WORKDIR_SOURCE = 'process.cwd()';
    } catch (error) {
      // Silent failure
    }
  }

  // Expose services and utilities for tools
  get callModelRunner() {
    return (payload) => this.llmService.callChat(payload);
  }

  get selectBestModel() {
    return (question) => this.modelSelector.selectBestModel(question);
  }

  get getAvailableModels() {
    return () => this.llmService.getAvailableModels();
  }

  get getOptimalTemperature() {
    return (question) => this.modelSelector.getOptimalTemperature(question);
  }

  get getOptimalMaxTokens() {
    return (question) => this.modelSelector.getOptimalMaxTokens(question);
  }

  get getMaxTokensForModel() {
    return (modelName) => this.modelSelector.getMaxTokensForModel(modelName);
  }

  get getOptimalMaxTokensForModel() {
    return (modelName, question) => this.modelSelector.getOptimalMaxTokensForModel(modelName, question);
  }
}

// Start the server
const server = new LocalLLMServer();
server.run().catch(console.error);
