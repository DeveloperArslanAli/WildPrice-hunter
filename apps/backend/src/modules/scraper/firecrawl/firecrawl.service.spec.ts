import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirecrawlService } from './firecrawl.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { Platform } from '@wildprice/shared-types';

describe('FirecrawlService (Unit Tests)', () => {
  let service: FirecrawlService;
  let mockConfig: Partial<ConfigService>;
  let mockHttp: Partial<HttpService>;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'FIRECRAWL_API_KEY') return 'fc-test-api-key-12345';
        if (key === 'FIRECRAWL_API_URL') return 'https://api.firecrawl.dev';
        return null;
      }),
    };
    mockHttp = {
      post: vi.fn(),
      get: vi.fn(),
    };
    service = new FirecrawlService(mockConfig as ConfigService, mockHttp as HttpService);
  });

  it('should return true for isConfigured when API key is set', () => {
    expect(service.isConfigured()).toBe(true);
  });

  it('should return false for isConfigured when API key is missing', () => {
    const unconfigured = new FirecrawlService(
      { get: vi.fn().mockReturnValue(undefined) } as unknown as ConfigService,
      mockHttp as HttpService,
    );
    expect(unconfigured.isConfigured()).toBe(false);
  });

  it('should scrape a product URL and return normalized RawProductData', async () => {
    const mockResponse = {
      data: {
        success: true,
        data: {
          json: {
            title: 'Wireless Gaming Mouse',
            price: 49.99,
            currency: 'USD',
            shippingCost: 0,
            imageUrl: 'https://images.example.com/mouse.jpg',
            rating: 4.7,
            reviewCount: 1250,
            sellerName: 'Gaming Store Official',
            inStock: true,
            returnPolicy: 'free',
            brand: 'ProGear',
            description: 'Ultra-lightweight RGB gaming mouse',
          },
        },
      },
    };

    mockHttp.post = vi.fn().mockReturnValue(of(mockResponse));

    const result = await service.scrapeProductUrl(Platform.AMAZON, 'https://www.amazon.com/dp/B012345678');

    expect(result).toBeDefined();
    expect(result?.title).toBe('Wireless Gaming Mouse');
    expect(result?.price).toBe(49.99);
    expect(result?.platform).toBe(Platform.AMAZON);
    expect(result?.sellerName).toBe('Gaming Store Official');
    expect(result?.inStock).toBe(true);
    expect(result?.shippingCost).toBe(0);
  });

  it('should return null when scraping fails or throws an error', async () => {
    mockHttp.post = vi.fn().mockReturnValue(throwError(() => new Error('Firecrawl rate limit exceeded')));

    const result = await service.scrapeProductUrl(Platform.WALMART, 'https://www.walmart.com/ip/123456');
    expect(result).toBeNull();
  });

  it('should search marketplace and map structured results', async () => {
    const mockSearchResponse = {
      data: {
        success: true,
        data: [
          {
            url: 'https://www.ebay.com/itm/987654321',
            title: 'Mechanical Keyboard RGB',
            description: 'Brand new keyboard $69.99 with free shipping',
            json: {
              title: 'Mechanical Keyboard RGB',
              price: 69.99,
              currency: 'USD',
              shippingCost: 0,
              imageUrl: 'https://i.ebayimg.com/images/kb.jpg',
              rating: 4.8,
              reviewCount: 320,
              sellerName: 'TechDeals',
              inStock: true,
            },
          },
        ],
      },
    };

    mockHttp.post = vi.fn().mockReturnValue(of(mockSearchResponse));

    const results = await service.searchMarketplace(Platform.EBAY, 'mechanical keyboard', 'ebay.com', 5);

    expect(results.length).toBe(1);
    expect(results[0].title).toBe('Mechanical Keyboard RGB');
    expect(results[0].price).toBe(69.99);
    expect(results[0].platform).toBe(Platform.EBAY);
    expect(results[0].productUrl).toBe('https://www.ebay.com/itm/987654321');
  });

  it('should fallback to regex price extraction if json price is missing in search result', async () => {
    const mockSearchResponse = {
      data: {
        success: true,
        data: [
          {
            url: 'https://www.aliexpress.com/item/100500123.html',
            title: 'USB-C Fast Charger 65W GaN',
            description: 'Only $18.50 with international delivery',
          },
        ],
      },
    };

    mockHttp.post = vi.fn().mockReturnValue(of(mockSearchResponse));

    const results = await service.searchMarketplace(Platform.ALIEXPRESS, 'gan charger', 'aliexpress.com', 5);

    expect(results.length).toBe(1);
    expect(results[0].price).toBe(18.5);
    expect(results[0].platform).toBe(Platform.ALIEXPRESS);
  });
});
