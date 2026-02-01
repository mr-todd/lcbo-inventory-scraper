# Architecture Documentation

## Overview

LCBO Inventory Scraper is a production-ready web scraper built with Node.js, TypeScript, and Puppeteer to extract comprehensive product and inventory data from the LCBO website.

## Technology Stack

### Core
- **Node.js** (v18+) - JavaScript runtime
- **TypeScript** (v5+) - Type safety and developer experience
- **ESM** - Modern JavaScript modules

### Database
- **MySQL** - Relational database for structured data
- **Knex** - Query builder and migration tool
- **Objection ORM** - Active record pattern with relations

### Web Scraping
- **Puppeteer** - Headless Chrome automation
- **Chrome/Chromium** - Browser engine

### Utilities
- **dotenv** - Environment configuration
- **tsx** - TypeScript execution for development

## Project Structure

```
lcbo-inventory-scraper/
├── src/
│   ├── config/
│   │   └── database.ts          # Database connection & Objection setup
│   ├── models/
│   │   ├── Product.ts            # Product model with relations
│   │   ├── Store.ts              # Store model with relations
│   │   ├── Inventory.ts          # Inventory model (join table)
│   │   └── index.ts              # Model exports
│   ├── migrations/
│   │   ├── 001_create_products.ts
│   │   ├── 002_create_stores.ts
│   │   └── 003_create_inventory.ts
│   ├── scraper/
│   │   ├── productScraper.ts     # Core scraping logic
│   │   └── index.ts              # Orchestration & persistence
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces
│   ├── utils/
│   │   ├── browser.ts            # Puppeteer management
│   │   └── logger.ts             # Logging utilities
│   └── index.ts                  # Application entry point
├── scripts/
│   └── setup-database.sql        # DB initialization
├── dist/                          # Compiled JavaScript
├── .env                           # Environment variables (git-ignored)
├── .env.example                   # Environment template
├── package.json                   # Dependencies & scripts
├── tsconfig.json                  # TypeScript configuration
├── knexfile.ts                    # Knex configuration
└── README.md                      # User documentation
```

## Database Schema

### Products Table
Primary entity storing LCBO product information.

**Columns:**
- `id` (PK) - Auto-increment primary key
- `lcboId` (UNIQUE) - LCBO's product identifier
- `name` - Product name
- `category` - Main category (Wine, Beer, Spirits)
- `subCategory` - Subcategory
- `producer` - Manufacturer/winery
- `country` - Country of origin
- `region` - Wine region
- `varietal` - Grape variety
- `vintage` - Year
- `alcoholContent` - Percentage (decimal)
- `sugarContent` - Sugar descriptor
- `volume` - Container size in mL
- `price` - Price in cents
- `description` - Full description
- `imageUrl` - Product image URL
- `productUrl` - LCBO product page URL
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- Primary key on `id`
- Unique index on `lcboId`

### Stores Table
LCBO retail locations.

**Columns:**
- `id` (PK) - Auto-increment primary key
- `lcboId` (UNIQUE) - LCBO's store identifier
- `name` - Store name
- `address` - Street address
- `city` - City
- `province` - Province code (ON)
- `postalCode` - Postal code
- `phone` - Contact number
- `latitude`, `longitude` - Geographic coordinates
- `createdAt`, `updatedAt` - Timestamps

**Indexes:**
- Primary key on `id`
- Unique index on `lcboId`

### Inventory Table
Many-to-many relationship between products and stores with quantity.

**Columns:**
- `id` (PK) - Auto-increment primary key
- `productId` (FK) - References `products.id`
- `storeId` (FK) - References `stores.id`
- `quantity` - Stock level
- `lastChecked` - Last scrape timestamp
- `createdAt`, `updatedAt` - Timestamps

**Constraints:**
- Foreign key to `products` (CASCADE on delete)
- Foreign key to `stores` (CASCADE on delete)
- Unique composite index on `(productId, storeId)`

**Indexes:**
- Primary key on `id`
- Index on `productId`
- Index on `storeId`
- Index on `lastChecked`

## Scraping Flow

### 1. Discovery Phase
**Method:** `ProductScraper.searchAllProducts()`

1. Navigate to LCBO search results (all products)
2. Wait for initial product cards to render
3. Scroll page to trigger lazy-loading
4. Extract all product URLs
5. Return array of URLs to process

### 2. Product Scraping Phase
**Method:** `ProductScraper.scrapeProductDetails(url)`

For each product URL:
1. Navigate to product page
2. Wait for main content to load
3. Extract product details using DOM selectors
4. Parse and normalize data types
5. Return structured product object

### 3. Inventory Scraping Phase
**Method:** `ProductScraper.scrapeInventory(url)`

For each product:
1. Click "Check Availability in All Stores"
2. Wait for store list to render
3. Extract store ID and quantity for each location
4. Return array of inventory records

### 4. Persistence Phase
**Method:** `LCBOScraper.run()`

1. Save/update product in database (upsert)
2. Get or create store records
3. Upsert inventory records with conflict resolution
4. Track progress and errors

## Error Handling

### Network Errors
- Automatic retry with exponential backoff (future enhancement)
- Timeout handling (60s page load, 30s selectors)
- Graceful degradation on missing elements

### Data Validation
- Type checking via TypeScript
- Database constraints (UNIQUE, NOT NULL, FK)
- Null handling for optional fields

### Logging
- Structured logging with timestamps
- Log levels: INFO, WARN, ERROR, DEBUG
- Progress tracking with metrics

## Rate Limiting & Ethics

### Respectful Scraping
- Configurable delay between requests (default: 2000ms)
- Single concurrent browser instance
- User-agent identification
- Obeys robots.txt (future enhancement)

### Performance Optimization
- Connection pooling (min: 2, max: 10)
- Browser instance reuse
- Batch database operations (upsert)
- Lazy loading awareness

## Configuration

### Environment Variables

**Database:**
- `DB_HOST` - MySQL host
- `DB_PORT` - MySQL port (default: 3306)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

**Scraper:**
- `HEADLESS` - Run browser headless (true/false)
- `SCRAPE_DELAY_MS` - Delay between requests (milliseconds)
- `USER_AGENT` - Browser user agent string
- `LOG_LEVEL` - Logging verbosity (info/debug/error)

## Security Considerations

### Credentials
- ✅ Environment variables for DB credentials
- ✅ `.env` in `.gitignore`
- ✅ `.env.example` template provided

### SQL Injection Prevention
- ✅ Objection ORM query builder (parameterized)
- ✅ No raw SQL queries with user input
- ✅ Database type validation

### XSS Prevention
- ✅ No user-generated content rendering
- ✅ Data sanitization in database layer

## Future Enhancements

### Features
- [ ] Delta scraping (only changed products)
- [ ] Parallel product scraping
- [ ] Store location geocoding
- [ ] Historical inventory tracking
- [ ] API endpoint for querying data
- [ ] Price change alerts
- [ ] Product availability notifications

### Technical
- [ ] Docker containerization
- [ ] CI/CD pipeline
- [ ] Automated testing (Jest)
- [ ] Prometheus metrics
- [ ] Sentry error tracking
- [ ] GraphQL API

## Performance Metrics

Expected performance (approximate):
- **Discovery:** 2-5 minutes for all products
- **Per-product scrape:** 3-5 seconds (with 2s delay)
- **Full catalog:** 8-12 hours (depending on catalog size)
- **Database size:** ~500MB for full catalog with inventory

## Deployment

### Prerequisites
- Node.js 18+
- MySQL 8.0+
- Chrome/Chromium (installed by Puppeteer)
- 2GB RAM minimum
- 5GB disk space

### Steps
1. Clone repository
2. `npm install`
3. Configure `.env`
4. Run `npm run db:setup`
5. Run `npm run migrate`
6. Run `npm run scrape`

## Maintenance

### Regular Tasks
- Monitor scraper logs
- Review failed products
- Update selectors if LCBO changes DOM
- Vacuum/optimize database monthly
- Review and update dependencies

### Monitoring
- Check disk space (database growth)
- Monitor scrape completion rate
- Track error rates
- Validate data quality samples

## License

MIT - See LICENSE file
