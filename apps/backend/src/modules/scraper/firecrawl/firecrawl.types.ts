import { Platform } from '@wildprice/shared-types';

export interface FirecrawlProductExtracted {
  title?: string;
  price?: number;
  currency?: string;
  shippingCost?: number;
  imageUrl?: string;
  rating?: number;
  reviewCount?: number;
  sellerName?: string;
  sellerUrl?: string;
  inStock?: boolean;
  returnPolicy?: 'free' | 'paid' | 'none' | 'unknown';
  brand?: string;
  description?: string;
}

export const ProductExtractSchema = {
  type: 'object',
  properties: {
    title: {
      type: 'string',
      description: 'The full official product title',
    },
    price: {
      type: 'number',
      description: 'The current purchase price as a clean decimal number (e.g. 29.99)',
    },
    currency: {
      type: 'string',
      description: 'The three-letter ISO currency code, typically USD',
      default: 'USD',
    },
    shippingCost: {
      type: 'number',
      description: 'Shipping cost in USD, 0 if free shipping or not specified',
      default: 0,
    },
    imageUrl: {
      type: 'string',
      description: 'Direct high-resolution URL to the primary product image',
    },
    rating: {
      type: 'number',
      description: 'Average customer rating out of 5 (e.g. 4.6)',
    },
    reviewCount: {
      type: 'number',
      description: 'Total number of customer ratings or reviews',
    },
    sellerName: {
      type: 'string',
      description: 'The name of the selling store, brand, or third-party merchant',
    },
    inStock: {
      type: 'boolean',
      description: 'Whether the item is currently in stock and available for purchase',
      default: true,
    },
    returnPolicy: {
      type: 'string',
      enum: ['free', 'paid', 'none', 'unknown'],
      description: 'Return policy terms: free, paid, none, or unknown',
      default: 'free',
    },
    brand: {
      type: 'string',
      description: 'Brand or manufacturer of the product',
    },
    description: {
      type: 'string',
      description: 'A brief 1-2 sentence description of the product',
    },
  },
  required: ['title', 'price'],
};

export interface FirecrawlScrapeResponse {
  success?: boolean;
  data?: {
    json?: FirecrawlProductExtracted;
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      sourceURL?: string;
      statusCode?: number;
      ogImage?: string;
    };
  };
  error?: string;
}

export interface FirecrawlSearchResultItem {
  url?: string;
  title?: string;
  description?: string;
  markdown?: string;
  json?: FirecrawlProductExtracted;
  metadata?: {
    title?: string;
    description?: string;
    sourceURL?: string;
    ogImage?: string;
  };
}

export interface FirecrawlSearchResponse {
  success?: boolean;
  data?: FirecrawlSearchResultItem[];
  error?: string;
}
