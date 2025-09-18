import { BaseTool } from './BaseTool.js';

export class GitDiffFileTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'git_diff_file',
      description: 'Compare a specific file between two git branches and provide LLM analysis of changes.',
      inputSchema: {
        type: 'object',
        properties: {
          file_path: {
            type: 'string',
            description: 'Path to the file to compare between branches',
          },
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
          include_commit_info: {
            type: 'boolean',
            description: 'Include commit information and author details',
            default: true,
          },
        },
        required: ['file_path', 'branch2'],
      },
    };
  }

  async handle(args) {
    const { 
      file_path, 
      branch1, 
      branch2, 
      directory = process.cwd(), 
      context_lines = 3,
      include_commit_info = true 
    } = args;

    if (!file_path || !branch2) {
      throw new Error('file_path and branch2 are required');
    }

    try {
      const { spawn } = await import('child_process');
      
      // Get current branch if branch1 not specified
      let currentBranch = branch1;
      if (!currentBranch) {
        currentBranch = await this.getCurrentBranch(directory);
      }

      // Check if file exists in both branches
      const fileExistsInBranch1 = await this.checkFileExistsInBranch(file_path, currentBranch, directory);
      const fileExistsInBranch2 = await this.checkFileExistsInBranch(file_path, branch2, directory);

      if (!fileExistsInBranch1 && !fileExistsInBranch2) {
        throw new Error(`File ${file_path} does not exist in either branch`);
      }

      // Generate git diff for specific file
      const diff = await this.getGitDiffForFile(file_path, currentBranch, branch2, directory, context_lines);
      
      // Get commit information if requested
      let commitInfo = '';
      if (include_commit_info) {
        commitInfo = await this.getCommitInfoForFile(file_path, currentBranch, branch2, directory);
      }

      // Use LLM to analyze the file diff
      const model = await this.selectBestModel('code analysis git diff file comparison');
      const analysisPrompt = `Analyze the following git diff for a specific file between branches and provide a comprehensive summary in Portuguese:

File: ${file_path}
Branch 1: ${currentBranch}
Branch 2: ${branch2}

${commitInfo ? `Commit Information:\n${commitInfo}\n` : ''}

Git Diff:
${diff}

Please provide:
1. Summary of changes in this specific file
2. Impact analysis of the changes
3. Potential issues or improvements
4. Recommendations`;

      const response = await this.callModelRunner({
        model,
        messages: [{ role: 'user', content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 700,
      });

      const analysis = response.choices?.[0]?.message?.content || 'No analysis generated';

      // Determine file status
      let fileStatus = '';
      if (!fileExistsInBranch1) {
        fileStatus = '📄 **Arquivo adicionado** na branch `' + branch2 + '`';
      } else if (!fileExistsInBranch2) {
        fileStatus = '🗑️ **Arquivo removido** na branch `' + branch2 + '`';
      } else {
        fileStatus = '📝 **Arquivo modificado** entre as branches';
      }

      return {
        content: [
          {
            type: 'text',
            text: `🌿 **Análise de Diferenças de Arquivo entre Branches**\n\n**Arquivo:** ${file_path}\n**Branches:** ${currentBranch} → ${branch2}\n**Status:** ${fileStatus}\n\n${commitInfo ? `**Informações do Commit:**\n${commitInfo}\n` : ''}**Git Diff:**\n\`\`\`diff\n${diff}\n\`\`\`\n\n**Análise LLM:**\n${analysis}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to compare file between branches: ${error.message}`);
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

  async checkFileExistsInBranch(filePath, branch, directory) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('git', ['cat-file', '-e', `${branch}:${filePath}`], {
        cwd: directory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  async getGitDiffForFile(filePath, branch1, branch2, directory, contextLines) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('git', ['diff', `-U${contextLines}`, branch1, branch2, '--', filePath], {
        cwd: directory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          resolve(output || 'No differences found');
        } else {
          reject(new Error(`Git diff failed: ${code}`));
        }
      });
    });
  }

  async getCommitInfoForFile(filePath, branch1, branch2, directory) {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const process = spawn('git', ['log', '--oneline', '--pretty=format:%h %an %ad %s', '--date=short', `${branch1}..${branch2}`, '--', filePath], {
        cwd: directory,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      process.stdout.on('data', (data) => {
        output += data.toString();
      });

      process.on('close', (code) => {
        if (code === 0) {
          const commits = output.trim().split('\n').filter(line => line.trim());
          if (commits.length > 0) {
            resolve(`Commits que afetam este arquivo:\n${commits.slice(0, 5).join('\n')}${commits.length > 5 ? `\n... e mais ${commits.length - 5} commits` : ''}`);
          } else {
            resolve('Nenhum commit específico encontrado para este arquivo');
          }
        } else {
          resolve('Não foi possível obter informações do commit');
        }
      });
    });
  }
}
