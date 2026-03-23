import { BaseTool } from './BaseTool.js';
import { extname } from 'path';

// Common directories to ignore
const IGNORED_DIRS = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '.vscode', '.idea']);

// Default file types
const DEFAULT_FILE_TYPES = ['.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.java', '.go', '.cpp', '.c', '.cs'];

export class SearchCodeUsageTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'search_code_usage',
      description: 'Analyzes code files using AST parsing to find usages of variables, functions, classes, and other code elements. Supports JavaScript, TypeScript, Python, and other languages.',
      cacheable: true,
      cacheTTL: 180_000, // 3 minutes
      inputSchema: {
        type: 'object',
        properties: {
          root_path: {
            type: 'string',
            description: 'Root directory path to search in',
          },
          term: {
            oneOf: [
              { type: 'string' },
              { type: 'array', items: { type: 'string' } }
            ],
            description: 'The variable, function, class, or identifier(s) to search for. Can be a single term, comma-separated string (e.g., "term1,term2"), or array of terms (e.g., ["term1", "term2"])',
          },
          reference_file: {
            type: 'string',
            description: 'Optional reference file to understand context better',
          },
          file_types: {
            type: 'array',
            items: { type: 'string' },
            description: 'File extensions to search in (e.g., [".js", ".ts", ".py"]). Default: all supported types',
            default: DEFAULT_FILE_TYPES,
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
      file_types = DEFAULT_FILE_TYPES,
      include_declarations = true,
      include_usages = true,
      context_lines = 3,
      max_results = 50
    } = args;

    if (!root_path || typeof root_path !== 'string') {
      throw new Error('root_path is required and must be a string');
    }
    
    // Parse terms: support string (comma-separated), array, or single term
    let terms = [];
    if (Array.isArray(term)) {
      terms = term.filter(t => t && typeof t === 'string' && t.trim().length > 0).map(t => t.trim());
    } else if (typeof term === 'string') {
      terms = term.split(',').map(t => t.trim()).filter(t => t.length > 0);
    }
    
    if (terms.length === 0) {
      throw new Error('term is required and must be a non-empty string, comma-separated string, or array of strings');
    }
    if (!Array.isArray(file_types) || file_types.length === 0) {
      throw new Error('file_types must be a non-empty array');
    }
    if (typeof max_results !== 'number' || max_results < 1) {
      throw new Error('max_results must be a positive number');
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

      // Search for all terms in all files
      const fileContents = new Map();
      const termResults = new Map(); // Map<term, occurrences[]>
      let totalMatches = 0;
      const maxPerTerm = Math.max(1, Math.floor(max_results / terms.length));

      // Initialize results map for each term
      terms.forEach(t => termResults.set(t, []));

      for (const filePath of files) {
        if (totalMatches >= max_results) break;
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          fileContents.set(filePath, content);
          
          // Search for each term in this file
          for (const searchTerm of terms) {
            if (totalMatches >= max_results) break;
            
            const matches = await this.parseFileForTerm(filePath, content, searchTerm, {
              include_declarations,
              include_usages,
              max_per_file: Math.max(1, Math.floor(maxPerTerm / files.length))
            });
            
            if (matches.length > 0) {
              const termOccurrences = termResults.get(searchTerm) || [];
              // Add file path to each match
              const matchesWithFile = matches.map(m => ({ ...m, file: filePath }));
              termOccurrences.push(...matchesWithFile);
              termResults.set(searchTerm, termOccurrences);
              totalMatches += matches.length;
            }
          }
        } catch (error) {
          // Skip files that can't be read - log to stderr only
          console.error(`[MCP] Could not read file ${filePath}: ${error.message}`);
        }
      }

      // Format results as structured data for LLM consumption
      const allOccurrences = [];
      
      for (const [searchTerm, matches] of termResults.entries()) {
        if (matches.length === 0) continue;
        
        const termOccurrences = matches.map(m => {
          if (!m.file) {
            console.error(`[MCP] Match missing file:`, m);
            return null;
          }
          const fileContent = fileContents.get(m.file);
          if (!fileContent) {
            console.error(`[MCP] File content not found for: ${m.file}`);
            return {
              file: m.file,
              line: m.line,
              type: m.type,
              term: searchTerm,
              code: ''
            };
          }
          const fileLines = fileContent.split('\n');
          return {
            file: m.file,
            line: m.line,
            type: m.type,
            term: searchTerm,
            code: fileLines[m.line - 1] ? fileLines[m.line - 1].trim() : ''
          };
        }).filter(m => m !== null);
        
        allOccurrences.push(...termOccurrences);
      }

      // Sort by file and line for better organization
      allOccurrences.sort((a, b) => {
        if (a.file !== b.file) return a.file.localeCompare(b.file);
        return a.line - b.line;
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              terms: terms.length === 1 ? terms[0] : terms,
              total_occurrences: totalMatches,
              occurrences: allOccurrences.slice(0, max_results)
            }, null, 2),
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
            if (!IGNORED_DIRS.has(entry.name)) {
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
        // Skip directories that can't be read - log to stderr only
        console.error(`[MCP] Could not read directory ${dirPath}: ${error.message}`);
      }
    }

    await scanDirectory(rootPath);
    return files;
  }

  // Parse file content for term usage with language-specific patterns
  async parseFileForTerm(filePath, content, term, options) {
    const { include_declarations, include_usages, max_per_file } = options;
    const matches = [];
    const lines = content.split('\n');
    const ext = extname(filePath).slice(1).toLowerCase(); // Remove leading dot

    // Get and pre-compile language-specific patterns
    const patterns = this.getLanguagePatterns(ext, term).map(p => ({
      ...p,
      regex: new RegExp(p.regex, 'g')
    }));
    
    for (let i = 0; i < lines.length && matches.length < max_per_file; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check each pattern
      for (const pattern of patterns) {
        const regex = pattern.regex;
        let match;
        
        // Reset lastIndex for global regex
        regex.lastIndex = 0;
        
        while ((match = regex.exec(line)) !== null) {
          const isDeclaration = pattern.type === 'declaration';
          const isUsage = pattern.type === 'usage';
          
          if ((isDeclaration && include_declarations) || (isUsage && include_usages)) {
            matches.push({
              line: lineNumber,
              type: pattern.type,
              match: match[0],
              position: match.index
            });
            
            // Break if we've reached max matches
            if (matches.length >= max_per_file) break;
          }
        }
        
        if (matches.length >= max_per_file) break;
      }
    }

    return matches;
  }

  // Get language-specific regex patterns for term matching
  getLanguagePatterns(ext, term) {
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Shared JS/TS patterns
    const jsTsDeclarationPattern = `(?:function\\s+|const\\s+|let\\s+|var\\s+|class\\s+|interface\\s+|type\\s+|enum\\s+)\\s*${escapedTerm}\\b`;
    const jsTsUsagePatterns = [
      `\\b${escapedTerm}\\s*\\(`, // function calls
      `\\b${escapedTerm}\\s*[=;,\\)\\]\\}]`, // variable usage
      `\\.${escapedTerm}\\b`, // property access
      `\\b${escapedTerm}\\s*:` // object property
    ];
    
    const patterns = {
      // JavaScript/TypeScript patterns
      'js': [
        { type: 'declaration', regex: jsTsDeclarationPattern },
        ...jsTsUsagePatterns.map(regex => ({ type: 'usage', regex }))
      ],
      'ts': [
        { type: 'declaration', regex: jsTsDeclarationPattern },
        ...jsTsUsagePatterns.map(regex => ({ type: 'usage', regex }))
      ],
      'jsx': [
        { type: 'declaration', regex: jsTsDeclarationPattern },
        ...jsTsUsagePatterns.map(regex => ({ type: 'usage', regex })),
        { type: 'usage', regex: `<${escapedTerm}\\b` } // JSX components
      ],
      'tsx': [
        { type: 'declaration', regex: jsTsDeclarationPattern },
        ...jsTsUsagePatterns.map(regex => ({ type: 'usage', regex })),
        { type: 'usage', regex: `<${escapedTerm}\\b` } // JSX components
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
