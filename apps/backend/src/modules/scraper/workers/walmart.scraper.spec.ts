import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WalmartScraper } from './walmart.scraper';
import { FirecrawlService } from '../firecrawl/firecrawl.service';
import { Platform } from '@wildprice/shared-types';

describe('WalmartScraper', () => {
  let scraper: WalmartScraper;
  let mockFirecrawl: Partial<FirecrawlService>;

  beforeEach(() => {
    mockFirecrawl = {
      scrapeProductUrl: vi.fn(),
      searchMarketplace: vi.fn(),
    };
    scraper = new WalmartScraper(mockFirecrawl as FirecrawlService);
  });

  it('should have platform set to WALMART', () => {
    expect(scraper.platform).toBe(Platform.WALMART);
  });

  it('should parse and map Walmart search results successfully via Firecrawl', async () => {
    const mockResults = [
      {
        platform: Platform.WALMART,
        title: 'Wireless Bluetooth Earbuds',
        price: 29.99,
        currency: 'USD',
        shippingCost: 0,
        productUrl: 'https://walmart.com/ip/123456',
        imageUrl: 'https://walmart.com/img.jpg',
        rating: 4.5,
        reviewCount: 120,
        sellerName: 'Walmart.com',
        inStock: true,
        returnPolicy: 'free' as const,
      },
    ];

    mockFirecrawl.searchMarketplace = vi.fn().mockResolvedValue(mockResults);

    const results = await scraper.searchByKeyword('earbuds');
    expect(results.length).toBe(1);
    expect(results[0].platform).toBe(Platform.WALMART);
    expect(results[0].title).toBe('Wireless Bluetooth Earbuds');
    expect(results[0].price).toBe(29.99);
    expect(results[0].shippingCost).toBe(0);
    expect(results[0].returnPolicy).toBe('free');
  });

  it('should extract product id and fetch by url via Firecrawl', async () => {
    const mockProduct = {
      platform: Platform.WALMART,
      title: 'Sony Headphones WH-1000XM5',
      price: 348.0,
      currency: 'USD',
      shippingCost: 0,
      productUrl: 'https://www.walmart.com/ip/Sony-Headphones/987654321',
      imageUrl: 'https://walmart.com/sony.jpg',
      rating: 4.8,
      reviewCount: 850,
      sellerName: 'Walmart',
      inStock: true,
      returnPolicy: 'free' as const,
    };

    mockFirecrawl.scrapeProductUrl = vi.fn().mockResolvedValue(mockProduct);

    const res = await scraper.fetchByUrl('https://www.walmart.com/ip/Sony-Headphones/987654321');
    expect(res).toBeDefined();
    expect(res?.title).toBe('Sony Headphones WH-1000XM5');
    expect(res?.price).toBe(348.0);
    expect(res?.inStock).toBe(true);
    expect(res?.returnPolicy).toBe('free');
  });

  it('should return null when URL is not a valid Walmart product URL', async () => {
    const res = await scraper.fetchByUrl('https://www.walmart.com/help/account');
    expect(res).toBeNull();
  });
});
