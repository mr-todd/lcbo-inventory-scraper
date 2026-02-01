import { Model } from 'objection';
import type { Inventory } from './Inventory.js';

export class Product extends Model {
  static tableName = 'products';

  id!: number;
  lcboId!: string; // LCBO's internal product ID
  name!: string;
  category?: string;
  subCategory?: string;
  producer?: string;
  country?: string;
  region?: string;
  varietal?: string;
  vintage?: string;
  alcoholContent?: number;
  sugarContent?: string;
  volume?: number; // in mL
  price?: number; // in cents
  description?: string;
  imageUrl?: string;
  productUrl?: string;
  createdAt!: Date;
  updatedAt!: Date;

  // Relations
  inventory?: Inventory[];

  static get relationMappings() {
    return {
      inventory: {
        relation: Model.HasManyRelation,
        modelClass: `${__dirname}/Inventory.js`,
        join: {
          from: 'products.id',
          to: 'inventory.productId',
        },
      },
    };
  }
}
