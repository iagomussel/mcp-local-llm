# 🔧 MCP Tools - Modular Architecture

## Overview

The MCP Local LLM server has been refactored into a modular architecture where each tool is implemented in its own file within the `src/tools/` directory. This improves maintainability, testability, and code organization.

## 📁 Directory Structure

```
src/tools/
├── BaseTool.js              # Base class for all tools
├── AskLLMTool.js            # AI model interaction tool
├── CheckLLMStatusTool.js    # Docker Model Runner status check
├── HumanizeContentTool.js   # Content humanization (full)
├── HumanizeCompactTool.js   # Content humanization (compact)
├── HumanizeFileTool.js      # File-specific humanization
├── RunCommandTool.js        # Terminal command execution
├── DiffFilesTool.js         # File comparison with LLM analysis
├── DiffBranchesTool.js      # Git branch comparison
├── DebuggerTool.js          # Code debugging with context
├── GitDiffFileTool.js       # Git file diff between branches
├── SearchCodeUsageTool.js   # Code usage analysis (AST-like)
├── index.js                 # Tools export index
└── README.md               # This documentation
```

## 🏗️ Architecture

### BaseTool Class

All tools extend the `BaseTool` class which provides:

- **Common Interface**: `getToolDefinition()` and `handle()` methods
- **Server Access**: Reference to the main server instance
- **Helper Methods**: Access to model selection, LLM calls, etc.

```javascript
export class BaseTool {
  constructor(server) {
    this.server = server;
  }

  getToolDefinition() {
    // Return tool schema and metadata
  }

  async handle(args) {
    // Process tool execution
  }
}
```

### Tool Implementation Pattern

Each tool follows this pattern:

1. **Extend BaseTool**: Inherit common functionality
2. **Define Schema**: Return tool definition with input schema
3. **Implement Handler**: Process arguments and return results
4. **Use Helpers**: Leverage server methods for LLM calls, model selection, etc.

## 🔄 Tool Registration

Tools are automatically registered in the main server:

```javascript
// In src/index.js
import { ALL_TOOLS } from './tools/index.js';

class LocalLLMServer {
  initializeTools() {
    for (const ToolClass of ALL_TOOLS) {
      const tool = new ToolClass(this);
      this.tools.set(tool.getToolDefinition().name, tool);
    }
  }
}
```

## 📋 Available Tools

### 1. **AskLLMTool**
- **Purpose**: Direct AI model interaction
- **Features**: Auto model selection, optimal parameters
- **Usage**: General questions and prompts

### 2. **CheckLLMStatusTool**
- **Purpose**: Verify Docker Model Runner status
- **Features**: Model availability check
- **Usage**: Health monitoring

### 3. **HumanizeContentTool**
- **Purpose**: Rewrite content in Portuguese (full version)
- **Features**: URL/file support, creative humanization
- **Usage**: Content improvement

### 4. **HumanizeCompactTool**
- **Purpose**: Rewrite content in Portuguese (compact version)
- **Features**: Token-optimized responses
- **Usage**: Quick content improvements

### 5. **HumanizeFileTool**
- **Purpose**: Humanize specific file lines
- **Features**: Line range selection, file reference
- **Usage**: IDE token optimization

### 6. **RunCommandTool**
- **Purpose**: Execute terminal commands
- **Features**: Summary-only mode, directory context
- **Usage**: System operations

### 7. **DiffFilesTool**
- **Purpose**: Compare two files with LLM analysis
- **Features**: Context lines, comprehensive analysis
- **Usage**: Code comparison

### 8. **DiffBranchesTool**
- **Purpose**: Compare git branches with LLM analysis
- **Features**: Git diff, conflict detection
- **Usage**: Branch analysis

### 9. **DebuggerTool**
- **Purpose**: Debug code with full context
- **Features**: Error analysis, solution suggestions
- **Usage**: Troubleshooting

### 10. **GitDiffFileTool**
- **Purpose**: Compare specific file between branches
- **Features**: Commit info, file status detection
- **Usage**: File-specific branch analysis

### 11. **SearchCodeUsageTool**
- **Purpose**: Find code usage patterns (AST-like)
- **Features**: Multi-language support, semantic analysis
- **Usage**: Code exploration and refactoring

## 🚀 Adding New Tools

To add a new tool:

1. **Create Tool File**: `src/tools/NewTool.js`
2. **Extend BaseTool**: Implement required methods
3. **Export in Index**: Add to `src/tools/index.js`
4. **Test Integration**: Verify tool registration

### Example New Tool

```javascript
// src/tools/NewTool.js
import { BaseTool } from './BaseTool.js';

export class NewTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'new_tool',
      description: 'Description of the new tool',
      inputSchema: {
        type: 'object',
        properties: {
          param1: {
            type: 'string',
            description: 'Parameter description',
          },
        },
        required: ['param1'],
      },
    };
  }

  async handle(args) {
    const { param1 } = args;
    
    // Tool logic here
    const result = await this.processParam(param1);
    
    return {
      content: [
        {
          type: 'text',
          text: result,
        },
      ],
    };
  }

  async processParam(param) {
    // Implementation
  }
}
```

## 🔧 Benefits of Modular Architecture

### ✅ **Maintainability**
- Each tool is self-contained
- Easy to locate and modify specific functionality
- Clear separation of concerns

### ✅ **Testability**
- Individual tools can be unit tested
- Mock server dependencies easily
- Isolated test scenarios

### ✅ **Extensibility**
- Add new tools without modifying existing code
- Plugin-like architecture
- Easy to remove or disable tools

### ✅ **Code Organization**
- Logical file structure
- Consistent patterns across tools
- Reduced cognitive load

### ✅ **Performance**
- Lazy loading potential
- Selective tool initialization
- Memory efficiency

## 🧪 Testing

Each tool can be tested independently:

```javascript
// Example test structure
import { NewTool } from './NewTool.js';

describe('NewTool', () => {
  let tool;
  let mockServer;

  beforeEach(() => {
    mockServer = createMockServer();
    tool = new NewTool(mockServer);
  });

  it('should handle valid arguments', async () => {
    const result = await tool.handle({ param1: 'test' });
    expect(result.content[0].text).toBeDefined();
  });
});
```

## 📚 Dependencies

Tools can access server functionality through:

- `this.server.callModelRunner()` - LLM API calls
- `this.server.selectBestModel()` - Model selection
- `this.server.getOptimalTemperature()` - Parameter optimization
- `this.server.getOptimalMaxTokens()` - Token limits
- `this.server.CONFIG` - Configuration access

## 🔄 Migration Notes

The refactoring maintains 100% backward compatibility:

- All existing tool names and schemas unchanged
- Same input/output formats
- Identical functionality
- No breaking changes for clients

## 🎯 Future Enhancements

Potential improvements:

1. **Plugin System**: Dynamic tool loading
2. **Tool Dependencies**: Inter-tool communication
3. **Caching Layer**: Result caching for expensive operations
4. **Metrics**: Tool usage statistics
5. **Configuration**: Per-tool configuration options

---

This modular architecture provides a solid foundation for the MCP Local LLM server, making it easier to maintain, extend, and test individual components while preserving the existing API.
