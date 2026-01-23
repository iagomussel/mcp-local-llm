# 🔍 Search Code Usage Tool - Complete Guide

## Overview

The `search_code_usage` tool is an advanced feature of MCP Local LLM that allows you to analyze code using AST-like parsing to find usages of variables, functions, classes, and other code elements. Supports multiple programming languages.

## 🚀 Key Features

### ✅ Multi-Language Support
- **JavaScript/TypeScript**: `.js`, `.ts`, `.jsx`, `.tsx`
- **Python**: `.py`
- **PHP**: `.php`
- **Java**: `.java`
- **Go**: `.go`
- **C/C++**: `.c`, `.cpp`
- **C#**: `.cs`

### ✅ Analysis Types
- **Declarations**: Where variables, functions, classes are defined
- **Usages**: Where elements are referenced or called
- **Context**: Lines around each occurrence
- **Semantic Analysis**: Understanding the type of usage

### ✅ Advanced Features
- Recursive directory search
- File type filters
- Result limiting
- LLM analysis of results
- Automatic exclusion of irrelevant directories

## 📋 Tool Parameters

```javascript
{
  root_path: string,           // Root directory for search (required)
  term: string,               // Term to search for (required)
  reference_file?: string,    // Optional reference file
  file_types?: string[],      // File extensions (default: all supported)
  include_declarations?: boolean, // Include declarations (default: true)
  include_usages?: boolean,   // Include usages (default: true)
  context_lines?: number,     // Context lines (default: 3)
  max_results?: number        // Maximum results (default: 50)
}
```

## 🎯 Usage Examples

### 1. Basic Search
```javascript
// Search for all occurrences of "userService"
{
  root_path: "/path/to/project",
  term: "userService"
}
```

### 2. Language-Specific Search
```javascript
// Search only in JavaScript files
{
  root_path: "/path/to/project",
  term: "UserService",
  file_types: [".js", ".ts"]
}
```

### 3. Declaration-Only Search
```javascript
// Find only where "getUserById" is declared
{
  root_path: "/path/to/project",
  term: "getUserById",
  include_declarations: true,
  include_usages: false
}
```

### 4. Extended Context Search
```javascript
// Search with more context lines
{
  root_path: "/path/to/project",
  term: "createUser",
  context_lines: 5,
  max_results: 20
}
```

## 🔧 Search Patterns by Language

### JavaScript/TypeScript
- **Declarations**: `function`, `const`, `let`, `var`, `class`, `interface`, `type`, `enum`
- **Usages**: Function calls, property access, variable references
- **Special**: JSX components (`<ComponentName`)

### Python
- **Declarations**: `def`, `class`, `import ... as`, `from ... import ... as`
- **Usages**: Function calls, attribute access, variable references

### PHP
- **Declarations**: `function`, `class`, `interface`, `trait`, `const`
- **Usages**: Function calls, PHP variables (`$variable`)

### Java
- **Declarations**: `class`, `interface`, `enum` with modifiers
- **Usages**: Method calls, property access

### Go
- **Declarations**: `func`, `type`, `var`, `const`, `package`
- **Usages**: Function calls, method access

### C/C++
- **Declarations**: Primitive types, `struct`, `typedef`, `enum`, `class` (C++)
- **Usages**: Function calls, member access, scope resolution (`::`)

### C#
- **Declarations**: `class`, `interface`, `enum`, `struct`, `delegate` with modifiers
- **Usages**: Method calls, property access

## 📊 Response Format

The tool returns a structured analysis with:

1. **Statistical Summary**
   - Searched term
   - Analyzed directory
   - Number of files processed
   - Total occurrences found

2. **Detailed Results**
   - File and number of occurrences
   - Specific line of each match
   - Type of usage (declaration/usage)
   - Context around the occurrence

3. **LLM Analysis**
   - Summary of where the term is used
   - Identified usage types
   - Most common patterns
   - Recommendations and potential issues

## 🎯 Practical Use Cases

### 1. Code Refactoring
```javascript
// Find all references before renaming
{
  root_path: "/src",
  term: "oldFunctionName",
  include_declarations: true,
  include_usages: true
}
```

### 2. Dependency Analysis
```javascript
// Check where a class is used
{
  root_path: "/project",
  term: "DatabaseConnection",
  include_declarations: false,
  include_usages: true
}
```

### 3. Security Audit
```javascript
// Search for potentially dangerous functions
{
  root_path: "/src",
  term: "eval",
  file_types: [".js", ".ts"],
  include_usages: true
}
```

### 4. API Documentation
```javascript
// Find all implementations of an interface
{
  root_path: "/src",
  term: "UserRepository",
  include_declarations: true,
  include_usages: false
}
```

## ⚡ Optimizations and Limitations

### Optimizations
- Efficient recursive search
- Automatic exclusion of `node_modules`, `.git`, `dist`, etc.
- Result limiting per file
- Optimized regex-based parsing

### Limitations
- Regex-based parsing (not full AST)
- May have false positives in strings/comments
- Doesn't resolve imports/requires automatically
- Limited to known language patterns

## 🔄 Integration with Other Tools

The `search_code_usage` tool works well together with:

- `diff_files`: Compare changes in files
- `diff_branches`: Analyze differences between branches
- `debugger`: Debugging with usage context
- `git_diff_file`: Analysis of specific changes

## 📝 Complete Example

```javascript
// Complete search for "userService" in a project
const result = await mcpClient.callTool('search_code_usage', {
  root_path: "/home/user/my-project",
  term: "userService",
  file_types: [".js", ".ts", ".jsx", ".tsx"],
  include_declarations: true,
  include_usages: true,
  context_lines: 3,
  max_results: 30
});

console.log(result.content[0].text);
```

## 🚀 Next Steps

1. **Test the tool** with your own projects
2. **Experiment with different parameters** to optimize results
3. **Combine with other tools** for deeper analysis
4. **Use LLM analysis** for insights about code patterns

---

**Note**: This tool is especially useful for developers working with large codebases who need to quickly understand how code elements are used throughout the project.
