import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AmazonScraper } from './amazon.scraper';
import { FirecrawlService } from '../firecrawl/firecrawl.service';
import { Platform } from '@wildprice/shared-types';

describe('AmazonScraper (QA Test Suite)', () => {
  let scraper: AmazonScraper;
  let mockFirecrawl: Partial<FirecrawlService>;

  beforeEach(() => {
    mockFirecrawl = {
      scrapeProductUrl: vi.fn(),
      searchMarketplace: vi.fn(),
    };
    scraper = new AmazonScraper(mockFirecrawl as FirecrawlService);
  });

  it('should have platform set to AMAZON', () => {
    expect(scraper.platform).toBe(Platform.AMAZON);
  });

  it('should extract ASIN and fetch product details via Firecrawl structured scrape', async () => {
    const mockProduct = {
      platform: Platform.AMAZON,
      title: 'Sony WH-1000XM5 Wireless Noise Canceling Headphones',
      price: 398.0,
      currency: 'USD',
      shippingCost: 0,
      productUrl: 'https://www.amazon.com/dp/B09XS7JWHH',
      imageUrl: 'https://m.media-amazon.com/images/I/image.jpg',
      rating: 4.6,
      reviewCount: 10540,
      sellerName: 'Amazon.com',
      inStock: true,
      returnPolicy: 'free' as const,
    };

    mockFirecrawl.scrapeProductUrl = vi.fn().mockResolvedValue(mockProduct);

    const result = await scraper.fetchByUrl('https://www.amazon.com/dp/B09XS7JWHH?psc=1');
    expect(result).toBeDefined();
    expect(result?.platform).toBe(Platform.AMAZON);
    expect(result?.title).toBe('Sony WH-1000XM5 Wireless Noise Canceling Headphones');
    expect(result?.price).toBe(398.0);
    expect(result?.shippingCost).toBe(0);
    expect(result?.rating).toBe(4.6);
    expect(result?.reviewCount).toBe(10540);
    expect(result?.returnPolicy).toBe('free');
  });

  it('should return null when URL has no valid ASIN pattern', async () => {
    const result = await scraper.fetchByUrl('https://www.amazon.com/some-random-page');
    expect(result).toBeNull();
  });

  it('should search Amazon via Firecrawl searchMarketplace', async () => {
    const mockSearchResults = [
      {
        platform: Platform.AMAZON,
        title: 'Anker Soundcore Space One',
        price: 99.99,
        currency: 'USD',
        shippingCost: 0,
        productUrl: 'https://www.amazon.com/dp/B0C6V9LNZ3',
        imageUrl: 'https://m.media-amazon.com/images/I/anker.jpg',
        rating: 4.4,
        reviewCount: 2300,
        sellerName: 'Amazon',
        inStock: true,
        returnPolicy: 'free' as const,
      },
    ];

    mockFirecrawl.searchMarketplace = vi.fn().mockResolvedValue(mockSearchResults);

    const results = await scraper.searchByKeyword('anker headphones');
    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Anker Soundcore Space One');
    expect(results[0].price).toBe(99.99);
    expect(results[0].platform).toBe(Platform.AMAZON);
    expect(mockFirecrawl.searchMarketplace).toHaveBeenCalledWith(
      Platform.AMAZON,
      'anker headphones',
      'amazon.com',
      5,
    );
  });
});
