import { BaseTool } from './BaseTool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

export class DesktopClipboardTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'desktop_clipboard',
      description: 'Read from or write to the system clipboard. Cross-platform support for Windows, macOS, and Linux.',
      inputSchema: {
        type: 'object',
        properties: {
          operation: {
            type: 'string',
            description: 'Operation: read or write',
            enum: ['read', 'write'],
          },
          content: {
            type: 'string',
            description: 'Content to write to clipboard (required for write operation)',
          },
        },
        required: ['operation'],
      },
    };
  }

  async handle(args) {
    const { operation, content } = args;

    if (!operation || typeof operation !== 'string') {
      throw new Error('Operation is required and must be a string');
    }

    try {
      const osPlatform = platform();
      let result;

      if (operation === 'read') {
        let command;
        if (osPlatform === 'win32') {
          command = 'powershell -Command "Get-Clipboard"';
        } else if (osPlatform === 'darwin') {
          command = 'pbpaste';
        } else {
          command = 'xclip -selection clipboard -o';
        }

        const { stdout } = await execAsync(command);
        result = {
          success: true,
          operation: 'read',
          content: stdout.trim(),
        };
      } else if (operation === 'write') {
        if (!content || typeof content !== 'string') {
          throw new Error('Content is required for write operation');
        }

        let command;
        if (osPlatform === 'win32') {
          const escaped = content.replace(/"/g, '\\"');
          command = `powershell -Command "Set-Clipboard -Value '${escaped}'"`;
        } else if (osPlatform === 'darwin') {
          const escaped = content.replace(/'/g, "\\'");
          command = `echo '${escaped}' | pbcopy`;
        } else {
          const escaped = content.replace(/"/g, '\\"');
          command = `echo "${escaped}" | xclip -selection clipboard`;
        }

        await execAsync(command);
        result = {
          success: true,
          operation: 'write',
          content_length: content.length,
        };
      } else {
        throw new Error(`Unknown operation: ${operation}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to ${operation} clipboard: ${error.message}`);
    }
  }
}
