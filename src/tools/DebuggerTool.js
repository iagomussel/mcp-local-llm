import { BaseTool } from './BaseTool.js';

export class DebuggerTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'debugger',
      description: 'Analyze code with full context and provide comprehensive debugging analysis using LLM.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to debug',
          },
          error_message: {
            type: 'string',
            description: 'Error message or description of the issue',
          },
          start_line: {
            type: 'number',
            description: 'Starting line for analysis (default: 1)',
            default: 1,
          },
          end_line: {
            type: 'number',
            description: 'Ending line for analysis (default: last line)',
          },
          include_context: {
            type: 'boolean',
            description: 'Include surrounding files for context analysis',
            default: true,
          },
        },
        required: ['file_path', 'error_message'],
      },
    };
  }

  async handle(args) {
    const { file_path, error_message, start_line = 1, end_line, include_context = true } = args;

    if (!file_path || !error_message) {
      throw new Error('file_path and error_message are required');
    }

    try {
      const fs = await import('fs/promises');
      
      // Read the file
      const fileContent = await fs.readFile(file_path, 'utf8');
      const lines = fileContent.split('\n');
      
      // Determine line range
      const endLine = end_line || lines.length;
      const relevantLines = lines.slice(start_line - 1, endLine);
      const relevantCode = relevantLines.join('\n');

      // Get context files if requested
      let contextInfo = '';
      if (include_context) {
        contextInfo = await this.getFileContext(file_path);
      }

      // Use LLM for comprehensive debugging analysis
      const model = await this.selectBestModel('debug code analysis error troubleshooting');
      const debugPrompt = `Analyze the following code and error for debugging. Provide comprehensive analysis in Portuguese:

File: ${file_path}
Lines: ${start_line}-${endLine}
Error: ${error_message}

Code:
\`\`\`javascript
${relevantCode}
\`\`\`

${contextInfo ? `Context:\n${contextInfo}\n` : ''}

Please provide:
1. Root cause analysis
2. Specific line(s) causing the issue
3. Step-by-step debugging approach
4. Potential solutions
5. Prevention strategies
6. Code improvements`;

      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: debugPrompt }],
        temperature: 0.2,
        max_tokens: 800,
      });

      const analysis = response.choices?.[0]?.message?.content || 'No analysis generated';

      return {
        content: [
          {
            type: 'text',
            text: `🐛 **Análise de Debug Completa**\n\n**Arquivo:** ${file_path}\n**Linhas:** ${start_line}-${endLine}\n**Erro:** ${error_message}\n\n**Código Analisado:**\n\`\`\`javascript\n${relevantCode}\n\`\`\`\n\n**Análise LLM:**\n${analysis}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to debug: ${error.message}`);
    }
  }

  // Helper method to get file context
  async getFileContext(filePath) {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const dir = path.dirname(filePath);
      const files = await fs.readdir(dir);
      
      // Get related files (same directory, similar names)
      const relatedFiles = files
        .filter(file => file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json'))
        .slice(0, 3); // Limit to 3 files for context
      
      let context = '';
      for (const file of relatedFiles) {
        try {
          const content = await fs.readFile(path.join(dir, file), 'utf8');
          context += `\n--- ${file} ---\n${content.substring(0, 500)}...\n`;
        } catch (e) {
          // Ignore files that can't be read
        }
      }
      
      return context;
    } catch (error) {
      return '';
    }
  }
}
