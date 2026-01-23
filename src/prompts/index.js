/**
 * Prompts module - exports all available prompts
 */
import { mcpToolUsageRules } from './mcp-tool-usage-rules.js';
import { tokenEconomyGuidelines } from './token-economy-guidelines.js';
import { thinkingLayerInstructions } from './thinking-layer-instructions.js';
import { contextCompressionRules } from './context-compression-rules.js';

/**
 * All available prompts
 */
export const PROMPTS = {
  mcp_tool_usage_rules: mcpToolUsageRules,
  token_economy_guidelines: tokenEconomyGuidelines,
  thinking_layer_instructions: thinkingLayerInstructions,
  context_compression_rules: contextCompressionRules,
};

/**
 * Get prompt list for ListPromptsRequestSchema
 */
export function getPromptList() {
  return Object.values(PROMPTS).map(prompt => ({
    name: prompt.name,
    description: prompt.description,
    arguments: [],
  }));
}

/**
 * Get prompt by name for GetPromptRequestSchema
 */
export function getPrompt(name) {
  const prompt = PROMPTS[name];
  if (!prompt) {
    throw new Error(`Unknown prompt: ${name}`);
  }
  return prompt;
}
