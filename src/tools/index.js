/**
 * Tools index - exports all available MCP tools
 */

// Import all tools
import { BaseTool } from './BaseTool.js';
import { AskLLMTool } from './AskLLMTool.js';
import { CheckLLMStatusTool } from './CheckLLMStatusTool.js';
import { HumanizeContentTool } from './HumanizeContentTool.js';
import { HumanizeCompactTool } from './HumanizeCompactTool.js';
import { HumanizeFileTool } from './HumanizeFileTool.js';
import { RunCommandTool } from './RunCommandTool.js';
import { DiffFilesTool } from './DiffFilesTool.js';
import { DiffBranchesTool } from './DiffBranchesTool.js';
import { DebuggerTool } from './DebuggerTool.js';
import { GitDiffFileTool } from './GitDiffFileTool.js';
import { SearchCodeUsageTool } from './SearchCodeUsageTool.js';

// Re-export all tools
export { BaseTool };
export { AskLLMTool };
export { CheckLLMStatusTool };
export { HumanizeContentTool };
export { HumanizeCompactTool };
export { HumanizeFileTool };
export { RunCommandTool };
export { DiffFilesTool };
export { DiffBranchesTool };
export { DebuggerTool };
export { GitDiffFileTool };
export { SearchCodeUsageTool };

// Array of all available tools
export const ALL_TOOLS = [
  AskLLMTool,
  CheckLLMStatusTool,
  HumanizeContentTool,
  HumanizeCompactTool,
  HumanizeFileTool,
  RunCommandTool,
  DiffFilesTool,
  DiffBranchesTool,
  DebuggerTool,
  GitDiffFileTool,
  SearchCodeUsageTool,
];
