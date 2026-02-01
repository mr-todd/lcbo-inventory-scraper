import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('inventory', (table) => {
    table.increments('id').primary();
    table.integer('productId').unsigned().notNullable();
    table.integer('storeId').unsigned().notNullable();
    table.integer('quantity').notNullable().defaultTo(0);
    table.timestamp('lastChecked').notNullable().defaultTo(knex.fn.now());
    table.timestamps(true, true);

    // Foreign keys
    table.foreign('productId').references('id').inTable('products').onDelete('CASCADE');
    table.foreign('storeId').references('id').inTable('stores').onDelete('CASCADE');

    // Composite unique index to prevent duplicate entries
    table.unique(['productId', 'storeId']);
    
    // Indexes for queries
    table.index('productId');
    table.index('storeId');
    table.index('lastChecked');
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('inventory');
}
