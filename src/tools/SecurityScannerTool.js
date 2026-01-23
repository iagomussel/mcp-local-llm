import { BaseTool } from './BaseTool.js';

export class SecurityScannerTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'security_scanner',
      description: 'LLM-powered security and performance scanner that analyzes code files for vulnerabilities, performance issues (race conditions, deadlocks, memory leaks), and improvement opportunities. Returns structured JSON with security issues and recommendations.',
      inputSchema: {
        type: 'object',
        properties: {
          file_paths: {
            type: 'array',
            items: {
              type: 'string',
            },
            description: 'Array of file paths to scan for security vulnerabilities',
          },
        },
        required: ['file_paths'],
      },
    };
  }

  async handle(args) {
    const { file_paths } = args;

    if (!file_paths || !Array.isArray(file_paths) || file_paths.length === 0) {
      throw new Error('file_paths is required and must be a non-empty array');
    }

    try {
      const fs = await import('fs/promises');
      const filesData = [];

      // Read all files
      for (const filePath of file_paths) {
        try {
          const content = await fs.readFile(filePath, 'utf-8');
          const lines = content.split('\n');
          filesData.push({
            path: filePath,
            content,
            lineCount: lines.length,
          });
        } catch (error) {
          // Skip files that can't be read, but continue with others
          filesData.push({
            path: filePath,
            content: null,
            lineCount: 0,
            error: error.message,
          });
        }
      }

      // Filter out files with errors for analysis
      const validFiles = filesData.filter(f => f.content !== null);
      
      if (validFiles.length === 0) {
        throw new Error('No valid files could be read for analysis');
      }

      // Prepare content for analysis
      const filesContent = validFiles.map(file => 
        `File: ${file.path} (${file.lineCount} lines)\n\`\`\`\n${file.content}\n\`\`\``
      ).join('\n\n---\n\n');

      const totalLines = validFiles.reduce((sum, f) => sum + f.lineCount, 0);

      // System prompt for security and performance analysis - direct JSON output only
      const systemPrompt = `You are a senior security and performance consultant analyzing code for vulnerabilities, performance issues, and improvement opportunities. Return ONLY valid JSON. No explanations, markdown blocks, or text outside JSON. Start response with { and end with }.

Analyze code for:

SECURITY VULNERABILITIES:
- SQL injection, XSS, CSRF, SSRF
- Authentication and authorization flaws
- Insecure dependencies and outdated packages
- Sensitive data exposure (secrets, credentials, PII)
- Insecure deserialization
- Missing security headers
- Weak cryptography
- Path traversal, command injection
- Security misconfigurations

PERFORMANCE ISSUES:
- Race conditions (concurrent access without proper synchronization)
- Deadlocks and livelocks
- Memory leaks and resource leaks
- Blocking operations in async code
- N+1 query problems
- Inefficient algorithms and data structures
- Unnecessary computations or redundant operations
- Missing caching opportunities
- Large payloads or inefficient data transfer
- CPU-intensive operations blocking event loop

CODE QUALITY & ARCHITECTURE:
- Code smells and anti-patterns
- Tight coupling and low cohesion
- Missing error handling
- Poor error messages
- Code duplication
- Overly complex logic

Required JSON structure:
{
  "vulnerabilities": [
    {
      "file": "path/to/file.js",
      "severity": "critical|high|medium|low",
      "type": "vulnerability type (e.g., sql_injection, xss, race_condition, memory_leak)",
      "line": 42,
      "description": "brief description",
      "recommendation": "how to fix"
    }
  ],
  "improvements": [
    {
      "file": "path/to/file.js",
      "category": "security|performance|code_quality|architecture",
      "line": 42,
      "description": "improvement description",
      "recommendation": "suggestion"
    }
  ],
  "summary": {
    "total_files": ${validFiles.length},
    "total_lines": ${totalLines},
    "vulnerabilities_count": 0,
    "improvements_count": 0,
    "critical_count": 0,
    "high_count": 0,
    "medium_count": 0,
    "low_count": 0
  }
}`;

      const userPrompt = `Analyze these ${validFiles.length} file(s) for security vulnerabilities, performance issues (including race conditions, deadlocks, memory leaks), and improvement opportunities:

${filesContent}`;

      // Select model optimized for security and performance analysis
      const model = await this.selectBestModel('security vulnerability performance race condition code analysis');
      const temperature = 0.2; // Very low temperature for accurate security analysis
      const max_tokens = 8192; // Higher limit for comprehensive security reports

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

      // Validate and enhance the result structure
      if (typeof parsedResult === 'object' && parsedResult !== null) {
        // Ensure required fields exist
        if (!parsedResult.vulnerabilities) parsedResult.vulnerabilities = [];
        if (!parsedResult.improvements) parsedResult.improvements = [];
        if (!parsedResult.summary) {
          parsedResult.summary = {
            total_files: validFiles.length,
            total_lines: totalLines,
            vulnerabilities_count: parsedResult.vulnerabilities?.length || 0,
            improvements_count: parsedResult.improvements?.length || 0,
            critical_count: parsedResult.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
            high_count: parsedResult.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
            medium_count: parsedResult.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
            low_count: parsedResult.vulnerabilities?.filter(v => v.severity === 'low').length || 0,
          };
        }
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
      throw new Error(`Failed to scan files: ${error.message}`);
    }
  }
}
