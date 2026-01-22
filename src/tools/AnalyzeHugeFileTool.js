import { BaseTool } from './BaseTool.js';

export class AnalyzeHugeFileTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'analyze_huge_file',
      description: 'Analyzes large files locally and returns a structured summary with architecture, global variables, entry points, and main logic. Reduces token usage by processing files locally before sending to Cursor.',
      inputSchema: {
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Path to the file to analyze',
          },
        },
        required: ['path'],
      },
    };
  }

  async handle(args) {
    const { path } = args;

    if (!path || typeof path !== 'string') {
      throw new Error('Path is required and must be a string');
    }

    try {
      // Read file content
      const fs = await import('fs/promises');
      const content = await fs.readFile(path, 'utf-8');
      const lines = content.split('\n');
      const lineCount = lines.length;

      // System prompt for structured analysis
      const systemPrompt = `You are a technical data processor. Analyze the provided file and return ONLY a structured summary in JSON with:
- architecture: overall code structure
- global_variables: list of global variables
- entry_points: main functions and entry points
- main_logic: summary of logic in 3-5 lines
- original_size: number of lines

Do not use greetings. Be technical and concise. If the file is very long, focus on function definitions and structure.`;

      const userPrompt = `Analyze the following file (${lineCount} lines):

\`\`\`
${content}
\`\`\`

Return only the structured JSON as specified.`;

      // Select model optimized for code analysis
      const model = await this.selectBestModel('code analysis architecture');
      const temperature = 0.3; // Low temperature for technical accuracy
      const max_tokens = 512; // Enough for structured summary

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

      const result = response.choices?.[0]?.message?.content || 'No analysis generated';

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
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }
}
