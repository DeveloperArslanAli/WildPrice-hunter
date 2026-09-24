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

export interface BaseScraper {
  platform: Platform;
  searchByKeyword(query: string, originalImageUrl?: string): Promise<RawProductData[]>;
  fetchByUrl?(url: string): Promise<RawProductData | null>;
}
