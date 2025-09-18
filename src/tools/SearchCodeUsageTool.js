import { BaseTool } from './BaseTool.js';

export class SearchCodeUsageTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'search_code_usage',
      description: 'Analyzes code files using AST parsing to find usages of variables, functions, classes, and other code elements. Supports JavaScript, TypeScript, Python, and other languages.',
      inputSchema: {
        type: 'object',
        properties: {
          root_path: {
            type: 'string',
            description: 'Root directory path to search in',
          },
          term: {
            type: 'string',
            description: 'The variable, function, class, or identifier to search for',
          },
          reference_file: {
            type: 'string',
            description: 'Optional reference file to understand context better',
          },
          file_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'File extensions to search in (e.g., [".js", ".ts", ".py"]). Default: all supported types',
            default: ['.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.java', '.go', '.cpp', '.c', '.cs'],
          },
          include_declarations: {
            type: 'boolean',
            description: 'Include declaration sites in results',
            default: true,
          },
          include_usages: {
            type: 'boolean',
            description: 'Include usage sites in results',
            default: true,
          },
          context_lines: {
            type: 'number',
            description: 'Number of context lines around each match',
            default: 3,
          },
          max_results: {
            type: 'number',
            description: 'Maximum number of results to return',
            default: 50,
          },
        },
        required: ['root_path', 'term'],
      },
    };
  }

  async handle(args) {
    const { 
      root_path, 
      term, 
      reference_file, 
      file_types = ['.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.java', '.go', '.cpp', '.c', '.cs'],
      include_declarations = true,
      include_usages = true,
      context_lines = 3,
      max_results = 50
    } = args;

    if (!root_path || !term) {
      throw new Error('root_path and term are required');
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // Get all files to search
      const files = await this.getAllCodeFiles(root_path, file_types);
      
      if (files.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No code files found in ${root_path} with extensions: ${file_types.join(', ')}`,
            },
          ],
        };
      }

      // Search for term usage in all files
      const results = [];
      let totalMatches = 0;

      for (const filePath of files) {
        if (totalMatches >= max_results) break;
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const matches = await this.parseFileForTerm(filePath, content, term, {
            include_declarations,
            include_usages,
            context_lines,
            max_per_file: Math.max(1, Math.floor(max_results / files.length))
          });
          
          if (matches.length > 0) {
            results.push({
              file: filePath,
              matches: matches,
              total_matches: matches.length
            });
            totalMatches += matches.length;
          }
        } catch (error) {
          // Skip files that can't be read
          console.warn(`Could not read file ${filePath}: ${error.message}`);
        }
      }

      // Generate summary using LLM
      const model = await this.selectBestModel('code analysis usage search');
      const summaryPrompt = `Analyze the following code usage search results and provide a comprehensive summary in Portuguese:

Search Term: ${term}
Root Path: ${root_path}
Total Files Searched: ${files.length}
Total Matches Found: ${totalMatches}

Results:
${results.map(r => `\nFile: ${r.file}\nMatches: ${r.total_matches}\n${r.matches.map(m => `  Line ${m.line}: ${m.type} - ${m.context}`).join('\n')}`).join('\n')}

Please provide:
1. Summary of where the term is used
2. Types of usage (declarations, function calls, variable references, etc.)
3. Most common usage patterns
4. Potential issues or recommendations`;

      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: summaryPrompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      const analysis = response.choices?.[0]?.message?.content || 'No analysis generated';

      return {
        content: [
          {
            type: 'text',
            text: `🔍 **Análise de Uso de Código**\n\n**Termo:** \`${term}\`\n**Diretório:** ${root_path}\n**Arquivos analisados:** ${files.length}\n**Total de ocorrências:** ${totalMatches}\n\n**Resultados:**\n${results.map(r => `\n📄 **${r.file}** (${r.total_matches} ocorrências)\n${r.matches.map(m => `  ${m.line}: ${m.type} - ${m.context}`).join('\n')}`).join('\n')}\n\n**Análise LLM:**\n${analysis}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search code usage: ${error.message}`);
    }
  }

  // Get all code files in directory recursively
  async getAllCodeFiles(rootPath, fileTypes) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const files = [];

    async function scanDirectory(dirPath) {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip common directories to ignore
            if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage'].includes(entry.name)) {
              await scanDirectory(fullPath);
            }
          } else if (entry.isFile()) {
            const ext = path.extname(entry.name);
            if (fileTypes.includes(ext)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Skip directories that can't be read
        console.warn(`Could not read directory ${dirPath}: ${error.message}`);
      }
    }

    await scanDirectory(rootPath);
    return files;
  }

  // Parse file content for term usage with language-specific patterns
  async parseFileForTerm(filePath, content, term, options) {
    const { include_declarations, include_usages, context_lines, max_per_file } = options;
    const matches = [];
    const lines = content.split('\n');
    const ext = filePath.split('.').pop().toLowerCase();

    // Language-specific patterns
    const patterns = this.getLanguagePatterns(ext, term);
    
    for (let i = 0; i < lines.length && matches.length < max_per_file; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check each pattern
      for (const pattern of patterns) {
        const regex = new RegExp(pattern.regex, 'g');
        let match;
        
        while ((match = regex.exec(line)) !== null) {
          const isDeclaration = pattern.type === 'declaration';
          const isUsage = pattern.type === 'usage';
          
          if ((isDeclaration && include_declarations) || (isUsage && include_usages)) {
            // Get context around the match
            const startLine = Math.max(0, i - context_lines);
            const endLine = Math.min(lines.length - 1, i + context_lines);
            const context = lines.slice(startLine, endLine + 1).join('\n');
            
            matches.push({
              line: lineNumber,
              type: pattern.type,
              context: context,
              match: match[0],
              position: match.index
            });
          }
        }
      }
    }

    return matches;
  }

  // Get language-specific regex patterns for term matching
  getLanguagePatterns(ext, term) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const patterns = {
      // JavaScript/TypeScript patterns
      'js': [
        { type: 'declaration', regex: `(?:function\\s+|const\\s+|let\\s+|var\\s+|class\\s+|interface\\s+|type\\s+|enum\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` }, // function calls
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` }, // variable usage
        { type: 'usage', regex: `\\.${escapedTerm}\\b` }, // property access
        { type: 'usage', regex: `\\b${escapedTerm}\\s*:` }, // object property
      ],
      'ts': [
        { type: 'declaration', regex: `(?:function\\s+|const\\s+|let\\s+|var\\s+|class\\s+|interface\\s+|type\\s+|enum\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*:` },
      ],
      'jsx': [
        { type: 'declaration', regex: `(?:function\\s+|const\\s+|let\\s+|var\\s+|class\\s+|interface\\s+|type\\s+|enum\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*:` },
        { type: 'usage', regex: `<${escapedTerm}\\b` }, // JSX components
      ],
      'tsx': [
        { type: 'declaration', regex: `(?:function\\s+|const\\s+|let\\s+|var\\s+|class\\s+|interface\\s+|type\\s+|enum\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*:` },
        { type: 'usage', regex: `<${escapedTerm}\\b` },
      ],
      // Python patterns
      'py': [
        { type: 'declaration', regex: `(?:def\\s+|class\\s+|import\\s+.*\\s+as\\s+|from\\s+.*\\s+import\\s+.*\\s+as\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` }, // function calls
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` }, // variable usage
        { type: 'usage', regex: `\\.${escapedTerm}\\b` }, // attribute access
        { type: 'usage', regex: `\\b${escapedTerm}\\s*:` }, // keyword usage
      ],
      // PHP patterns
      'php': [
        { type: 'declaration', regex: `(?:function\\s+|class\\s+|interface\\s+|trait\\s+|const\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
        { type: 'usage', regex: `\\$\\{escapedTerm}\\b` }, // PHP variables
      ],
      // Java patterns
      'java': [
        { type: 'declaration', regex: `(?:public\\s+|private\\s+|protected\\s+)?(?:static\\s+)?(?:final\\s+)?(?:class\\s+|interface\\s+|enum\\s+|method\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
      ],
      // Go patterns
      'go': [
        { type: 'declaration', regex: `(?:func\\s+|type\\s+|var\\s+|const\\s+|package\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
      ],
      // C/C++ patterns
      'c': [
        { type: 'declaration', regex: `(?:int\\s+|char\\s+|float\\s+|double\\s+|void\\s+|struct\\s+|typedef\\s+|enum\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
      ],
      'cpp': [
        { type: 'declaration', regex: `(?:int\\s+|char\\s+|float\\s+|double\\s+|void\\s+|class\\s+|struct\\s+|typedef\\s+|enum\\s+|template\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
        { type: 'usage', regex: `::${escapedTerm}\\b` }, // C++ scope resolution
      ],
      // C# patterns
      'cs': [
        { type: 'declaration', regex: `(?:public\\s+|private\\s+|protected\\s+|internal\\s+)?(?:static\\s+)?(?:class\\s+|interface\\s+|enum\\s+|struct\\s+|delegate\\s+)\\s*${escapedTerm}\\b` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*\\(` },
        { type: 'usage', regex: `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]` },
        { type: 'usage', regex: `\\.${escapedTerm}\\b` },
      ],
    };

    return patterns[ext] || patterns['js']; // Default to JavaScript patterns
  }
}
