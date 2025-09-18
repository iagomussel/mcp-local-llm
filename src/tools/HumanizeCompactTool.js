import { BaseTool } from './BaseTool.js';

export class HumanizeCompactTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'humanize_compact',
      description: 'Rewrites content in Portuguese with minimal tokens for Cursor efficiency. Very concise responses.',
      inputSchema: {
        type: 'object',
        properties: {
          content: {
            type: 'string',
            description: 'The content to humanize - optimized for token economy',
          },
        },
        required: ['content'],
      },
    };
  }

  async handle(args) {
    const { content } = args;

    if (!content || typeof content !== 'string') {
      throw new Error('Content is required and must be a string');
    }

    // Determine content type and extract text
    let textToHumanize;
    try {
      textToHumanize = await this.extractTextFromContent(content);
    } catch (error) {
      throw new Error(`Failed to extract text from content: ${error.message}`);
    }

    // Auto-select model and parameters for compact humanization
    const model = await this.selectBestModel(textToHumanize);
    const temperature = 0.7; // Lower temperature for more focused responses
    const max_tokens = 150; // Very limited tokens for economy

    const prompt = `Humanize este texto em português (mais natural, menos IA). Resposta MUITO concisa:

${textToHumanize}

Resposta:`;

    try {
      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens,
      });

      const result = response.choices?.[0]?.message?.content || 'No response generated';
      
      // Clean up the response to remove any extra formatting or explanations
      const cleanResult = result.replace(/^["']|["']$/g, '').trim();

      return {
        content: [
          {
            type: 'text',
            text: cleanResult,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to humanize content: ${error.message}`);
    }
  }

  // Extract text from different content types (text, URL, filepath)
  async extractTextFromContent(content) {
    // Check if it's a URL
    if (this.isUrl(content)) {
      return await this.extractTextFromUrl(content);
    }
    
    // Check if it's a file path
    if (this.isFilePath(content)) {
      return await this.extractTextFromFile(content);
    }
    
    // Otherwise, treat as plain text
    return content;
  }

  // Check if content is a URL
  isUrl(content) {
    try {
      new URL(content);
      return true;
    } catch {
      return false;
    }
  }

  // Check if content is a file path
  isFilePath(content) {
    // Simple heuristic: contains file extension or starts with common path patterns
    return /\.(txt|md|json|html|xml|csv)$/i.test(content) || 
           /^[A-Za-z]:\\|^\/|^\.\//.test(content);
  }

  // Extract text from URL
  async extractTextFromUrl(url) {
    try {
      const axios = await import('axios');
      const response = await axios.default.get(url, { timeout: 10000 });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch content from URL: ${error.message}`);
    }
  }

  // Extract text from file
  async extractTextFromFile(filePath) {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(filePath, 'utf-8');
      return content;
    } catch (error) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  }
}
