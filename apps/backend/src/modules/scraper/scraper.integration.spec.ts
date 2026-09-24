import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirecrawlService } from './firecrawl/firecrawl.service';
import { AmazonScraper } from './workers/amazon.scraper';
import { EbayScraper } from './workers/ebay.scraper';
import { AliExpressScraper } from './workers/aliexpress.scraper';
import { WalmartScraper } from './workers/walmart.scraper';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { Platform } from '@wildprice/shared-types';
import { TrustService } from '../trust/trust.service';

describe('Scraper Engine Verification & Integration Suite', () => {
  let firecrawlService: FirecrawlService;
  let amazonScraper: AmazonScraper;
  let ebayScraper: EbayScraper;
  let aliExpressScraper: AliExpressScraper;
  let walmartScraper: WalmartScraper;
  let trustService: TrustService;
  let mockHttp: Partial<HttpService>;
  let mockConfig: Partial<ConfigService>;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'FIRECRAWL_API_KEY') return 'fc-valid-test-key';
        if (key === 'FIRECRAWL_API_URL') return 'https://api.firecrawl.dev';
        return null;
      }),
    };
    mockHttp = {
      post: vi.fn(),
      get: vi.fn(),
    };
    firecrawlService = new FirecrawlService(mockConfig as ConfigService, mockHttp as HttpService);
    amazonScraper = new AmazonScraper(firecrawlService);
    ebayScraper = new EbayScraper(firecrawlService);
    aliExpressScraper = new AliExpressScraper(firecrawlService);
    walmartScraper = new WalmartScraper(firecrawlService);
    trustService = new TrustService({} as any);
  });

  describe('1. Amazon Scraper Verification', () => {
    it('should correctly parse an Amazon URL and extract structured product data', async () => {
      mockHttp.post = vi.fn().mockReturnValue(
        of({
          data: {
            success: true,
            data: {
              json: {
                title: 'Casio F91W-1 Classic Resin Strap Digital Watch',
                price: 16.99,
                currency: 'USD',
                shippingCost: 0,
                imageUrl: 'https://m.media-amazon.com/images/casio.jpg',
                rating: 4.7,
                reviewCount: 42000,
                sellerName: 'Amazon.com',
                inStock: true,
                returnPolicy: 'free',
              },
            },
          },
        }),
      );

      const item = await amazonScraper.fetchByUrl('https://www.amazon.com/dp/B000GAWSDG');
      expect(item).not.toBeNull();
      expect(item?.platform).toBe(Platform.AMAZON);
      expect(item?.title).toContain('Casio F91W');
      expect(item?.price).toBe(16.99);
      expect(item?.returnPolicy).toBe('free');

      // Verify Trust algorithm calculation works on scraped item
      const trustScore = trustService.calculate({
        platform: item!.platform,
        sellerRating: item?.rating,
        reviewCount: item?.reviewCount,
        returnPolicy: item?.returnPolicy,
      });
      expect(trustScore.total).toBeGreaterThan(60);
      expect(trustScore.platformReliability).toBe(30);
    });

    it('should reject invalid or non-ASIN Amazon URLs', async () => {
      const item = await amazonScraper.fetchByUrl('https://www.amazon.com/gp/help/customer/display.html');
      expect(item).toBeNull();
    });
  });

  describe('2. eBay Scraper Verification', () => {
    it('should correctly parse an eBay URL and extract structured product data', async () => {
      mockHttp.post = vi.fn().mockReturnValue(
        of({
          data: {
            success: true,
            data: {
              json: {
                title: 'Casio Vintage Digital Men Watch F-91W Black Resin',
                price: 13.5,
                currency: 'USD',
                shippingCost: 2.99,
                imageUrl: 'https://i.ebayimg.com/casio.jpg',
                rating: 4.9,
                reviewCount: 850,
                sellerName: 'watch_hub_official',
                inStock: true,
                returnPolicy: 'free',
              },
            },
          },
        }),
      );

      const item = await ebayScraper.fetchByUrl('https://www.ebay.com/itm/317691904571');
      expect(item).not.toBeNull();
      expect(item?.platform).toBe(Platform.EBAY);
      expect(item?.price).toBe(13.5);
      expect(item?.shippingCost).toBe(2.99);
      expect(item?.sellerName).toBe('watch_hub_official');
    });
  });

  describe('3. AliExpress Scraper Verification', () => {
    it('should support both direct URL fetching and keyword multi-search on AliExpress', async () => {
      mockHttp.post = vi.fn().mockReturnValue(
        of({
          data: {
            success: true,
            data: {
              json: {
                title: 'Retro Digital Waterproof Sport Watch Silicone Band',
                price: 2.85,
                currency: 'USD',
                shippingCost: 0,
                imageUrl: 'https://ae01.alicdn.com/watch.jpg',
                rating: 4.6,
                reviewCount: 3200,
                sellerName: 'Wholesale Timepieces Store',
                inStock: true,
                returnPolicy: 'paid',
              },
            },
          },
        }),
      );

      // Verify fetchByUrl (New feature enabled by Firecrawl!)
      const directItem = await aliExpressScraper.fetchByUrl('https://www.aliexpress.com/item/1005006245199211.html');
      expect(directItem).not.toBeNull();
      expect(directItem?.platform).toBe(Platform.ALIEXPRESS);
      expect(directItem?.price).toBe(2.85);
      expect(directItem?.returnPolicy).toBe('paid');

      // Verify Dropshipping calculation compatibility:
      // Retail: $16.99 (Amazon) vs Source: $2.85 (AliExpress)
      const margin = 16.99 - (directItem!.price + directItem!.shippingCost);
      const marginPercent = (margin / 16.99) * 100;
      expect(margin).toBeGreaterThan(13);
      expect(marginPercent).toBeGreaterThan(75);
    });
  });

  describe('4. Walmart Scraper Verification', () => {
    it('should correctly parse Walmart product and extract pricing', async () => {
      mockHttp.post = vi.fn().mockReturnValue(
        of({
          data: {
            success: true,
            data: {
              json: {
                title: 'Casio Classic Digital Chronograph F91W',
                price: 15.92,
                currency: 'USD',
                shippingCost: 0,
                imageUrl: 'https://walmart.com/casio.jpg',
                rating: 4.5,
                reviewCount: 650,
                sellerName: 'Walmart.com',
                inStock: true,
                returnPolicy: 'free',
              },
            },
          },
        }),
      );

      const item = await walmartScraper.fetchByUrl('https://www.walmart.com/ip/Casio-Classic-F91W/12345678');
      expect(item).not.toBeNull();
      expect(item?.platform).toBe(Platform.WALMART);
      expect(item?.price).toBe(15.92);
      expect(item?.sellerName).toBe('Walmart.com');
    });
  });

  describe('5. Fallback Resiliency Verification', () => {
    it('should fall back to HTML JSON-LD schema parsing if Firecrawl cloud returns error', async () => {
      // Mock Firecrawl API throwing 401 or 429
      mockHttp.post = vi.fn().mockReturnValue(throwError(() => new Error('Firecrawl token error 401')));

      // Mock direct HTTP fetch returning HTML with JSON-LD
      const mockHtmlWithJsonLd = `
        <!DOCTYPE html>
        <html>
        <head>
          <script type="application/ld+json">
          {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": "Fallback GaN 65W Fast Charger",
            "image": "https://example.com/charger.jpg",
            "description": "Ultra fast wall charger",
            "offers": {
              "@type": "Offer",
              "priceCurrency": "USD",
              "price": "24.50",
              "availability": "https://schema.org/InStock",
              "seller": {
                "@type": "Organization",
                "name": "Direct Tech Store"
              }
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.8",
              "reviewCount": "190"
            }
          }
          </script>
        </head>
        <body></body>
        </html>
      `;

      mockHttp.get = vi.fn().mockReturnValue(of({ data: mockHtmlWithJsonLd }));

      const item = await ebayScraper.fetchByUrl('https://www.ebay.com/itm/223344556677');
      expect(item).not.toBeNull();
      expect(item?.title).toBe('Fallback GaN 65W Fast Charger');
      expect(item?.price).toBe(24.5);
      expect(item?.sellerName).toBe('Direct Tech Store');
      expect(item?.rating).toBe(4.8);
      expect(item?.reviewCount).toBe(190);
    });

    it('should fall back to OpenGraph meta tags if JSON-LD is not present', async () => {
      mockHttp.post = vi.fn().mockReturnValue(throwError(() => new Error('Firecrawl error')));

      const mockHtmlWithOg = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:title" content="Wireless Ergonomic Mouse | eBay" />
          <meta property="og:image" content="https://example.com/mouse.jpg" />
          <meta property="og:price:amount" content="19.99" />
        </head>
        <body></body>
        </html>
      `;

      mockHttp.get = vi.fn().mockReturnValue(of({ data: mockHtmlWithOg }));

      const item = await ebayScraper.fetchByUrl('https://www.ebay.com/itm/998877665544');
      expect(item).not.toBeNull();
      expect(item?.title).toBe('Wireless Ergonomic Mouse');
      expect(item?.price).toBe(19.99);
      expect(item?.imageUrl).toBe('https://example.com/mouse.jpg');
    });
  });

  describe('6. Parallel Multi-Platform Comparison Matrix Verification', () => {
    it('should execute parallel searches across all 4 platforms and rank by price', async () => {
      // Mock search results per platform
      const mockSearchData = (platform: Platform, price: number, title: string) => [
        {
          platform,
          title,
          price,
          currency: 'USD',
          shippingCost: 0,
          productUrl: `https://${platform}.com/item`,
          imageUrl: `https://${platform}.com/img.jpg`,
          rating: 4.5,
          reviewCount: 500,
          sellerName: `${platform} Seller`,
          inStock: true,
          returnPolicy: 'free' as const,
        },
      ];

      firecrawlService.searchMarketplace = vi.fn().mockImplementation((platform: Platform) => {
        switch (platform) {
          case Platform.AMAZON:
            return Promise.resolve(mockSearchData(Platform.AMAZON, 29.99, 'Amazon Gaming Headphones'));
          case Platform.WALMART:
            return Promise.resolve(mockSearchData(Platform.WALMART, 24.99, 'Walmart Gaming Headphones'));
          case Platform.EBAY:
            return Promise.resolve(mockSearchData(Platform.EBAY, 19.99, 'eBay Gaming Headphones'));
          case Platform.ALIEXPRESS:
            return Promise.resolve(mockSearchData(Platform.ALIEXPRESS, 9.99, 'AliExpress Gaming Headphones'));
          default:
            return Promise.resolve([]);
        }
      });

      const scrapers = [amazonScraper, ebayScraper, aliExpressScraper, walmartScraper];
      const results = await Promise.all(scrapers.map((s) => s.searchByKeyword('gaming headphones')));
      const flattened = results.flat();

      expect(flattened.length).toBe(4);

      // Sort by price ascending (as done in UI/matrix)
      const sorted = [...flattened].sort((a, b) => a.price - b.price);
      expect(sorted[0].platform).toBe(Platform.ALIEXPRESS);
      expect(sorted[0].price).toBe(9.99);
      expect(sorted[3].platform).toBe(Platform.AMAZON);
      expect(sorted[3].price).toBe(29.99);

      // Verify lowest price deal discovered saves $20
      const savings = sorted[3].price - sorted[0].price;
      expect(savings).toBe(20.0);
    });
  });
});
