#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { ALL_TOOLS } from './tools/index.js';
import { CONFIG, SERVER_INFO } from './config/index.js';
import { LLMService, ModelSelector } from './services/index.js';
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
    
    // Initialize components
    this.initializeTools();
    this.setupHandlers();
    this.setupErrorHandling();
    this.initializeModels();
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
    resourceHandler.setup();
  }

  /**
   * Initialize models on startup
   */
  async initializeModels() {
    try {
      const provider = this.config.LLM_PROVIDER || 'ollama';
      const availableModels = await this.llmService.getAvailableModels();
      
      if (availableModels.length === 0) {
        console.error(`[MCP] Warning: No models found for provider: ${provider}`);
        if (provider === 'ollama') {
          console.error('[MCP] Install a model with: ollama pull llama3');
        } else {
          console.error(`[MCP] Check your ${provider} API key and configuration`);
        }
      } else {
        console.error(`[MCP] Found ${availableModels.length} models for ${provider}`);
      }
    } catch (error) {
      console.error('[MCP] Failed to initialize models:', error.message);
      const provider = this.config.LLM_PROVIDER || 'ollama';
      if (provider === 'ollama') {
        console.error('[MCP] Make sure Ollama is running at', CONFIG.OLLAMA_URL);
      }
    }
  }

  /**
   * Setup error handling
   */
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

  /**
   * Run the server
   */
  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    // Don't log to stdout/stderr - MCP protocol uses stdio for JSON-RPC
    // Any logging should be minimal and to stderr only
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
}

// Start the server
const server = new LocalLLMServer();
server.run().catch(console.error);
