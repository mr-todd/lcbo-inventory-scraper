import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('products', (table) => {
    table.increments('id').primary();
    table.string('lcboId', 50).notNullable().unique().index();
    table.string('name', 255).notNullable();
    table.string('category', 100);
    table.string('subCategory', 100);
    table.string('producer', 255);
    table.string('country', 100);
    table.string('region', 100);
    table.string('varietal', 100);
    table.string('vintage', 10);
    table.decimal('alcoholContent', 5, 2); // e.g., 13.50%
    table.string('sugarContent', 50);
    table.integer('volume'); // in mL
    table.integer('price'); // in cents
    table.text('description');
    table.string('imageUrl', 500);
    table.string('productUrl', 500);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('products');
}
