import { BaseTool } from './BaseTool.js';

export class DigestErrorLogsTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'digest_error_logs',
      description: 'Processes error logs locally to identify patterns, remove repetitive timestamps, and group similar errors. Returns a structured summary with probable cause and statistics.',
      inputSchema: {
        type: 'object',
        properties: {
          log_file_path: {
            type: 'string',
            description: 'Path to the log file to process',
          },
          terminal_output: {
            type: 'string',
            description: 'Direct terminal output content to process',
          },
        },
      },
    };
  }

  async handle(args) {
    const { log_file_path, terminal_output } = args;

    if (!log_file_path && !terminal_output) {
      throw new Error('Either log_file_path or terminal_output must be provided');
    }

    if (log_file_path && terminal_output) {
      throw new Error('Provide either log_file_path or terminal_output, not both');
    }

    try {
      let logContent = '';

      if (log_file_path) {
        // Read log file
        const fs = await import('fs/promises');
        logContent = await fs.readFile(log_file_path, 'utf-8');
      } else {
        logContent = terminal_output;
      }

      if (!logContent || !logContent.trim()) {
        throw new Error('Log content is empty');
      }

      // System prompt for log analysis
      const systemPrompt = `You are a technical log processor. Analyze the provided logs and return ONLY a structured summary in JSON with:
- probable_cause: root cause of the main error
- occurrences: number of times the error occurred
- period: time period of occurrences
- error_types: list of unique error types found
- recommendation: technical recommendation in 1-2 lines

Remove repetitive timestamps and group similar errors. Be technical and concise.`;

      const userPrompt = `Analyze the following error logs:

\`\`\`
${logContent}
\`\`\`

Return only the structured JSON as specified.`;

      // Select model optimized for technical analysis
      const model = await this.selectBestModel('error log analysis technical');
      const temperature = 0.2; // Very low temperature for precise error analysis
      const max_tokens = 400; // Compact summary

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
      throw new Error(`Failed to process logs: ${error.message}`);
    }
  }
}
