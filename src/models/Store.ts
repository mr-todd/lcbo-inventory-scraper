import { Model } from 'objection';
import type { Inventory } from './Inventory.js';

export class Store extends Model {
  static tableName = 'stores';

  id!: number;
  lcboId!: string; // LCBO's internal store ID
  name!: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
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
          from: 'stores.id',
          to: 'inventory.storeId',
        },
      },
    };
  }
}
