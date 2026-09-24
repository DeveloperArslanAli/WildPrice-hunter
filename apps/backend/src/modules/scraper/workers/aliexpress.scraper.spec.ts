import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AliExpressScraper } from './aliexpress.scraper';
import { FirecrawlService } from '../firecrawl/firecrawl.service';
import { Platform } from '@wildprice/shared-types';

describe('AliExpressScraper (QA Test Suite)', () => {
  let scraper: AliExpressScraper;
  let mockFirecrawl: Partial<FirecrawlService>;

  beforeEach(() => {
    mockFirecrawl = {
      scrapeProductUrl: vi.fn(),
      searchMarketplace: vi.fn(),
    };
    scraper = new AliExpressScraper(mockFirecrawl as FirecrawlService);
  });

  it('should have platform set to ALIEXPRESS', () => {
    expect(scraper.platform).toBe(Platform.ALIEXPRESS);
  });

  it('should search AliExpress via Firecrawl searchMarketplace', async () => {
    const mockResults = [
      {
        platform: Platform.ALIEXPRESS,
        title: 'Silicone Shockproof Phone Case For iPhone 15',
        price: 3.49,
        currency: 'USD',
        shippingCost: 0,
        productUrl: 'https://www.aliexpress.com/item/1005005999888.html',
        imageUrl: 'https://ae01.alicdn.com/case.jpg',
        rating: 4.7,
        reviewCount: 1420,
        sellerName: 'Factory Direct Store',
        inStock: true,
        returnPolicy: 'paid' as const,
      },
    ];

    mockFirecrawl.searchMarketplace = vi.fn().mockResolvedValue(mockResults);

    const results = await scraper.searchByKeyword('iphone case');
    expect(results.length).toBe(1);
    expect(results[0].platform).toBe(Platform.ALIEXPRESS);
    expect(results[0].title).toBe('Silicone Shockproof Phone Case For iPhone 15');
    expect(results[0].price).toBe(3.49);
    expect(results[0].shippingCost).toBe(0);
    expect(results[0].returnPolicy).toBe('paid');
  });

  it('should fetch product by direct AliExpress URL via Firecrawl scrape', async () => {
    const mockProduct = {
      platform: Platform.ALIEXPRESS,
      title: 'Universal Magnetic Car Phone Holder',
      price: 4.99,
      currency: 'USD',
      shippingCost: 0,
      productUrl: 'https://www.aliexpress.com/item/1005006123456.html',
      inStock: true,
      returnPolicy: 'paid' as const,
    };

    mockFirecrawl.scrapeProductUrl = vi.fn().mockResolvedValue(mockProduct);

    const result = await scraper.fetchByUrl('https://www.aliexpress.com/item/1005006123456.html');
    expect(result).toBeDefined();
    expect(result?.title).toBe('Universal Magnetic Car Phone Holder');
    expect(result?.price).toBe(4.99);
    expect(result?.platform).toBe(Platform.ALIEXPRESS);
  });

  it('should return null when URL is not a valid AliExpress URL', async () => {
    const result = await scraper.fetchByUrl('https://www.amazon.com/dp/B0123');
    expect(result).toBeNull();
  });
});
