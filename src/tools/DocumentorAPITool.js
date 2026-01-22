import { BaseTool } from './BaseTool.js';
import { readFile } from 'fs/promises';
import { join, extname } from 'path';

export class DocumentorAPITool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'documentor_api',
      description: 'Generate API documentation from code files. Analyzes functions, classes, and exports to create structured API documentation.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to generate API documentation for',
          },
          output_format: {
            type: 'string',
            description: 'Output format: markdown, json, or structured',
            enum: ['markdown', 'json', 'structured'],
            default: 'markdown',
          },
          include_examples: {
            type: 'boolean',
            description: 'Whether to include usage examples in documentation',
            default: true,
          },
        },
        required: ['file_path'],
      },
    };
  }

  async handle(args) {
    const { file_path, output_format = 'markdown', include_examples = true } = args;

    if (!file_path || typeof file_path !== 'string') {
      throw new Error('File path is required and must be a string');
    }

    try {
      const content = await readFile(file_path, 'utf-8');
      const ext = extname(file_path).toLowerCase();

      const prompt = `Analyze the following ${ext} code file and generate comprehensive API documentation.

File: ${file_path}

Code:
\`\`\`${ext}
${content}
\`\`\`

Generate API documentation that includes:
1. File overview and purpose
2. All exported functions/classes/modules with:
   - Description
   - Parameters/arguments with types
   - Return values/types
   - Usage examples (if include_examples is true)
3. Dependencies and imports
4. Key internal functions/classes (if relevant)

Output format: ${output_format}
Include examples: ${include_examples}

${output_format === 'markdown' ? 'Format as clean markdown with proper headings, code blocks, and examples.' : output_format === 'json' ? 'Return structured JSON with sections for overview, exports, functions, classes, etc.' : 'Return a structured analysis with clear sections.'}`;

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
        temperature,
        max_tokens: Math.max(max_tokens, 1024),
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
      throw new Error(`Failed to generate API documentation: ${error.message}`);
    }
  }
}
