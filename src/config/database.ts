import { Knex, knex } from 'knex';
import { Model } from 'objection';
import dotenv from 'dotenv';

dotenv.config();

const knexConfig: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'lcbo_scraper',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    directory: './src/migrations',
  },
};

export const db = knex(knexConfig);

// Bind Objection models to Knex instance
Model.knex(db);

export default db;
