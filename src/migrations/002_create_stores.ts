import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('stores', (table) => {
    table.increments('id').primary();
    table.string('lcboId', 50).notNullable().unique().index();
    table.string('name', 255).notNullable();
    table.string('address', 255);
    table.string('city', 100);
    table.string('province', 50);
    table.string('postalCode', 20);
    table.string('phone', 20);
    table.decimal('latitude', 10, 7);
    table.decimal('longitude', 10, 7);
    table.timestamps(true, true);
  });
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTableIfExists('stores');
}
