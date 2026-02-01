# LCBO Inventory Scraper

Comprehensive scraper for LCBO product catalog and store-by-store inventory data.

## Tech Stack

- **Node.js + TypeScript** - Type-safe development
- **Objection ORM + Knex** - Database abstraction and migrations
- **Puppeteer** - Headless Chrome browser automation
- **MySQL** - Relational data storage

## Features

- ✅ Scrapes ALL products from LCBO catalog
- ✅ Extracts comprehensive product information
- ✅ Records store-by-store inventory levels
- ✅ Clean, modular, secure code architecture
- ✅ Database migrations and ORM models
- ✅ Rate limiting and error handling
- ✅ Progress tracking and logging

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Database

Create a MySQL database:

```sql
CREATE DATABASE lcbo_scraper;
```

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your database credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lcbo_scraper
DB_USER=root
DB_PASSWORD=your_password

HEADLESS=true
SCRAPE_DELAY_MS=1000
LOG_LEVEL=info
```

### 3. Run Migrations

```bash
npm run migrate
```

## Usage

### Run the scraper

```bash
npm run scrape
```

Or in development mode with auto-reload:

```bash
npm run dev
```

### Build for production

```bash
npm run build
npm start
```

## Database Schema

### Products
- Comprehensive product details (name, category, producer, etc.)
- Pricing and volume information
- Product attributes (alcohol content, vintage, varietal)

### Stores
- Store location information
- Contact details
- Geographic coordinates

### Inventory
- Product-to-store mapping
- Quantity levels
- Last checked timestamp

## Architecture

```
src/
├── config/         # Database connection
├── models/         # Objection ORM models
├── migrations/     # Database migrations
├── scraper/        # Scraping logic
│   ├── index.ts           # Main orchestrator
│   └── productScraper.ts  # Product scraping logic
├── types/          # TypeScript type definitions
└── utils/          # Utilities (browser, logger)
```

## Rate Limiting

The scraper implements rate limiting to be respectful to LCBO servers:
- Configurable delay between requests (default: 1000ms)
- Progress tracking and logging
- Error handling and retry logic

## License

MIT
