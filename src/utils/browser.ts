import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from './logger.js';

export class BrowserManager {
  private browser: Browser | null = null;
  private pages: Page[] = [];

  async init(): Promise<void> {
    logger.info('Initializing browser...');
    this.browser = await puppeteer.launch({
      headless: process.env.HEADLESS === 'true',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });
    logger.info('Browser initialized successfully');
  }

  async newPage(): Promise<Page> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call init() first');
    }

    const page = await this.browser.newPage();
    
    // Set user agent to avoid bot detection
    await page.setUserAgent(
      process.env.USER_AGENT ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
    );

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    this.pages.push(page);
    return page;
  }

  async close(): Promise<void> {
    logger.info('Closing browser...');
    
    // Close all pages
    for (const page of this.pages) {
      try {
        await page.close();
      } catch (error) {
        logger.error('Error closing page:', error);
      }
    }
    
    this.pages = [];

    // Close browser
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }

    logger.info('Browser closed');
  }

  async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
