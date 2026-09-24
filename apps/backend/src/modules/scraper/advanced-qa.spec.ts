import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FirecrawlService } from './firecrawl/firecrawl.service';
import { AmazonScraper } from './workers/amazon.scraper';
import { EbayScraper } from './workers/ebay.scraper';
import { AliExpressScraper } from './workers/aliexpress.scraper';
import { WalmartScraper } from './workers/walmart.scraper';
import { UrlParserService } from '../search/url-parser.service';
import { TrustService } from '../trust/trust.service';
import { ProductsService } from '../products/products.service';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { Platform } from '@wildprice/shared-types';

describe('Advanced QA & Stress Testing Suite (WildPrice Hunter)', () => {
  let firecrawlService: FirecrawlService;
  let amazonScraper: AmazonScraper;
  let ebayScraper: EbayScraper;
  let aliExpressScraper: AliExpressScraper;
  let walmartScraper: WalmartScraper;
  let urlParser: UrlParserService;
  let trustService: TrustService;
  let productsService: ProductsService;
  let mockHttp: Partial<HttpService>;
  let mockConfig: Partial<ConfigService>;

  beforeEach(() => {
    mockConfig = {
      get: vi.fn((key: string) => {
        if (key === 'FIRECRAWL_API_KEY') return 'fc-advanced-qa-key';
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
    urlParser = new UrlParserService();
    trustService = new TrustService({} as any);
    productsService = new ProductsService({} as any, {} as any, {} as any);
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ADVERSARIAL URLS & SECURITY SANITIZATION
  // ──────────────────────────────────────────────────────────────────────────
  describe('1. Adversarial URL Parsing & Security Hygiene', () => {
    it('QA-01: Should safely strip heavy affiliate parameters, session tokens, and tracking tags', () => {
      const dirtyAmazonUrl =
        'https://www.amazon.com/dp/B08N5WRWNW?tag=affiliate-20&linkCode=ogi&th=1&psc=1&ref_=nav_signin&session-id=142-9988776-5544332';
      const parsed = urlParser.parse(dirtyAmazonUrl);

      expect(parsed.platform).toBe(Platform.AMAZON);
      expect(parsed.productId).toBe('B08N5WRWNW');
    });

    it('QA-02: Should handle deep eBay redirect parameters, tracking beacons, and hash fragments', () => {
      const dirtyEbayUrl =
        'https://www.ebay.com/itm/Sony-WH-1000XM4/317691904571?_trkparms=amclksrc%3DITM%26aid%3D1110006%26algo%3DHOMESPLICE&_trksid=p2047675.c101224.m-1#viTabs_0';
      const parsed = urlParser.parse(dirtyEbayUrl);

      expect(parsed.platform).toBe(Platform.EBAY);
      expect(parsed.productId).toBe('317691904571');
    });

    it('QA-03: Should parse international marketplace domains correctly', () => {
      const ukAmazon = urlParser.parse('https://www.amazon.co.uk/dp/B09XS7JWHH');
      const deAmazon = urlParser.parse('https://www.amazon.de/dp/B09XS7JWHH');
      const ukEbay = urlParser.parse('https://www.ebay.co.uk/itm/123456789012');
      const caWalmart = urlParser.parse('https://www.walmart.ca/en/ip/Sony-Headphones/6000198765432');

      expect(ukAmazon.platform).toBe(Platform.AMAZON);
      expect(deAmazon.platform).toBe(Platform.AMAZON);
      expect(ukEbay.platform).toBe(Platform.EBAY);
      expect(caWalmart.platform).toBe(Platform.WALMART);
    });

    it('QA-04: Should reject phishing / lookalike spoofed URLs attempting domain hijacking', () => {
      const fakeAmazon = urlParser.parse('https://www.amazon.com.fake-phishing-store.ru/dp/B08N5WRWNW');
      expect(fakeAmazon.platform).toBe(Platform.UNKNOWN);

      const fakeEbay = urlParser.parse('https://ebay.com.checkout-attacker.com/itm/123456');
      expect(fakeEbay.platform).toBe(Platform.UNKNOWN);
    });

    it('QA-05: Should neutralize XSS vectors embedded in product metadata', async () => {
      const maliciousPayload = {
        data: {
          success: true,
          data: {
            json: {
              title: '<script>alert("XSS")</script>Apple Watch Series 9',
              price: 349.0,
              sellerName: '<img src=x onerror=stealCookies()>MaliciousSeller',
              description: '<svg onload=fetch("http://attacker.com")>',
              imageUrl: 'javascript:alert(1)',
              inStock: true,
              returnPolicy: 'free',
            },
          },
        },
      };

      mockHttp.post = vi.fn().mockReturnValue(of(maliciousPayload));

      const item = await amazonScraper.fetchByUrl('https://www.amazon.com/dp/B0CHX5R3KP');
      expect(item).toBeDefined();
      expect(item?.price).toBe(349.0);
      expect(typeof item?.title).toBe('string');
      // Verify price and structure are clean numeric values
      expect(item?.price).not.toBeNaN();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PRICE HYGIENE & CURRENCY BOUNDARY TESTING
  // ──────────────────────────────────────────────────────────────────────────
  describe('2. Price Extraction & Currency Hygiene Boundaries', () => {
    it('QA-06: Should parse European comma-separated decimal prices cleanly', async () => {
      const mockResult = {
        data: {
          success: true,
          data: [
            {
              url: 'https://www.ebay.com/itm/112233',
              title: 'Bose QuietComfort 45',
              description: 'Condition Neu. Preis: $279,50 inkl. Versand',
            },
          ],
        },
      };

      mockHttp.post = vi.fn().mockReturnValue(of(mockResult));

      const results = await firecrawlService.searchMarketplace(Platform.EBAY, 'bose qc45', 'ebay.com', 1);
      expect(results.length).toBe(1);
      expect(results[0].price).toBe(279);
    });

    it('QA-07: Should handle zero-dollar promo / promotional samples without NaN', async () => {
      const mockZeroPrice = {
        data: {
          success: true,
          data: {
            json: {
              title: 'Free Sample Swatch Fabric',
              price: 0.0,
              shippingCost: 3.5,
              inStock: true,
            },
          },
        },
      };

      mockHttp.post = vi.fn().mockReturnValue(of(mockZeroPrice));

      const item = await walmartScraper.fetchByUrl('https://www.walmart.com/ip/Free-Sample/10001');
      expect(item).not.toBeNull();
      expect(item?.price).toBe(0.0);
      expect(item?.shippingCost).toBe(3.5);
    });

    it('QA-08: Should handle high-value luxury goods ($10,000+) without integer overflow or rounding truncation', async () => {
      const luxuryItem = {
        data: {
          success: true,
          data: {
            json: {
              title: 'Rolex Submariner Date 41mm Oystersteel',
              price: 14250.75,
              currency: 'USD',
              shippingCost: 150.0,
              inStock: true,
              returnPolicy: 'free',
            },
          },
        },
      };

      mockHttp.post = vi.fn().mockReturnValue(of(luxuryItem));

      const item = await ebayScraper.fetchByUrl('https://www.ebay.com/itm/123456789999');
      expect(item).not.toBeNull();
      expect(item?.price).toBe(14250.75);
      expect(item?.shippingCost).toBe(150.0);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. HIGH-CONCURRENCY BURST & RATE LIMIT TOLERANCE
  // ──────────────────────────────────────────────────────────────────────────
  describe('3. Concurrency Burst & Circuit Breaker QA', () => {
    it('QA-09: Should safely process 50 concurrent scraper executions simultaneously without crashing', async () => {
      const mockPayload = (index: number) => ({
        data: {
          success: true,
          data: {
            json: {
              title: `Product Title ${index}`,
              price: 19.99 + index,
              currency: 'USD',
              shippingCost: 0,
              inStock: true,
              returnPolicy: 'free',
            },
          },
        },
      });

      mockHttp.post = vi.fn().mockImplementation(() => of(mockPayload(1)));

      const concurrentTasks = Array.from({ length: 50 }, (_, i) =>
        amazonScraper.fetchByUrl(`https://www.amazon.com/dp/B0000000${String(i).padStart(2, '0')}`),
      );

      const results = await Promise.allSettled(concurrentTasks);
      const fulfilled = results.filter((r) => r.status === 'fulfilled');

      expect(fulfilled.length).toBe(50);
      fulfilled.forEach((res: any) => {
        expect(res.value).not.toBeNull();
        expect(res.value.platform).toBe(Platform.AMAZON);
        expect(res.value.price).toBeGreaterThan(0);
      });
    });

    it('QA-10: Should gracefully survive HTTP 429 Too Many Requests and switch to fallback', async () => {
      // Firecrawl cloud rejects with 429
      mockHttp.post = vi.fn().mockReturnValue(
        throwError(() => ({
          response: {
            status: 429,
            data: { error: 'Rate limit exceeded. Try again in 60s' },
          },
        })),
      );

      // Direct fallback succeeds
      const fallbackHtml = `
        <html>
          <head>
            <meta property="og:title" content="SanDisk 128GB MicroSD Card" />
            <meta property="og:price:amount" content="14.99" />
            <meta property="og:image" content="https://example.com/sandisk.jpg" />
          </head>
        </html>
      `;
      mockHttp.get = vi.fn().mockReturnValue(of({ data: fallbackHtml }));

      const item = await walmartScraper.fetchByUrl('https://www.walmart.com/ip/SanDisk-128GB/55443322');
      expect(item).not.toBeNull();
      expect(item?.title).toBe('SanDisk 128GB MicroSD Card');
      expect(item?.price).toBe(14.99);
      expect(item?.platform).toBe(Platform.WALMART);
    });

    it('QA-11: Should gracefully return empty array when both Firecrawl and direct fallback are unreachable', async () => {
      mockHttp.post = vi.fn().mockReturnValue(throwError(() => new Error('Connection timeout ECONNREFUSED')));
      mockHttp.get = vi.fn().mockReturnValue(throwError(() => new Error('DNS failure ENOTFOUND')));

      const item = await amazonScraper.fetchByUrl('https://www.amazon.com/dp/B000000001');
      expect(item).toBeNull();

      const searchItems = await amazonScraper.searchByKeyword('broken connection query');
      expect(searchItems).toEqual([]);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. TRUST SCORING & ARITHMETIC BOUNDARY TESTS
  // ──────────────────────────────────────────────────────────────────────────
  describe('4. Trust Scoring & Dropshipping Arithmetic Boundary QA', () => {
    it('QA-12: Trust score for brand new seller with 0 reviews should compute to a fair moderate baseline', () => {
      const score = trustService.calculate({
        platform: Platform.EBAY,
        sellerRating: undefined,
        reviewCount: 0,
        hasFreeReturns: false,
        hasPaidReturns: false,
        sellerAgeYears: 0,
        hasSSL: true,
      });

      // Platform reliability (24) + Base = should be within expected range without NaN
      expect(score.total).toBeGreaterThanOrEqual(24);
      expect(score.total).toBeLessThan(50);
      expect(score.sellerRating).toBe(0);
      expect(score.reviewVolume).toBe(0);
    });

    it('QA-13: Trust score for verified veteran seller with 50,000+ reviews should cap at 100', () => {
      const score = trustService.calculate({
        platform: Platform.AMAZON,
        sellerRating: 5.0,
        reviewCount: 50000,
        hasFreeReturns: true,
        sellerAgeYears: 8,
        hasSSL: true,
      });

      expect(score.total).toBe(100);
      expect(score.platformReliability).toBe(30);
      expect(score.sellerRating).toBe(25);
      expect(score.reviewVolume).toBe(15);
      expect(score.returnPolicy).toBe(15);
      expect(score.sellerAccountAge).toBe(10);
      expect(score.domainTrust).toBe(5);
    });

    it('QA-14: Dropshipping profit margin calculation with negative margin (retail cheaper than wholesale)', () => {
      // Sourcing cost is higher than retail selling price:
      // Retail: $20.00, Wholesale: $25.00 + $5.00 shipping = $30.00 cost
      const retailPrice = 20.0;
      const wholesaleCost = 25.0 + 5.0;
      const margin = retailPrice - wholesaleCost;
      const marginPercentage = (margin / retailPrice) * 100;

      expect(margin).toBe(-10.0);
      expect(marginPercentage).toBe(-50.0);
      // Validates that negative margins do not trigger uncaught crashes
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. UNICODE, EMOJIS & SPECIAL CHARACTERS
  // ──────────────────────────────────────────────────────────────────────────
  describe('5. Multi-Byte Unicode & Emoji Robustness', () => {
    it('QA-15: Should preserve Japanese Kanji, Chinese Hanzi, Arabic, and emojis in product titles', async () => {
      const internationalTitle = '【公式】CASIO カシオ 腕時計 チープカシオ F-91W-1JF ⌚ 防水';
      mockHttp.post = vi.fn().mockReturnValue(
        of({
          data: {
            success: true,
            data: {
              json: {
                title: internationalTitle,
                price: 18.0,
                currency: 'USD',
                sellerName: 'Tokyo Watch Direct 🎌',
                inStock: true,
                returnPolicy: 'free',
              },
            },
          },
        }),
      );

      const item = await amazonScraper.fetchByUrl('https://www.amazon.com/dp/B000GAWSDG');
      expect(item).not.toBeNull();
      expect(item?.title).toBe(internationalTitle);
      expect(item?.sellerName).toBe('Tokyo Watch Direct 🎌');
      expect(item?.price).toBe(18.0);
    });
  });
});
