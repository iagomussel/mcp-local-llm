import { BaseTool } from './BaseTool.js';
import { chromium } from 'playwright';

export class PlaywrightNavigateTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'playwright_navigate',
      description: 'Navigate to a URL using Playwright browser automation. Returns page title and URL.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to navigate to',
          },
          wait_until: {
            type: 'string',
            description: 'When to consider navigation successful: load, domcontentloaded, networkidle',
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
    const { url, wait_until = 'load', timeout = 30000 } = args;

    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    let browser = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: wait_until, timeout });

      const title = await page.title();
      const currentUrl = page.url();

      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              title,
              url: currentUrl,
              navigated_to: url,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Failed to navigate to ${url}: ${error.message}`);
    }
  }
}
