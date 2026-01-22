import { BaseTool } from './BaseTool.js';
import { chromium } from 'playwright';

export class PlaywrightExtractContentTool extends BaseTool {
  getToolDefinition() {
    return {
      name: 'playwright_extract_content',
      description: 'Extract text content, HTML, or specific elements from a webpage using Playwright.',
      inputSchema: {
        type: 'object',
        properties: {
          url: {
            type: 'string',
            description: 'The URL to extract content from',
          },
          selector: {
            type: 'string',
            description: 'CSS selector to extract specific element(s). If not provided, extracts all text.',
          },
          extract_type: {
            type: 'string',
            description: 'Type of content to extract: text, html, innerHTML, outerHTML',
            enum: ['text', 'html', 'innerHTML', 'outerHTML'],
            default: 'text',
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
    const { url, selector, extract_type = 'text', wait_until = 'load', timeout = 30000 } = args;

    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    let browser = null;
    try {
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext();
      const page = await context.newPage();

      await page.goto(url, { waitUntil: wait_until, timeout });

      let content;
      if (selector) {
        const element = await page.$(selector);
        if (!element) {
          throw new Error(`Element not found with selector: ${selector}`);
        }

        switch (extract_type) {
          case 'text':
            content = await element.textContent();
            break;
          case 'html':
            content = await element.innerHTML();
            break;
          case 'innerHTML':
            content = await element.innerHTML();
            break;
          case 'outerHTML':
            content = await element.evaluate(el => el.outerHTML);
            break;
          default:
            content = await element.textContent();
        }
      } else {
        switch (extract_type) {
          case 'text':
            content = await page.textContent('body');
            break;
          case 'html':
          case 'innerHTML':
            content = await page.innerHTML('body');
            break;
          case 'outerHTML':
            content = await page.evaluate(() => document.body.outerHTML);
            break;
          default:
            content = await page.textContent('body');
        }
      }

      await browser.close();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              url,
              content,
              selector: selector || 'body',
              extract_type,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      if (browser) {
        await browser.close();
      }
      throw new Error(`Failed to extract content from ${url}: ${error.message}`);
    }
  }
}
