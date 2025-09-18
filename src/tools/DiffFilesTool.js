import { BaseTool } from './BaseTool.js';

export class DiffFilesTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'diff_files',
      description: 'Compare two files and provide an LLM-generated summary of differences with analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          file1_path: {
            type: 'string',
            description: 'Path to the first file to compare',
          },
          file2_path: {
            type: 'string',
            description: 'Path to the second file to compare',
          },
          context_lines: {
            type: 'number',
            description: 'Number of context lines around changes (default: 3)',
            default: 3,
          },
        },
        required: ['file1_path', 'file2_path'],
      },
    };
  }

  async handle(args) {
    const { file1_path, file2_path, context_lines = 3 } = args;

    if (!file1_path || !file2_path) {
      throw new Error('Both file1_path and file2_path are required');
    }

    try {
      const fs = await import('fs/promises');
      
      // Read both files
      const [file1Content, file2Content] = await Promise.all([
        fs.readFile(file1_path, 'utf8'),
        fs.readFile(file2_path, 'utf8')
      ]);

      // Generate diff using a simple algorithm
      const diff = this.generateDiff(file1Content, file2Content, context_lines);
      
      // Use LLM to analyze the diff
      const model = await this.selectBestModel('code analysis diff comparison');
      const analysisPrompt = `Analyze the following file differences and provide a comprehensive summary in Portuguese:

File 1: ${file1_path}
File 2: ${file2_path}

Diff:
${diff}

Please provide:
1. Summary of changes
2. Impact analysis
3. Potential issues or improvements
4. Recommendations`;

      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = response.choices?.[0]?.message?.content || 'No analysis generated';

      return {
        content: [
          {
            type: 'text',
            text: `📊 **Análise de Diferenças entre Arquivos**\n\n**Arquivos:**\n- ${file1_path}\n- ${file2_path}\n\n**Diferenças:**\n\`\`\`diff\n${diff}\n\`\`\`\n\n**Análise LLM:**\n${analysis}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to compare files: ${error.message}`);
    }
  }

  // Helper method to generate diff
  generateDiff(content1, content2, contextLines = 3) {
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');
    const diff = [];
    
    // Simple diff algorithm
    let i = 0, j = 0;
    while (i < lines1.length || j < lines2.length) {
      if (i >= lines1.length) {
        diff.push(`+ ${lines2[j]}`);
        j++;
      } else if (j >= lines2.length) {
        diff.push(`- ${lines1[i]}`);
        i++;
      } else if (lines1[i] === lines2[j]) {
        diff.push(`  ${lines1[i]}`);
        i++;
        j++;
      } else {
        // Find next match
        let found = false;
        for (let k = j + 1; k < Math.min(j + 10, lines2.length); k++) {
          if (lines1[i] === lines2[k]) {
            for (let l = j; l < k; l++) {
              diff.push(`+ ${lines2[l]}`);
            }
            j = k;
            found = true;
            break;
          }
        }
        if (!found) {
          diff.push(`- ${lines1[i]}`);
          i++;
        }
      }
    }
    
    return diff.join('\n');
  }
}
