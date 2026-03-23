import { BaseTool } from './BaseTool.js';
import { readFile } from 'fs/promises';
import { extname } from 'path';

export class DocumentorCodeTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'documentor_code',
      description: 'Generate inline code documentation (JSDoc, docstrings, etc.) for functions, classes, and modules in a code file.',
      cacheable: true,
      cacheTTL: 300_000, // 5 minutes
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to add documentation to',
          },
          doc_style: {
            type: 'string',
            description: 'Documentation style: jsdoc (JavaScript/TypeScript), python (docstrings), or auto (detect from file extension)',
            enum: ['jsdoc', 'python', 'auto'],
            default: 'auto',
          },
          overwrite_existing: {
            type: 'boolean',
            description: 'Whether to overwrite existing documentation comments',
            default: false,
          },
        },
        required: ['file_path'],
      },
    };
  }

  async handle(args) {
    const { file_path, doc_style = 'auto', overwrite_existing = false } = args;

    if (!file_path || typeof file_path !== 'string') {
      throw new Error('File path is required and must be a string');
    }

    try {
      const content = await readFile(file_path, 'utf-8');
      const ext = extname(file_path).toLowerCase();

      let detectedStyle = doc_style;
      if (doc_style === 'auto') {
        if (['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
          detectedStyle = 'jsdoc';
        } else if (['.py'].includes(ext)) {
          detectedStyle = 'python';
        } else {
          detectedStyle = 'jsdoc';
        }
      }

      const prompt = `Analyze the following code file and generate inline documentation comments for all functions, classes, and modules.

File: ${file_path}
Documentation style: ${detectedStyle}
Overwrite existing docs: ${overwrite_existing}

Code:
\`\`\`
${content}
\`\`\`

Generate ${detectedStyle === 'jsdoc' ? 'JSDoc comments' : 'Python docstrings'} for:
1. All functions/methods with:
   - Description
   - @param/@parameter tags for each parameter (type and description)
   - @returns/@return tag with type and description
   - @throws/@raises if applicable
   - @example if helpful

2. All classes with:
   - Description
   - @class tag
   - Documentation for constructor parameters

3. Modules/exports with:
   - File-level description

${overwrite_existing ? 'Replace existing documentation comments.' : 'Only add documentation where it is missing.'}

Return the complete file with documentation added, preserving all original code structure and formatting.`;

      const model = await this.selectBestModel(prompt);
      const temperature = this.getOptimalTemperature(prompt);
      const max_tokens = this.getOptimalMaxTokens(prompt);

      const response = await this.callModelRunner({
        model,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: Math.max(max_tokens, 2048),
      });

      const result = response.choices?.[0]?.message?.content || 'No documentation generated';

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate code documentation: ${error.message}`);
    }
  }
}
