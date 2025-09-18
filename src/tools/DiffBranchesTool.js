import { BaseTool } from './BaseTool.js';

export class DiffBranchesTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'diff_branches',
      description: 'Compare two git branches and provide an LLM-generated summary of differences with analysis.',
      inputSchema: {
        type: 'object',
        properties: {
          branch1: {
            type: 'string',
            description: 'First branch to compare (default: current branch)',
          },
          branch2: {
            type: 'string',
            description: 'Second branch to compare',
          },
          directory: {
            type: 'string',
            description: 'Git repository directory (default: current directory)',
          },
          context_lines: {
            type: 'number',
            description: 'Number of context lines around changes (default: 3)',
            default: 3,
          },
        },
        required: ['branch2'],
      },
    };
  }

  async handle(args) {
    const { branch1, branch2, directory = process.cwd(), context_lines = 3 } = args;

    if (!branch2) {
      throw new Error('branch2 is required');
    }

    try {
      const { spawn } = await import('child_process');
      
      // Get current branch if branch1 not specified
      let currentBranch = branch1;
      if (!currentBranch) {
        currentBranch = await this.getCurrentBranch(directory);
      }

      // Generate git diff
      const diff = await this.getGitDiff(currentBranch, branch2, directory, context_lines);
      
      // Use LLM to analyze the diff
      const model = await this.selectBestModel('code analysis git diff branch comparison');
      const analysisPrompt = `Analyze the following git branch differences and provide a comprehensive summary in Portuguese:

Branch 1: ${currentBranch}
Branch 2: ${branch2}

Git Diff:
${diff}

Please provide:
1. Summary of changes between branches
2. Impact analysis
3. Potential conflicts or issues
4. Recommendations for merge/rebase`;

      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      const analysis = response.choices?.[0]?.message?.content || 'No analysis generated';

      return {
        content: [
          {
            type: 'text',
            text: `🌿 **Análise de Diferenças entre Branches**\n\n**Branches:**\n- ${currentBranch}\n- ${branch2}\n\n**Git Diff:**\n\`\`\`diff\n${diff}\n\`\`\`\n\n**Análise LLM:**\n${analysis}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to compare branches: ${error.message}`);
    }
  }

  // Helper methods
  async getCurrentBranch(directory) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('git', ['branch', '--show-current'], {
        cwd: directory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error('Failed to get current branch'));
        }
      });
    });
  }

  async getGitDiff(branch1, branch2, directory, contextLines) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('git', ['diff', `-U${contextLines}`, branch1, branch2], {
        cwd: directory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`Git diff failed: ${code}`));
        }
      });
    });
  }
}
