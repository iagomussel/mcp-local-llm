import { BaseTool } from './BaseTool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

export class DesktopLaunchTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'desktop_launch',
      description: 'Launch applications, files, or URLs on the desktop. Cross-platform support for Windows, macOS, and Linux.',
      inputSchema: {
        type: 'object',
        properties: {
          target: {
            type: 'string',
            description: 'Application name, file path, or URL to launch',
          },
          app_name: {
            type: 'string',
            description: 'Specific application name to use for opening (e.g., "code", "chrome", "firefox")',
          },
          wait: {
            type: 'boolean',
            description: 'Wait for the application to exit before returning',
            default: false,
          },
        },
        required: ['target'],
      },
    };
  }

  async handle(args) {
    const { target, app_name, wait = false } = args;

    if (!target || typeof target !== 'string') {
      throw new Error('Target is required and must be a string');
    }

    try {
      const osPlatform = platform();
      let command;

      if (osPlatform === 'win32') {
        if (app_name) {
          command = `start "" "${app_name}" "${target}"`;
        } else {
          command = `start "" "${target}"`;
        }
      } else if (osPlatform === 'darwin') {
        if (app_name) {
          command = `open -a "${app_name}" "${target}"`;
        } else {
          command = `open "${target}"`;
        }
      } else {
        if (app_name) {
          command = `${app_name} "${target}"`;
        } else {
          command = `xdg-open "${target}"`;
        }
        if (!wait) {
          command += ' &';
        }
      }

      if (wait) {
        await execAsync(command);
      } else {
        execAsync(command).catch(() => {});
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              target,
              app_name: app_name || 'default',
              platform: osPlatform,
              launched: true,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to launch ${target}: ${error.message}`);
    }
  }
}
