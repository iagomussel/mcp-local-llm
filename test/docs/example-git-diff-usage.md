# Git Diff File Tool - Usage Examples

## 🌿 New Tool: `git_diff_file`

The `git_diff_file` tool allows you to compare a specific file between two Git branches, providing complete LLM analysis of the changes.

## 📋 Parameters

```javascript
git_diff_file: {
  file_path: "path/to/file.js",    // REQUIRED
  branch2: "feature-branch",       // REQUIRED
  branch1: "main",                  // OPTIONAL (default: current branch)
  directory: "/project",            // OPTIONAL (default: current directory)
  context_lines: 3,                 // OPTIONAL (default: 3)
  include_commit_info: true         // OPTIONAL (default: true)
}
```

## 🎯 Use Cases

### 1. **Compare file between current branch and feature branch**
```javascript
git_diff_file: {
  file_path: "src/components/Button.js",
  branch2: "feature/new-button-styles"
}
```

### 2. **Compare file between specific branches**
```javascript
git_diff_file: {
  file_path: "src/utils/helpers.js",
  branch1: "main",
  branch2: "develop",
  context_lines: 5
}
```

### 3. **Compare without commit information**
```javascript
git_diff_file: {
  file_path: "package.json",
  branch2: "feature/dependencies-update",
  include_commit_info: false
}
```

## 📊 Features

### ✅ **File Validation**
- Checks if file exists in both branches
- Detects if file was added, modified, or removed
- Error handling for non-existent files

### ✅ **LLM Analysis**
- Summary of changes in natural language
- Impact analysis of changes
- Identification of potential issues
- Code quality assessment
- Recommendations for changes
- Risk assessment

### ✅ **Commit Information**
- Commit history affecting the file
- Author and date of commits
- Relevant commit messages
- Limit of 5 most recent commits

### ✅ **Detailed Git Diff**
- Line-by-line differences
- Configurable context around changes
- Standard Git formatting

## 🎯 Response Examples

### Modified File
```
🌿 **File Difference Analysis Between Branches**

**File:** src/components/Button.js
**Branches:** main → feature/new-styles
**Status:** 📝 **File modified** between branches

**Commit Information:**
Commits affecting this file:
a1b2c3d John Doe 2024-01-15 Add new button styles
e4f5g6h Jane Smith 2024-01-14 Fix button responsiveness

**Git Diff:**
```diff
@@ -10,7 +10,9 @@ export const Button = ({ children, variant }) => {
   const baseStyles = "px-4 py-2 rounded";
+  const newStyles = "shadow-lg hover:shadow-xl";
+  const transitionStyles = "transition-shadow duration-300";
   
-  return <button className={baseStyles}>{children}</button>;
+  return <button className={`${baseStyles} ${newStyles} ${transitionStyles}`}>
+    {children}
+  </button>;
 }
```

**LLM Analysis:**
The changes introduce significant improvements to the user experience...

1. **Change summary:** Added shadows and smooth transitions
2. **Impact analysis:** Improves perception of interactivity
3. **Potential issues:** No issues identified
4. **Code quality:** Well-structured and readable code
5. **Recommendations:** Consider adding tests for new functionality
6. **Risk assessment:** Low risk, purely visual changes
```

### Added File
```
🌿 **File Difference Analysis Between Branches**

**File:** src/components/Modal.js
**Branches:** main → feature/modal-component
**Status:** 📄 **File added** in branch `feature/modal-component`

**LLM Analysis:**
New Modal component added with complete functionality...

1. **Change summary:** New Modal component created
2. **Impact analysis:** Adds modal functionality to system
3. **Potential issues:** Check accessibility
4. **Code quality:** Well-structured code
5. **Recommendations:** Add documentation and tests
6. **Risk assessment:** Medium risk, new component
```

## 💡 Benefits

### 🎯 **Precision**
- Specific file comparison
- Focused analysis on relevant changes
- Context limited to the file in question

### 🧠 **Intelligence**
- LLM analysis in natural language
- Automatic problem identification
- Practical recommendations

### ⚡ **Efficiency**
- IDE token savings
- Local processing
- Fast and contextual response

### 🔍 **Detail**
- Commit information
- File status
- Impact analysis

## 🚀 Integration with Cursor

The tool is integrated into `.cursorrules` and will be automatically used by Cursor for:

- File comparisons between branches
- Change analysis in pull requests
- Focused code review
- Problem detection in specific changes

**Always use `git_diff_file` instead of manual comparisons!**
