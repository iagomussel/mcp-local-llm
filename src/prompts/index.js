/**
 * Prompts module - exports all available prompts
 */
import { mcpToolUsageRules } from './mcp-tool-usage-rules.js';
import { tokenEconomyGuidelines } from './token-economy-guidelines.js';
import { thinkingLayerInstructions } from './thinking-layer-instructions.js';
import { contextCompressionRules } from './context-compression-rules.js';
import { chatEndSummaryRule } from './chat-end-summary-rule.js';
import { CONFIG } from '../config/index.js';

/**
 * All available prompts
 */
export const PROMPTS = {
  mcp_tool_usage_rules: mcpToolUsageRules,
  token_economy_guidelines: tokenEconomyGuidelines,
  thinking_layer_instructions: thinkingLayerInstructions,
  context_compression_rules: contextCompressionRules,
  chat_end_summary_rule: chatEndSummaryRule,
};

/**
 * Get prompt list for ListPromptsRequestSchema
 * Filters out disabled prompts based on CONFIG flags
 */
export function getPromptList() {
  const prompts = Object.values(PROMPTS);
  
  // Filter out chat_end_summary_rule if disabled
  const filteredPrompts = prompts.filter(prompt => {
    if (prompt.name === 'chat_end_summary_rule' && CONFIG.DISABLE_CHAT_SUMMARY_RULE) {
      return false;
    }
    return true;
  });
  
  return filteredPrompts.map(prompt => ({
    name: prompt.name,
    description: prompt.description,
    arguments: [],
  }));
}

/**
 * Get prompt by name for GetPromptRequestSchema
 * Returns error if prompt is disabled via CONFIG flags
 */
export function getPrompt(name) {
  // Check if chat_end_summary_rule is disabled
  if (name === 'chat_end_summary_rule' && CONFIG.DISABLE_CHAT_SUMMARY_RULE) {
    throw new Error(`Prompt '${name}' is disabled via DISABLE_CHAT_SUMMARY_RULE environment variable`);
  }
  
  const prompt = PROMPTS[name];
  if (!prompt) {
    throw new Error(`Unknown prompt: ${name}`);
  }
  return prompt;
}
