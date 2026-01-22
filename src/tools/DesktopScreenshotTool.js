import { BaseTool } from './BaseTool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';
import { writeFile } from 'fs/promises';

const execAsync = promisify(exec);

export class DesktopScreenshotTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'desktop_screenshot',
      description: 'Take a screenshot of the desktop. Cross-platform support for Windows, macOS, and Linux.',
      inputSchema: {
        type: 'object',
        properties: {
          output_path: {
            type: 'string',
            description: 'Path where to save the screenshot (default: screenshot.png in current directory)',
          },
          monitor: {
            type: 'number',
            description: 'Monitor number to capture (0 = primary, 1 = secondary, etc.)',
            default: 0,
          },
        },
      },
    };
  }

  async handle(args) {
    const { output_path, monitor = 0 } = args;

    const screenshotPath = output_path || 'screenshot.png';
    const osPlatform = platform();

    try {
      let command;

      if (osPlatform === 'win32') {
        command = `powershell -Command "Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $bounds = [System.Windows.Forms.Screen]::AllScreens[${monitor}].Bounds; $bmp = New-Object System.Drawing.Bitmap $bounds.Width, $bounds.Height; $graphics = [System.Drawing.Graphics]::FromImage($bmp); $graphics.CopyFromScreen($bounds.Location, [System.Drawing.Point]::Empty, $bounds.Size); $bmp.Save('${screenshotPath}', [System.Drawing.Imaging.ImageFormat]::Png); $graphics.Dispose(); $bmp.Dispose()"`;
      } else if (osPlatform === 'darwin') {
        command = `screencapture -x "${screenshotPath}"`;
      } else {
        command = `import -window root "${screenshotPath}"`;
      }

      await execAsync(command);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenshot_path: screenshotPath,
              platform: osPlatform,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to take screenshot: ${error.message}`);
    }
  }
}
