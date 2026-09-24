import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EbayScraper } from './ebay.scraper';
import { FirecrawlService } from '../firecrawl/firecrawl.service';
import { Platform } from '@wildprice/shared-types';

describe('EbayScraper (QA Test Suite)', () => {
  let scraper: EbayScraper;
  let mockFirecrawl: Partial<FirecrawlService>;

  beforeEach(() => {
    mockFirecrawl = {
      scrapeProductUrl: vi.fn(),
      searchMarketplace: vi.fn(),
    };
    scraper = new EbayScraper(mockFirecrawl as FirecrawlService);
  });

  it('should have platform set to EBAY', () => {
    expect(scraper.platform).toBe(Platform.EBAY);
  });

  it('should parse eBay search results via Firecrawl and extract prices cleanly', async () => {
    const mockResults = [
      {
        platform: Platform.EBAY,
        title: 'Apple iPad Air 5th Gen 64GB Space Gray',
        price: 459.99,
        currency: 'USD',
        shippingCost: 0,
        productUrl: 'https://www.ebay.com/itm/112233445566',
        imageUrl: 'https://i.ebayimg.com/ipad.jpg',
        rating: 4.9,
        reviewCount: 320,
        sellerName: 'top_rated_tech',
        inStock: true,
        returnPolicy: 'free' as const,
      },
    ];

    mockFirecrawl.searchMarketplace = vi.fn().mockResolvedValue(mockResults);

    const results = await scraper.searchByKeyword('ipad air');
    expect(results.length).toBe(1);
    expect(results[0].platform).toBe(Platform.EBAY);
    expect(results[0].title).toBe('Apple iPad Air 5th Gen 64GB Space Gray');
    expect(results[0].price).toBe(459.99);
    expect(results[0].shippingCost).toBe(0);
    expect(results[0].returnPolicy).toBe('free');
  });

  it('should extract item from valid eBay product URL via Firecrawl scrape', async () => {
    const mockItem = {
      platform: Platform.EBAY,
      title: 'Mechanical Keyboard RGB',
      price: 75.5,
      currency: 'USD',
      shippingCost: 4.99,
      productUrl: 'https://www.ebay.com/itm/443322110099',
      inStock: true,
      returnPolicy: 'none' as const,
    };

    mockFirecrawl.scrapeProductUrl = vi.fn().mockResolvedValue(mockItem);

    const res = await scraper.fetchByUrl('https://www.ebay.com/itm/Mechanical-Keyboard-RGB/443322110099?hash=1');
    expect(res).toBeDefined();
    expect(res?.price).toBe(75.5);
    expect(res?.shippingCost).toBe(4.99);
    expect(res?.returnPolicy).toBe('none');
  });

  it('should return null when URL is not a valid eBay item URL', async () => {
    const res = await scraper.fetchByUrl('https://www.ebay.com/help/buying');
    expect(res).toBeNull();
  });
});
