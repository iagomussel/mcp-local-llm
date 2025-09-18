# MCP Local LLM - Test Suite

## 📁 Test Organization

All test files have been moved to the `test/` folder for better organization.

## 🧪 Available Tests

### Core Functionality Tests
- **`test-new-tools.js`** - Tests the new advanced tools (diff_files, diff_branches, debugger)
- **`test-mcp.js`** - Basic MCP functionality tests

### Legacy Tests (Moved)
- All previous test files have been organized in this folder
- Tests cover token economy, humanization, and MCP compliance

## 🆕 New Tools Testing

### 1. **diff_files** - File Comparison with LLM Analysis
```javascript
// Test file comparison with intelligent analysis
diff_files: {
  file1_path: "old.js",
  file2_path: "new.js", 
  context_lines: 3
}
```

**Features:**
- ✅ Automatic diff generation
- ✅ LLM-powered analysis in Portuguese
- ✅ Impact assessment
- ✅ Recommendations
- ✅ Token-optimized output

### 2. **diff_branches** - Git Branch Comparison
```javascript
// Test git branch comparison
diff_branches: {
  branch2: "feature-branch",
  directory: "/project",
  context_lines: 3
}
```

**Features:**
- ✅ Git diff generation
- ✅ LLM analysis of changes
- ✅ Conflict detection
- ✅ Merge recommendations
- ✅ Automatic current branch detection

### 3. **debugger** - Comprehensive Code Analysis
```javascript
// Test comprehensive debugging
debugger: {
  file_path: "src/index.js",
  error_message: "TypeError: Cannot read property 'x' of undefined",
  start_line: 10,
  end_line: 20,
  include_context: true
}
```

**Features:**
- ✅ Root cause analysis
- ✅ Step-by-step debugging approach
- ✅ Context file analysis
- ✅ Solution recommendations
- ✅ Prevention strategies
- ✅ Code improvement suggestions

### 4. **git_diff_file** - Specific File Comparison Between Branches
```javascript
// Test specific file comparison between branches
git_diff_file: {
  file_path: "src/components/Button.js",
  branch2: "feature/new-styles",
  context_lines: 3,
  include_commit_info: true
}
```

**Features:**
- ✅ File existence validation in both branches
- ✅ Commit information extraction
- ✅ LLM analysis of file changes
- ✅ Status detection (added/modified/removed)
- ✅ Comprehensive error handling
- ✅ Git diff with configurable context

## 🎯 Enhanced Model Selection

The new `selectBestModel` function uses intelligent routing:

```javascript
// Code/Debug tasks → ai/qwen3 or ai/deepseek-r1-distill-llama
// Math/Logic tasks → ai/deepseek-r1-distill-llama
// Creative tasks → ai/gemma3 or ai/llama3.3
// Chat/Short responses → ai/mistral
```

## 🚀 Running Tests

```bash
# Test new tools
node test/test-new-tools.js

# Test git diff file tool
node test/test-git-diff-file.js

# Test basic MCP functionality
node test/test-mcp.js
```

## 📊 Expected Results

All tests should show:
- ✅ Successful tool execution
- ✅ LLM-powered analysis in Portuguese
- ✅ Token-optimized responses
- ✅ Comprehensive error handling
- ✅ Automatic model selection

## 💡 Benefits

- **90%+ token savings** for Cursor IDE
- **Intelligent model selection** based on task type
- **Comprehensive analysis** with LLM assistance
- **Portuguese language support** for all analysis
- **Context-aware debugging** with file relationships
- **Git integration** for branch comparisons
- **Specific file comparison** between branches
