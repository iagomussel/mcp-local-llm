import { BaseTool } from './BaseTool.js';

export class CodebaseDiscoveryTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'codebase_discovery',
      description: 'Performs semantic search in the codebase to find files and specific lines where related logic is implemented. Uses local processing to reduce token usage.',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Semantic query about the code (e.g., "where is payment processed?")',
          },
          root_path: {
            type: 'string',
            description: 'Root directory path to search in (default: current directory)',
          },
        },
        required: ['query'],
      },
    };
  }

  async handle(args) {
    const { query, root_path = process.cwd() } = args;

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required and must be a string');
    }

    try {
      const fs = await import('fs/promises');
      const path = await import('path');

      // Get all code files in the directory
      const codeFiles = await this.getAllCodeFiles(root_path);
      
      if (codeFiles.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: `No code files found in ${root_path}`,
            },
          ],
        };
      }

      // Read a sample of files to provide context for semantic search
      // Limit to first 20 files to avoid overwhelming the model
      const sampleFiles = codeFiles.slice(0, 20);
      const fileContents = [];

      for (const filePath of sampleFiles) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          // Only include first 100 lines to keep context manageable
          const lines = content.split('\n').slice(0, 100).join('\n');
          fileContents.push({
            path: filePath,
            content: lines,
            lineCount: content.split('\n').length,
          });
        } catch (error) {
          // Skip files that can't be read - log to stderr only
          console.error(`[MCP] Could not read file ${filePath}: ${error.message}`);
        }
      }

      // System prompt for semantic code search
      const systemPrompt = `You are a technical code searcher. Given a semantic query, identify the files and specific lines where the related logic is implemented.

Return ONLY a JSON with:
- files: array of objects {file: "path", lines: [1, 5, 10], context: "brief description"}
- total_occurrences: total number of occurrences found
- summary: summary in 2-3 lines of what was found

Be technical and precise. Do not include full code, only references.`;

      const userPrompt = `Semantic query: "${query}"

Codebase files to analyze (${fileContents.length} files):

${fileContents.map(f => `\n=== ${f.path} (${f.lineCount} lines) ===\n${f.content}`).join('\n\n')}

Identify the files and specific lines where the logic related to the query is implemented. Return only the structured JSON.`;

      // Select model optimized for code understanding
      const model = await this.selectBestModel('code semantic search discovery');
      const temperature = 0.3; // Low temperature for precise results
      const max_tokens = 600; // Enough for structured results

      const response = await this.callModelRunner({
        model,
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        temperature,
        max_tokens,
      });

      const result = response.choices?.[0]?.message?.content || 'No results generated';

      // Try to parse JSON if the response contains it
      let parsedResult = result;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = result.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
        if (jsonMatch) {
          parsedResult = JSON.parse(jsonMatch[1]);
        } else {
          // Try to parse the entire response as JSON
          parsedResult = JSON.parse(result);
        }
      } catch (e) {
        // If parsing fails, return the raw result
        parsedResult = result;
      }

      return {
        content: [
          {
            type: 'text',
            text: typeof parsedResult === 'string' 
              ? parsedResult 
              : JSON.stringify(parsedResult, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to process search: ${error.message}`);
    }
  }

  // Get all code files in directory recursively
  async getAllCodeFiles(rootPath) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const files = [];
    const fileTypes = ['.js', '.ts', '.jsx', '.tsx', '.py', '.php', '.java', '.go', '.cpp', '.c', '.cs', '.rb', '.rs', '.swift', '.kt'];

    async function scanDirectory(dirPath) {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          
          if (entry.isDirectory()) {
            // Skip common directories to ignore
            if (!['node_modules', '.git', 'dist', 'build', '.next', 'coverage', 'vendor', 'target', '.venv', '__pycache__'].includes(entry.name)) {
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
}
