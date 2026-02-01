import { LCBOScraper } from './scraper/index.js';
import { logger } from './utils/logger.js';

async function main() {
  logger.info('LCBO Inventory Scraper started');
  
  const scraper = new LCBOScraper();
  await scraper.run();
  
  logger.info('Scraper finished');
  process.exit(0);
}

main().catch((error) => {
  logger.error('Fatal error:', error);
  process.exit(1);
});
