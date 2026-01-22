import { BaseTool } from './BaseTool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { platform } from 'os';

const execAsync = promisify(exec);

export class DesktopNotificationTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'desktop_notification',
      description: 'Show a desktop notification. Cross-platform support for Windows, macOS, and Linux.',
      inputSchema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            description: 'Notification title',
          },
          message: {
            type: 'string',
            description: 'Notification message',
          },
          urgency: {
            type: 'string',
            description: 'Notification urgency level',
            enum: ['low', 'normal', 'critical'],
            default: 'normal',
          },
        },
        required: ['title', 'message'],
      },
    };
  }

  async handle(args) {
    const { title, message, urgency = 'normal' } = args;

    if (!title || typeof title !== 'string') {
      throw new Error('Title is required and must be a string');
    }

    if (!message || typeof message !== 'string') {
      throw new Error('Message is required and must be a string');
    }

    try {
      const osPlatform = platform();
      let command;

      if (osPlatform === 'win32') {
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedMessage = message.replace(/"/g, '\\"');
        command = `powershell -Command "[Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null; [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null; $xml = [Windows.Data.Xml.Dom.XmlDocument]::new(); $xml.LoadXml('<toast><visual><binding template=\"ToastText02\"><text id=\"1\">${escapedTitle}</text><text id=\"2\">${escapedMessage}</text></binding></visual></toast>'); $toast = [Windows.UI.Notifications.ToastNotification]::new($xml); [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier('MCP Local LLM').Show($toast)"`;
      } else if (osPlatform === 'darwin') {
        const escapedTitle = title.replace(/'/g, "\\'");
        const escapedMessage = message.replace(/'/g, "\\'");
        command = `osascript -e 'display notification "${escapedMessage}" with title "${escapedTitle}"'`;
      } else {
        const urgencyMap = { low: 'low', normal: 'normal', critical: 'critical' };
        const escapedTitle = title.replace(/"/g, '\\"');
        const escapedMessage = message.replace(/"/g, '\\"');
        command = `notify-send -u ${urgencyMap[urgency]} "${escapedTitle}" "${escapedMessage}"`;
      }

      await execAsync(command);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              title,
              message,
              urgency,
              platform: osPlatform,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to show notification: ${error.message}`);
    }
  }
}
