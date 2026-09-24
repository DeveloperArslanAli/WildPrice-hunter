import { Platform } from '@wildprice/shared-types';

export interface RawProductData {
  platform: Platform;
  title: string;
  price: number;
  currency: string;
  shippingCost: number;
  productUrl: string;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  sellerName?: string;
  sellerUrl?: string;
  inStock: boolean;
  returnPolicy?: 'free' | 'paid' | 'none' | 'unknown';
  sellerAgeYears?: number;
  hasSsl?: boolean;
  brand?: string;
  description?: string;
}

export interface ScraperJobData {
  sessionId: string;
  inputType: 'url' | 'text' | 'image';
  url?: string;
  query?: string;
  category?: string;
  userId?: string;
}

/**
 * Base interface that all platform scrapers must implement.
 */
export interface BaseScraper {
  platform: Platform;

  /**
   * Search for a product by keyword query.
   * Returns up to 5 most relevant results.
   */
  searchByKeyword(query: string, category?: string): Promise<RawProductData[]>;

  /**
   * Fetch product details from a direct URL.
   * Used when the input URL is from this platform.
   */
  fetchByUrl?(url: string): Promise<RawProductData | null>;
}
