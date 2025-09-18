#!/usr/bin/env node

import { config } from 'dotenv';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { ALL_TOOLS } from './tools/index.js';

// Load environment variables from .env file
config();

// Configuration
const CONFIG = {
  MODEL_RUNNER_URL: process.env.MODEL_RUNNER_URL,
  DEFAULT_MODEL: process.env.MODEL_NAME,
  MAX_TOKENS: parseInt(process.env.MAX_TOKENS),
  TEMPERATURE: parseFloat(process.env.TEMPERATURE),
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
        },
      }
    );

    this.CONFIG = CONFIG;
    this.tools = new Map();
    
    this.initializeTools();
    this.setupToolHandlers();
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
      console.log('🚀 Initializing MCP Local LLM Server...');
      
      // Check if Docker Model Runner is accessible
      const availableModels = await this.getAvailableModels();
      console.log(`📋 Found ${availableModels.length} available models:`, availableModels);
      
      // Ensure at least one model is available
      if (availableModels.length === 0) {
        console.log('⚠️ No models found, attempting to pull default model...');
        await this.ensureModelAvailable('ai/gemma3:4B-Q4_0');
      } else {
        console.log('✅ Models are ready for use');
      }
    } catch (error) {
      console.error('❌ Failed to initialize models:', error.message);
      console.log('💡 Make sure Docker Desktop is running and Model Runner is enabled');
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

  // Auto-select the best model based on request characteristics
  async selectBestModel(question) {
    const availableModels = await this.getAvailableModels();

    // Simple routing rules
    if (/code|debug|function|regex|algorithm|script/i.test(question)) {
      if (availableModels.includes("ai/qwen3")) return "ai/qwen3";
      if (availableModels.includes("ai/deepseek-r1-distill-llama:8B-Q4_K_M")) return "ai/deepseek-r1-distill-llama:8B-Q4_K_M";
    }

    if (/math|calculation|logic|reason/i.test(question)) {
      if (availableModels.includes("ai/deepseek-r1-distill-llama:8B-Q4_K_M")) return "ai/deepseek-r1-distill-llama:8B-Q4_K_M";
    }

    if (/story|creative|escreva|texto longo|ensaio/i.test(question)) {
      if (availableModels.includes("ai/gemma3")) return "ai/gemma3";
      if (availableModels.includes("ai/llama3.3")) return "ai/llama3.3";
    }

    if (/chat|menu|pedido|resposta curta/i.test(question)) {
      if (availableModels.includes("ai/mistral:7B-Q4_K_M")) return "ai/mistral:7B-Q4_K_M";
    }

    // Fallback default
    return availableModels[0] || CONFIG.DEFAULT_MODEL;
  }

  // Get list of available models from Docker Model Runner
  async getAvailableModels() {
    try {
      const response = await axios.get(`${CONFIG.MODEL_RUNNER_URL}/engines/llama.cpp/v1/models`);
      const modelsData = response.data?.data || response.data || [];
      
      if (Array.isArray(modelsData)) {
        return modelsData.map(model => model.id || model.tags?.[0]).filter(Boolean);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get available models:', error.message);
      return [];
    }
  }

  // Auto-pull a model if it's not available
  async autoPullModel(modelName) {
    try {
      console.log(`Attempting to pull model: ${modelName}`);
      
      // Use docker command to pull the model
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const dockerProcess = spawn('docker', ['model', 'pull', modelName], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        dockerProcess.stdout.on('data', (data) => {
          output += data.toString();
          console.log(`Docker pull output: ${data.toString()}`);
        });

        dockerProcess.stderr.on('data', (data) => {
          errorOutput += data.toString();
          console.log(`Docker pull error: ${data.toString()}`);
        });

        dockerProcess.on('close', (code) => {
          if (code === 0) {
            console.log(`✅ Successfully pulled model: ${modelName}`);
            resolve(true);
          } else {
            console.error(`❌ Failed to pull model ${modelName}. Exit code: ${code}`);
            console.error('Error output:', errorOutput);
            reject(new Error(`Failed to pull model: ${errorOutput}`));
          }
        });

        dockerProcess.on('error', (error) => {
          console.error(`❌ Error running docker pull: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`Failed to auto-pull model ${modelName}:`, error.message);
      throw error;
    }
  }

  // Ensure a model is available, pull if necessary
  async ensureModelAvailable(modelName) {
    const availableModels = await this.getAvailableModels();
    
    if (availableModels.includes(modelName)) {
      console.log(`✅ Model ${modelName} is already available`);
      return true;
    }
    
    console.log(`⚠️ Model ${modelName} not found, attempting to pull...`);
    try {
      await this.autoPullModel(modelName);
      return true;
    } catch (error) {
      console.error(`❌ Failed to ensure model ${modelName} is available:`, error.message);
      return false;
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
    const isCompact = question.includes('compact') || question.includes('resumo') || question.includes('breve');
    
    // Token optimization for Cursor
    if (isCompact) return 150; // Very short for token economy
    if (isLongForm) return 1024; // Reduced from 2048
    if (questionLength > 500) return 512; // Reduced from 1024
    return 256; // Reduced from 512 for token economy
  }

  async callModelRunner(payload) {
    try {
      console.log(payload);
      // Docker Model Runner uses /engines/llama.cpp/v1/completions
      const response = await axios.post(
        `${CONFIG.MODEL_RUNNER_URL}/engines/llama.cpp/v1/chat/completions`,
        {
          model: payload.model,
          messages: payload.messages,
          temperature: payload.temperature || CONFIG.TEMPERATURE,
          max_tokens: payload.max_tokens || CONFIG.MAX_TOKENS,
          stream: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 160000, // 160 second timeout for Docker, it can take a while to respond
        }
      );

      return response.data;
    } catch (error) {
      console.error(error);
      if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to Docker Model Runner at ${CONFIG.MODEL_RUNNER_URL}. Make sure Docker Model Runner is enabled in Docker Desktop.`);
      }
      throw error;
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('MCP Local LLM server running on stdio');
  }
}

// Start the server
const server = new LocalLLMServer();
server.run().catch(console.error);