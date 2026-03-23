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
import { AnalyzeHugeFileTool } from './AnalyzeHugeFileTool.js';
import { SecurityScannerTool } from './SecurityScannerTool.js';
import { DigestErrorLogsTool } from './DigestErrorLogsTool.js';
import { CodebaseDiscoveryTool } from './CodebaseDiscoveryTool.js';
import { ThinkThroughTool } from './ThinkThroughTool.js';
import { PlaywrightNavigateTool } from './PlaywrightNavigateTool.js';
import { PlaywrightScreenshotTool } from './PlaywrightScreenshotTool.js';
import { PlaywrightExtractContentTool } from './PlaywrightExtractContentTool.js';
import { PlaywrightInteractTool } from './PlaywrightInteractTool.js';
import { DocumentorAPITool } from './DocumentorAPITool.js';
import { DocumentorCodeTool } from './DocumentorCodeTool.js';
import { DocumentorReadmeTool } from './DocumentorReadmeTool.js';
import { MemoryStoreTool } from './MemoryStoreTool.js';
import { MemoryRetrieveTool } from './MemoryRetrieveTool.js';
import { MemoryUpdateTool } from './MemoryUpdateTool.js';
import { MemoryDeleteTool } from './MemoryDeleteTool.js';
import { MemorySearchTool } from './MemorySearchTool.js';
import { DesktopLaunchTool } from './DesktopLaunchTool.js';
import { DesktopSystemInfoTool } from './DesktopSystemInfoTool.js';
import { DesktopScreenshotTool } from './DesktopScreenshotTool.js';
import { DesktopFileOperationsTool } from './DesktopFileOperationsTool.js';
import { DesktopNotificationTool } from './DesktopNotificationTool.js';
import { DesktopClipboardTool } from './DesktopClipboardTool.js';
import { CacheStatsTool } from './CacheStatsTool.js';
import { CacheClearTool } from './CacheClearTool.js';

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
export { AnalyzeHugeFileTool };
export { SecurityScannerTool };
export { DigestErrorLogsTool };
export { CodebaseDiscoveryTool };
export { ThinkThroughTool };
export { PlaywrightNavigateTool };
export { PlaywrightScreenshotTool };
export { PlaywrightExtractContentTool };
export { PlaywrightInteractTool };
export { DocumentorAPITool };
export { DocumentorCodeTool };
export { DocumentorReadmeTool };
export { MemoryStoreTool };
export { MemoryRetrieveTool };
export { MemoryUpdateTool };
export { MemoryDeleteTool };
export { MemorySearchTool };
export { DesktopLaunchTool };
export { DesktopSystemInfoTool };
export { DesktopScreenshotTool };
export { DesktopFileOperationsTool };
export { DesktopNotificationTool };
export { DesktopClipboardTool };
export { CacheStatsTool };
export { CacheClearTool };

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
  AnalyzeHugeFileTool,
  SecurityScannerTool,
  DigestErrorLogsTool,
  CodebaseDiscoveryTool,
  ThinkThroughTool,
  PlaywrightNavigateTool,
  PlaywrightScreenshotTool,
  PlaywrightExtractContentTool,
  PlaywrightInteractTool,
  DocumentorAPITool,
  DocumentorCodeTool,
  DocumentorReadmeTool,
  MemoryStoreTool,
  MemoryRetrieveTool,
  MemoryUpdateTool,
  MemoryDeleteTool,
  MemorySearchTool,
  DesktopLaunchTool,
  DesktopSystemInfoTool,
  DesktopScreenshotTool,
  DesktopFileOperationsTool,
  DesktopNotificationTool,
  DesktopClipboardTool,
  CacheStatsTool,
  CacheClearTool,
];
