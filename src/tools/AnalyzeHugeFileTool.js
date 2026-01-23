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

      // For very large files, sample strategically to stay within context limits
      // Estimate: ~4 tokens per line, keep under ~100k tokens input (~25k lines)
      const MAX_LINES_TO_SEND = 25000;
      let contentToAnalyze = content;
      let samplingInfo = '';

      if (lineCount > MAX_LINES_TO_SEND) {
        // Sample: first 10%, middle 10%, last 10%, and all function/class definitions
        const sampleSize = Math.floor(MAX_LINES_TO_SEND * 0.1);
        const firstSample = lines.slice(0, sampleSize).join('\n');
        const middleStart = Math.floor(lineCount / 2) - Math.floor(sampleSize / 2);
        const middleSample = lines.slice(middleStart, middleStart + sampleSize).join('\n');
        const lastSample = lines.slice(-sampleSize).join('\n');
        
        // Extract function/class definitions (common patterns)
        const definitions = lines.filter(line => 
          /^\s*(export\s+)?(function|class|const|let|var)\s+\w+|^\s*(export\s+)?(async\s+)?function\s*\w+|^\s*class\s+\w+/.test(line)
        ).slice(0, sampleSize).join('\n');
        
        contentToAnalyze = [
          firstSample,
          '... [middle section] ...',
          middleSample,
          '... [function/class definitions] ...',
          definitions,
          '... [end section] ...',
          lastSample
        ].filter(Boolean).join('\n');
        
        samplingInfo = ` (sampled from ${lineCount} total lines due to size)`;
      }

      // System prompt for structured analysis - direct JSON output only
      const systemPrompt = `Analyze code as a senior technical consultant and return ONLY valid JSON. No explanations, markdown blocks, or text outside JSON. Start response with { and end with }.

Required JSON structure:
{
  "architecture": "code structure",
  "global_variables": ["name1", "name2"],
  "entry_points": ["function1", "function2"],
  "main_logic": "brief summary",
  "original_size": ${lineCount}
}`;

      const userPrompt = `Analyze this code (${lineCount} lines${samplingInfo}):

${contentToAnalyze}`;

      // Select model optimized for code analysis
      const model = await this.selectBestModel('code analysis architecture');
      const temperature = 0.3; // Low temperature for technical accuracy
      // Use higher token limit for comprehensive structured analysis
      // For large files, we need enough tokens for complete JSON response
      const max_tokens = 10*4096; // Increased for complete JSON analysis

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
        // Check if JSON appears incomplete (common when truncated)
        if (result.trim().endsWith('...') || 
            (result.includes('{') && !result.includes('}')) ||
            (result.match(/\{/g)?.length !== result.match(/\}/g)?.length)) {
          // JSON appears incomplete - return error with partial result
          throw new Error(`JSON response appears incomplete (possibly truncated). Partial response: ${result.substring(0, 500)}...`);
        }
        // If parsing fails for other reasons, return the raw result
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
