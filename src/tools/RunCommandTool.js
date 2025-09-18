import { BaseTool } from './BaseTool.js';

export class RunCommandTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'run_command',
      description: 'Runs a terminal command in a specific directory and returns only a summary result to minimize IDE token usage.',
      inputSchema: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Command to execute',
          },
          directory: {
            type: 'string',
            description: 'Directory to run the command in',
          },
          summary_only: {
            type: 'boolean',
            description: 'Return only summary (success/error) instead of full output',
            default: true,
          },
        },
        required: ['command', 'directory'],
      },
    };
  }

  async handle(args) {
    const { command, directory, summary_only = true } = args;

    if (!command || typeof command !== 'string') {
      throw new Error('Command is required and must be a string');
    }

    if (!directory || typeof directory !== 'string') {
      throw new Error('Directory is required and must be a string');
    }

    try {
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const process = spawn(command, [], {
          cwd: directory,
          shell: true,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        process.stdout.on('data', (data) => {
          output += data.toString();
        });

        process.stderr.on('data', (data) => {
          errorOutput += data.toString();
        });

        process.on('close', (code) => {
          if (summary_only) {
            // Return only summary to minimize IDE token usage
            const success = code === 0;
            const summary = success 
              ? `✅ Command executed successfully in ${directory}`
              : `❌ Command failed (exit code: ${code}) in ${directory}`;
            
            resolve({
              content: [
                {
                  type: 'text',
                  text: summary,
                },
              ],
            });
          } else {
            // Return full output (not recommended for token economy)
            const fullOutput = output + (errorOutput ? `\nErrors: ${errorOutput}` : '');
            resolve({
              content: [
                {
                  type: 'text',
                  text: fullOutput,
                },
              ],
            });
          }
        });

        process.on('error', (error) => {
          reject(new Error(`Failed to execute command: ${error.message}`));
        });
      });
    } catch (error) {
      throw new Error(`Failed to run command: ${error.message}`);
    }
  }
}
