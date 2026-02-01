import { Page } from 'puppeteer';
import { logger } from '../utils/logger.js';
import type { ScrapedProduct, ScrapedInventory, ScrapedStore } from '../types/index.js';

export class ProductScraper {
  constructor(private page: Page) {}

  /**
   * Search for all products on LCBO website
   * Returns array of product URLs to scrape
   */
  async searchAllProducts(): Promise<string[]> {
    logger.info('Starting product search...');
    const productUrls: string[] = [];

    try {
      // Navigate to LCBO search page (empty query shows all products)
      // Coveo loads products dynamically via JavaScript
      await this.page.goto('https://www.lcbo.com/en/catalogsearch/result/#q=&t=Products', {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      logger.info('Waiting for Coveo search results to load...');

      // Wait for Coveo's dynamic product containers to appear
      await this.page.waitForSelector('.coveo-result-list .img-products, .CoveoResultList .img-products', {
        timeout: 45000,
      });

      // Extra wait for Coveo JS to populate hrefs (they start as empty strings)
      await this.delay(3000);

      // Wait until at least one product link has a real href
      await this.page.waitForFunction(
        () => {
          const links = document.querySelectorAll('.img-products a[href]');
          return Array.from(links).some((a) => (a as HTMLAnchorElement).href.includes('/product/'));
        },
        { timeout: 30000 },
      );

      logger.info('Products loaded, scrolling to discover all...');

      // Scroll to load all products (lazy loading)
      await this.scrollToLoadAll();

      // Extract all product URLs
      productUrls.push(...await this.extractProductUrls());

      logger.info(`Found ${productUrls.length} products`);
    } catch (error) {
      logger.error('Error during product search:', error);
      throw error;
    }

    return productUrls;
  }

  /**
   * Scroll page to trigger lazy loading of all products
   */
  private async scrollToLoadAll(): Promise<void> {
    let previousHeight = 0;
    let currentHeight = await this.page.evaluate(() => document.body.scrollHeight);
    let stableCount = 0;

    while (stableCount < 3) {
      previousHeight = currentHeight;

      // Scroll to bottom
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for Coveo to load new content (needs longer than static pages)
      await this.delay(3000);

      currentHeight = await this.page.evaluate(() => document.body.scrollHeight);

      if (previousHeight === currentHeight) {
        stableCount++;
      } else {
        stableCount = 0;
      }
    }

    const productCount = await this.page.evaluate(
      () => document.querySelectorAll('.img-products').length,
    );
    logger.info(`Finished loading all products (${productCount} product containers found)`);
  }

  /**
   * Extract product URLs from search results
   */
  private async extractProductUrls(): Promise<string[]> {
    return this.page.evaluate(() => {
      // Coveo renders products inside .img-products containers
      const productLinks = Array.from(document.querySelectorAll('.img-products a[href]'));
      const urls = productLinks
        .map((link) => (link as HTMLAnchorElement).href)
        .filter((url) => url && url.includes('/product/'));

      // Deduplicate URLs (Coveo may render duplicate links per product)
      return Array.from(new Set(urls));
    });
  }

  /**
   * Scrape detailed product information from product page
   */
  async scrapeProductDetails(productUrl: string): Promise<ScrapedProduct | null> {
    try {
      logger.info(`Scraping product: ${productUrl}`);
      
      await this.page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      // Wait for main content
      await this.page.waitForSelector('.product-view', { timeout: 30000 });

      const product = await this.page.evaluate((url) => {
        const getText = (selector: string): string | undefined => {
          const element = document.querySelector(selector);
          return element?.textContent?.trim() || undefined;
        };

        const getAttr = (selector: string, attr: string): string | undefined => {
          const element = document.querySelector(selector);
          return element?.getAttribute(attr) || undefined;
        };

        // Extract product ID from URL
        const idMatch = url.match(/product\/(\d+)/);
        const lcboId = idMatch ? idMatch[1] : '';

        return {
          lcboId,
          name: getText('.product-name') || '',
          category: getText('.category-name'),
          producer: getText('.producer-name'),
          country: getText('[data-field="country"]'),
          region: getText('[data-field="region"]'),
          varietal: getText('[data-field="varietal"]'),
          vintage: getText('[data-field="vintage"]'),
          alcoholContent: parseFloat(getText('[data-field="alcohol"]') || '0') || undefined,
          volume: parseInt(getText('[data-field="volume"]')?.replace(/\D/g, '') || '0') || undefined,
          price: parseInt(getText('.price')?.replace(/[^0-9]/g, '') || '0') || undefined,
          description: getText('.product-description'),
          imageUrl: getAttr('.product-image img', 'src'),
          productUrl: url,
        } as ScrapedProduct;
      }, productUrl);

      logger.info(`Successfully scraped product: ${product.name}`);
      return product;
    } catch (error) {
      logger.error(`Error scraping product ${productUrl}:`, error);
      return null;
    }
  }

  /**
   * Get inventory levels from all stores for a product
   */
  async scrapeInventory(productUrl: string): Promise<ScrapedInventory[]> {
    const inventory: ScrapedInventory[] = [];

    try {
      // Navigate to product page if not already there
      if (this.page.url() !== productUrl) {
        await this.page.goto(productUrl, {
          waitUntil: 'networkidle2',
          timeout: 60000,
        });
      }

      // Click "Check Availability in All Stores" button
      const availabilityButton = await this.page.$('button:has-text("Check Availability"), a:has-text("See All Stores")');
      
      if (availabilityButton) {
        await availabilityButton.click();
        await this.delay(2000);

        // Wait for store list to load
        await this.page.waitForSelector('.store-item, .store-location', { timeout: 30000 });

        // Extract inventory data
        inventory.push(...await this.extractInventoryData());
      } else {
        logger.warn('No inventory availability button found');
      }
    } catch (error) {
      logger.error('Error scraping inventory:', error);
    }

    return inventory;
  }

  /**
   * Extract inventory data from store availability list
   */
  private async extractInventoryData(): Promise<ScrapedInventory[]> {
    return this.page.evaluate(() => {
      const storeItems = Array.from(document.querySelectorAll('.store-item, .store-location'));
      const productId = window.location.pathname.match(/product\/(\d+)/)?.[1] || '';

      return storeItems.map((item) => {
        const storeId = item.getAttribute('data-store-id') || '';
        const quantityText = item.querySelector('.quantity, .stock-level')?.textContent?.trim() || '0';
        const quantity = parseInt(quantityText.replace(/\D/g, '')) || 0;

        return {
          productId,
          storeId,
          quantity,
        };
      }).filter((inv) => inv.storeId && inv.productId);
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
