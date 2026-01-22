import { BaseTool } from './BaseTool.js';
import { chromium } from 'playwright';

export class PlaywrightScreenshotTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'playwright_screenshot',
      description: 'Take a screenshot of a webpage using Playwright. Returns the path to the saved screenshot.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to screenshot',
          },
          output_path: {
            type: 'string',
            description: 'Path where to save the screenshot (default: screenshot.png in current directory)',
          },
          full_page: {
            type: 'boolean',
            description: 'Whether to capture the full scrollable page',
            default: true,
          },
          wait_until: {
            type: 'string',
            description: 'When to consider page loaded: load, domcontentloaded, networkidle',
            enum: ['load', 'domcontentloaded', 'networkidle'],
            default: 'load',
          },
          timeout: {
            type: 'number',
            description: 'Maximum navigation time in milliseconds',
            default: 30000,
          },
        },
        required: ['url'],
      },
    };
  }

  async handle(args) {
    const { url, output_path, full_page = true, wait_until = 'load', timeout = 30000 } = args;

    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    const screenshotPath = output_path || 'screenshot.png';
    let browser = null;

    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: wait_until, timeout });
      await page.screenshot({ path: screenshotPath, fullPage: full_page });

      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              screenshot_path: screenshotPath,
              url,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Failed to take screenshot of ${url}: ${error.message}`);
    }
  }
}
