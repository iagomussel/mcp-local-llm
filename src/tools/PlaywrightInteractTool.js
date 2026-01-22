import { BaseTool } from './BaseTool.js';
import { chromium } from 'playwright';

export class PlaywrightInteractTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'playwright_interact',
      description: 'Interact with webpage elements using Playwright (click, type, fill, etc.).',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to interact with',
          },
          actions: {
            type: 'array',
            description: 'Array of actions to perform. Each action has: type (click, type, fill, select, wait), selector, and optional value.',
            items: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  enum: ['click', 'type', 'fill', 'select', 'wait', 'press'],
                  description: 'Type of action to perform',
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector for the element',
                },
                value: {
                  type: 'string',
                  description: 'Value for type/fill/select actions, or key for press action',
                },
                timeout: {
                  type: 'number',
                  description: 'Timeout for wait action in milliseconds',
                },
              },
              required: ['type', 'selector'],
            },
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
        required: ['url', 'actions'],
      },
    };
  }

  async handle(args) {
    const { url, actions, wait_until = 'load', timeout = 30000 } = args;

    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    if (!Array.isArray(actions) || actions.length === 0) {
      throw new Error('Actions array is required and must not be empty');
    }

    let browser = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: wait_until, timeout });

      const results = [];
      for (const action of actions) {
        const { type, selector, value, timeout: actionTimeout } = action;

        try {
          switch (type) {
            case 'click':
              await page.click(selector, { timeout: actionTimeout || 5000 });
              results.push({ action: 'click', selector, success: true });
              break;

            case 'type':
              await page.type(selector, value || '', { timeout: actionTimeout || 5000 });
              results.push({ action: 'type', selector, value, success: true });
              break;

            case 'fill':
              await page.fill(selector, value || '', { timeout: actionTimeout || 5000 });
              results.push({ action: 'fill', selector, value, success: true });
              break;

            case 'select':
              await page.selectOption(selector, value || '', { timeout: actionTimeout || 5000 });
              results.push({ action: 'select', selector, value, success: true });
              break;

            case 'press':
              await page.press(selector, value || 'Enter', { timeout: actionTimeout || 5000 });
              results.push({ action: 'press', selector, key: value, success: true });
              break;

            case 'wait':
              await page.waitForSelector(selector, { timeout: actionTimeout || 5000 });
              results.push({ action: 'wait', selector, success: true });
              break;

            default:
              results.push({ action: type, selector, success: false, error: 'Unknown action type' });
          }
        } catch (error) {
          results.push({ action: type, selector, success: false, error: error.message });
        }
      }

      const finalUrl = page.url();
      const title = await page.title();

      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              url: finalUrl,
              title,
              actions_performed: results,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Failed to interact with ${url}: ${error.message}`);
    }
  }
}
