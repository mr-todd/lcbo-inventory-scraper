-- LCBO Scraper Database Setup Script

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS lcbo_scraper CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Use the database
USE lcbo_scraper;

-- Grant privileges (adjust username as needed)
-- GRANT ALL PRIVILEGES ON lcbo_scraper.* TO 'your_user'@'localhost';
-- FLUSH PRIVILEGES;

-- Show success message
SELECT 'Database lcbo_scraper created successfully!' AS status;
