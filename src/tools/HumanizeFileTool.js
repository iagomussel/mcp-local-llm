import { BaseTool } from './BaseTool.js';

export class HumanizeFileTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'humanize_file',
      description: 'Humanizes specific lines in a file. Pass file path and optional line numbers to minimize IDE token usage.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to humanize',
          },
          start_line: {
            type: 'number',
            description: 'Starting line number (1-based). Default: 1',
            default: 1,
          },
          end_line: {
            type: 'number',
            description: 'Ending line number (1-based). Default: last line of file',
          },
        },
        required: ['file_path'],
      },
    };
  }

  async handle(args) {
    const { file_path, start_line = 1, end_line } = args;

    if (!file_path || typeof file_path !== 'string') {
      throw new Error('File path is required and must be a string');
    }

    if (start_line < 1) {
      throw new Error('start_line must be 1 or greater');
    }

    try {
      // Read file content
      const fs = await import('fs/promises');
      const content = await fs.readFile(file_path, 'utf-8');
      const lines = content.split('\n');
      
      // Set default end_line to last line if not provided
      const actualEndLine = end_line || lines.length;
      
      // Validate line numbers
      if (actualEndLine < start_line) {
        throw new Error('end_line must be greater than or equal to start_line');
      }
      
      if (actualEndLine > lines.length) {
        throw new Error(`end_line (${actualEndLine}) exceeds file length (${lines.length})`);
      }
      
      // Extract only the specified lines
      const selectedLines = lines.slice(start_line - 1, actualEndLine);
      const textToHumanize = selectedLines.join('\n');

      if (!textToHumanize.trim()) {
        throw new Error(`No content found in lines ${start_line}-${actualEndLine}`);
      }

      // Auto-select model and parameters for compact humanization
      const model = await this.selectBestModel(textToHumanize);
      const temperature = 0.7;
      const max_tokens = 200; // Slightly more for file content

      const prompt = `Humanize este texto em português (mais natural, menos IA). Resposta concisa:

${textToHumanize}

Resposta:`;

      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens,
      });

      const result = response.choices?.[0]?.message?.content || 'No response generated';
      const cleanResult = result.replace(/^["']|["']$/g, '').trim();

      // Return minimal response with file reference
      const lineRange = actualEndLine === lines.length && start_line === 1 
        ? 'entire file' 
        : `lines ${start_line}-${actualEndLine}`;
        
      return {
        content: [
          {
            type: 'text',
            text: `File: ${file_path} (${lineRange})\nHumanized: ${cleanResult}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to humanize file: ${error.message}`);
    }
  }
}
