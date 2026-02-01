import { Model } from 'objection';
import type { Product } from './Product.js';
import type { Store } from './Store.js';

export class Inventory extends Model {
  static tableName = 'inventory';

  id!: number;
  productId!: number;
  storeId!: number;
  quantity!: number;
  lastChecked!: Date;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  product?: Product;
  store?: Store;

  static get relationMappings() {
    return {
      product: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Product.js`,
        join: {
          from: 'inventory.productId',
          to: 'products.id',
        },
      },
      store: {
        relation: Model.BelongsToOneRelation,
        modelClass: `${__dirname}/Store.js`,
        join: {
          from: 'inventory.storeId',
          to: 'stores.id',
        },
      },
    };
  }
}
