import dotenv from 'dotenv';
import { BrowserManager } from '../utils/browser.js';
import { ProductScraper } from './productScraper.js';
import { Product, Store, Inventory } from '../models/index.js';
import { logger } from '../utils/logger.js';
import db from '../config/database.js';
import type { ScrapeProgress } from '../types/index.js';

dotenv.config();

export class LCBOScraper {
  private browserManager: BrowserManager;
  private progress: ScrapeProgress;

  constructor() {
    this.browserManager = new BrowserManager();
    this.progress = {
      totalProducts: 0,
      scrapedProducts: 0,
      failedProducts: 0,
      startTime: new Date(),
      lastUpdate: new Date(),
    };
  }

  async run(): Promise<void> {
    try {
      logger.info('Starting LCBO scraper...');
      
      // Initialize browser
      await this.browserManager.init();

      // Create new page
      const page = await this.browserManager.newPage();
      const scraper = new ProductScraper(page);

      // Step 1: Get all product URLs
      logger.info('Step 1: Discovering all products...');
      const productUrls = await scraper.searchAllProducts();
      this.progress.totalProducts = productUrls.length;

      logger.info(`Found ${productUrls.length} products to scrape`);

      // Step 2: Scrape each product
      for (let i = 0; i < productUrls.length; i++) {
        const productUrl = productUrls[i];
        
        try {
          logger.info(`Processing product ${i + 1}/${productUrls.length}`);

          // Scrape product details
          const productData = await scraper.scrapeProductDetails(productUrl);
          
          if (!productData) {
            this.progress.failedProducts++;
            continue;
          }

          // Save product to database
          const product = await this.saveProduct(productData);

          // Scrape and save inventory
          const inventoryData = await scraper.scrapeInventory(productUrl);
          await this.saveInventory(product.id, inventoryData);

          this.progress.scrapedProducts++;
          this.progress.lastUpdate = new Date();
          
          // Progress update
          if (this.progress.scrapedProducts % 10 === 0) {
            this.logProgress();
          }

          // Rate limiting delay
          await this.delay(parseInt(process.env.SCRAPE_DELAY_MS || '1000'));

        } catch (error) {
          logger.error(`Error processing product ${productUrl}:`, error);
          this.progress.failedProducts++;
        }
      }

      logger.info('Scraping completed!');
      this.logProgress();

    } catch (error) {
      logger.error('Fatal error in scraper:', error);
      throw error;
    } finally {
      // Clean up
      await this.browserManager.close();
      await db.destroy();
    }
  }

  private async saveProduct(productData: any): Promise<Product> {
    try {
      // Check if product already exists
      const existing = await Product.query().findOne({ lcboId: productData.lcboId });

      if (existing) {
        // Update existing product
        return await existing.$query().patchAndFetch(productData);
      } else {
        // Create new product
        return await Product.query().insert(productData);
      }
    } catch (error) {
      logger.error('Error saving product:', error);
      throw error;
    }
  }

  private async saveInventory(productId: number, inventoryData: any[]): Promise<void> {
    try {
      for (const inv of inventoryData) {
        // Get or create store
        const store = await this.getOrCreateStore(inv.storeId);

        // Upsert inventory record
        await Inventory.query()
          .insert({
            productId,
            storeId: store.id,
            quantity: inv.quantity,
            lastChecked: new Date(),
          })
          .onConflict(['productId', 'storeId'])
          .merge(['quantity', 'lastChecked', 'updatedAt']);
      }
    } catch (error) {
      logger.error('Error saving inventory:', error);
    }
  }

  private async getOrCreateStore(lcboId: string): Promise<Store> {
    let store = await Store.query().findOne({ lcboId });

    if (!store) {
      // Create placeholder store (will be filled in later)
      store = await Store.query().insert({
        lcboId,
        name: `Store ${lcboId}`,
      });
    }

    return store;
  }

  private logProgress(): void {
    const elapsed = Date.now() - this.progress.startTime.getTime();
    const rate = this.progress.scrapedProducts / (elapsed / 1000 / 60); // per minute

    logger.info('Progress:', {
      total: this.progress.totalProducts,
      scraped: this.progress.scrapedProducts,
      failed: this.progress.failedProducts,
      remaining: this.progress.totalProducts - this.progress.scrapedProducts - this.progress.failedProducts,
      ratePerMin: rate.toFixed(2),
      elapsedMin: (elapsed / 1000 / 60).toFixed(2),
    });
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Run scraper if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const scraper = new LCBOScraper();
  scraper.run().catch((error) => {
    logger.error('Scraper failed:', error);
    process.exit(1);
  });
}
