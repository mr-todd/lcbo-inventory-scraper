export interface ScrapedProduct {
  lcboId: string;
  name: string;
  category?: string;
  subCategory?: string;
  producer?: string;
  country?: string;
  region?: string;
  varietal?: string;
  vintage?: string;
  alcoholContent?: number;
  sugarContent?: string;
  volume?: number;
  price?: number;
  description?: string;
  imageUrl?: string;
  productUrl: string;
}

export interface ScrapedStore {
  lcboId: string;
  name: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

export interface ScrapedInventory {
  productId: string; // LCBO product ID
  storeId: string; // LCBO store ID
  quantity: number;
}

export interface ScrapeProgress {
  totalProducts: number;
  scrapedProducts: number;
  failedProducts: number;
  startTime: Date;
  lastUpdate: Date;
}
