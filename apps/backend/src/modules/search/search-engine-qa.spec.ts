import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from './search.service';
import { ScraperProcessor } from '../scraper/scraper.processor';
import { FirecrawlService } from '../scraper/firecrawl/firecrawl.service';
import { AmazonScraper } from '../scraper/workers/amazon.scraper';
import { EbayScraper } from '../scraper/workers/ebay.scraper';
import { AliExpressScraper } from '../scraper/workers/aliexpress.scraper';
import { WalmartScraper } from '../scraper/workers/walmart.scraper';
import { UrlParserService } from './url-parser.service';
import { AiService } from '../ai/ai.service';
import { TrustService } from '../trust/trust.service';
import { SearchEventsGateway } from './search.gateway';
import { SearchSession } from './entities/search-session.entity';
import { Product, PlatformListing, PriceHistory } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { Repository } from 'typeorm';
import { Queue, Job } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { SearchInputType, SearchSessionStatus, SortBy, Platform } from '@wildprice/shared-types';

describe('Search Engine & Scraper End-to-End QA Audit', () => {
  let searchService: SearchService;
  let scraperProcessor: ScraperProcessor;
  let firecrawlService: FirecrawlService;
  let amazonScraper: AmazonScraper;
  let ebayScraper: EbayScraper;
  let aliExpressScraper: AliExpressScraper;
  let walmartScraper: WalmartScraper;
  let aiService: Partial<AiService>;
  let trustService: TrustService;
  let urlParser: UrlParserService;
  let searchGateway: Partial<SearchEventsGateway>;

  // Mock in-memory repositories
  let sessions: SearchSession[] = [];
  let products: Product[] = [];
  let listings: PlatformListing[] = [];
  let priceHistories: PriceHistory[] = [];

  let mockSessionsRepo: Partial<Repository<SearchSession>>;
  let mockProductsRepo: Partial<Repository<Product>>;
  let mockListingsRepo: Partial<Repository<PlatformListing>>;
  let mockPriceHistoryRepo: Partial<Repository<PriceHistory>>;
  let mockUsersRepo: Partial<Repository<User>>;
  let mockScraperQueue: Partial<Queue>;

  beforeEach(() => {
    sessions = [];
    products = [];
    listings = [];
    priceHistories = [];

    mockSessionsRepo = {
      create: vi.fn((data: any) => ({
        id: `sess-${Math.random().toString(36).substring(7)}`,
        createdAt: new Date(),
        resultListingIds: [],
        ...data,
      })),
      save: vi.fn(async (session: any) => {
        const existingIdx = sessions.findIndex((s) => s.id === session.id);
        if (existingIdx >= 0) {
          sessions[existingIdx] = { ...sessions[existingIdx], ...session };
          return sessions[existingIdx];
        }
        sessions.push(session);
        return session;
      }),
      findOne: vi.fn(async ({ where }: any) => {
        return sessions.find((s) => s.id === where.id) || null;
      }),
    };

    mockProductsRepo = {
      create: vi.fn((data: any) => ({
        id: `prod-${Math.random().toString(36).substring(7)}`,
        createdAt: new Date(),
        ...data,
      })),
      save: vi.fn(async (product: any) => {
        products.push(product);
        return product;
      }),
      findOne: vi.fn(async ({ where }: any) => {
        if (where.id) return products.find((p) => p.id === where.id) || null;
        if (where.title) return products.find((p) => p.title === where.title) || null;
        return null;
      }),
      update: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockListingsRepo = {
      create: vi.fn((data: any) => ({
        id: `list-${Math.random().toString(36).substring(7)}`,
        scrapedAt: new Date(),
        ...data,
      })),
      save: vi.fn(async (listing: any) => {
        listings.push(listing);
        return listing;
      }),
      findOne: vi.fn(async ({ where }: any) => {
        return listings.find((l) => l.id === where.id) || null;
      }),
      createQueryBuilder: vi.fn(() => ({
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn(async () => listings),
      })) as any,
    };

    mockPriceHistoryRepo = {
      create: vi.fn((data: any) => ({
        id: `ph-${Math.random().toString(36).substring(7)}`,
        scrapedAt: new Date(),
        ...data,
      })),
      save: vi.fn(async (ph: any) => {
        priceHistories.push(ph);
        return ph;
      }),
    };

    mockUsersRepo = {
      findOne: vi.fn().mockResolvedValue(null),
      increment: vi.fn().mockResolvedValue({ affected: 1 }),
    };

    mockScraperQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    };

    aiService = {
      extractProductFingerprint: vi.fn().mockResolvedValue({
        brand: 'Sony',
        canonicalTitle: 'Sony WH-1000XM5 Wireless Headphones',
        category: 'Electronics',
      }),
      buildSearchKeywords: vi.fn().mockResolvedValue('Sony WH-1000XM5 Wireless Headphones'),
      extractKeywordsFromImage: vi.fn().mockResolvedValue('Sony Noise Cancelling Headphones'),
      calculateSimilarity: vi.fn().mockResolvedValue(0.95),
    };

    urlParser = new UrlParserService();
    trustService = new TrustService({} as any);

    searchGateway = {
      emitProgress: vi.fn(),
      emitListingFound: vi.fn(),
      emitSearchCompleted: vi.fn(),
    };

    // Mock Firecrawl Service
    firecrawlService = {
      isConfigured: vi.fn().mockReturnValue(true),
      scrapeProductUrl: vi.fn(),
      searchMarketplace: vi.fn(),
    } as unknown as FirecrawlService;

    amazonScraper = new AmazonScraper(firecrawlService);
    ebayScraper = new EbayScraper(firecrawlService);
    aliExpressScraper = new AliExpressScraper(firecrawlService);
    walmartScraper = new WalmartScraper(firecrawlService);

    searchService = new SearchService(
      mockSessionsRepo as Repository<SearchSession>,
      mockProductsRepo as Repository<Product>,
      mockListingsRepo as Repository<PlatformListing>,
      mockUsersRepo as Repository<User>,
      mockScraperQueue as Queue,
      aiService as AiService,
      urlParser,
      { get: vi.fn() } as unknown as ConfigService,
    );

    scraperProcessor = new ScraperProcessor(
      mockSessionsRepo as Repository<SearchSession>,
      mockProductsRepo as Repository<Product>,
      mockListingsRepo as Repository<PlatformListing>,
      mockPriceHistoryRepo as Repository<PriceHistory>,
      amazonScraper,
      ebayScraper,
      aliExpressScraper,
      walmartScraper,
      aiService as AiService,
      trustService,
      urlParser,
      searchGateway as SearchEventsGateway,
    );
  });

  describe('1. End-to-End URL Search & Scraper Pipeline Verification', () => {
    it('QA-E2E-1: Should complete end-to-end URL search from input to comparison matrix', async () => {
      const inputUrl = 'https://www.amazon.com/dp/B09XS7JWHH';

      // 1. Client initiates search by URL
      const session = await searchService.searchByUrl({ url: inputUrl });
      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.inputType).toBe(SearchInputType.URL);
      expect(session.status).toBe(SearchSessionStatus.PROCESSING);

      // Verify scraper queue received job
      expect(mockScraperQueue.add).toHaveBeenCalledWith('scrape-product', {
        sessionId: session.id,
        inputType: SearchInputType.URL,
        url: inputUrl,
        userId: undefined,
      });

      // 2. Mock Firecrawl Scraper responses
      // Original Amazon Product
      (firecrawlService.scrapeProductUrl as any).mockResolvedValueOnce({
        platform: Platform.AMAZON,
        title: 'Sony WH-1000XM5 Noise Canceling Headphones',
        price: 398.0,
        currency: 'USD',
        shippingCost: 0,
        productUrl: inputUrl,
        imageUrl: 'https://images.amazon.com/sony.jpg',
        rating: 4.7,
        reviewCount: 12000,
        sellerName: 'Amazon.com',
        inStock: true,
        returnPolicy: 'free',
        brand: 'Sony',
      });

      // Competitor Marketplaces Scrapes via searchMarketplace
      (firecrawlService.searchMarketplace as any).mockImplementation((platform: Platform) => {
        if (platform === Platform.EBAY) {
          return Promise.resolve([
            {
              platform: Platform.EBAY,
              title: 'Sony WH-1000XM5 Wireless Headphones Black',
              price: 299.99,
              currency: 'USD',
              shippingCost: 0,
              productUrl: 'https://www.ebay.com/itm/112233',
              imageUrl: 'https://ebay.com/sony.jpg',
              rating: 4.8,
              reviewCount: 450,
              sellerName: 'CertifiedTech',
              inStock: true,
              returnPolicy: 'free' as const,
            },
          ]);
        }
        if (platform === Platform.WALMART) {
          return Promise.resolve([
            {
              platform: Platform.WALMART,
              title: 'Sony WH1000XM5 Over Ear Headphones',
              price: 348.0,
              currency: 'USD',
              shippingCost: 0,
              productUrl: 'https://www.walmart.com/ip/sony/9988',
              imageUrl: 'https://walmart.com/sony.jpg',
              rating: 4.6,
              reviewCount: 800,
              sellerName: 'Walmart.com',
              inStock: true,
              returnPolicy: 'free' as const,
            },
          ]);
        }
        if (platform === Platform.ALIEXPRESS) {
          return Promise.resolve([
            {
              platform: Platform.ALIEXPRESS,
              title: 'Sony WH-1000XM5 Silicone Replacement Cushions & Case',
              price: 18.5,
              currency: 'USD',
              shippingCost: 0,
              productUrl: 'https://www.aliexpress.com/item/100500',
              imageUrl: 'https://ali.com/cushion.jpg',
              rating: 4.5,
              reviewCount: 300,
              sellerName: 'AliAudioStore',
              inStock: true,
              returnPolicy: 'paid' as const,
            },
          ]);
        }
        return Promise.resolve([]);
      });

      // 3. Worker executes the job
      const mockJob = {
        data: {
          sessionId: session.id,
          inputType: SearchInputType.URL,
          url: inputUrl,
        },
      } as Job;

      await scraperProcessor.process(mockJob);

      // Verify session updated to DONE
      const completedSession = await searchService.getSessionStatus(session.id);
      expect(completedSession.status).toBe(SearchSessionStatus.DONE);
      expect(completedSession.resultListingIds.length).toBeGreaterThan(0);

      // Verify WebSocket emitted progress milestones
      expect(searchGateway.emitProgress).toHaveBeenCalled();

      // 4. Client retrieves sorted comparison matrix
      const matrix = await searchService.getSessionResults(session.id, {
        sortBy: SortBy.PRICE_ASC,
      });

      expect(matrix.results.length).toBeGreaterThanOrEqual(3);
      expect(matrix.originalListing).toBeDefined();
      expect(matrix.originalListing?.price).toBe(398.0);

      // Verify cheapest deal discovered
      expect(matrix.cheapestListing).toBeDefined();
      expect(matrix.cheapestListing?.platform).toBe(Platform.ALIEXPRESS);

      // Verify price savings calculation
      expect(matrix.maxSavings).toBeGreaterThan(0);
      expect(matrix.maxSavingsPercent).toBeGreaterThan(0);
    });
  });

  describe('2. Text Keyword Search & Multi-Marketplace Matrix', () => {
    it('QA-E2E-2: Should search across marketplaces, calculate trust scores, and sort by price asc', async () => {
      const query = 'Ergonomic Office Chair Mesh High Back';

      const session = await searchService.searchByText({ query });
      expect(session.status).toBe(SearchSessionStatus.PROCESSING);

      // Mock search results on all platforms
      (firecrawlService.searchMarketplace as any).mockImplementation((platform: Platform) => {
        const prices: Record<Platform, number> = {
          [Platform.AMAZON]: 199.99,
          [Platform.WALMART]: 179.0,
          [Platform.EBAY]: 149.5,
          [Platform.ALIEXPRESS]: 89.0,
          [Platform.ETSY]: 220.0,
          [Platform.SHOPIFY]: 185.0,
          [Platform.UNKNOWN]: 150.0,
        };
        return Promise.resolve([
          {
            platform,
            title: `${platform} Ergonomic Mesh Chair`,
            price: prices[platform] || 150.0,
            currency: 'USD',
            shippingCost: 0,
            productUrl: `https://${platform}.com/chair`,
            rating: 4.6,
            reviewCount: 500,
            sellerName: `${platform} Seller`,
            inStock: true,
            returnPolicy: 'free' as const,
          },
        ]);
      });

      const mockJob = {
        data: {
          sessionId: session.id,
          inputType: SearchInputType.TEXT,
          query,
        },
      } as Job;

      await scraperProcessor.process(mockJob);

      // Verify Session Completed
      const completedSession = await searchService.getSessionStatus(session.id);
      expect(completedSession.status).toBe(SearchSessionStatus.DONE);

      // Verify Results sorted by price ascending
      const resultsAsc = await searchService.getSessionResults(session.id, {
        sortBy: SortBy.PRICE_ASC,
      });

      const prices = resultsAsc.results.map((r) => Number(r.totalCost));
      for (let i = 1; i < prices.length; i++) {
        expect(prices[i]).toBeGreaterThanOrEqual(prices[i - 1]);
      }
      expect(resultsAsc.results[0].platform).toBe(Platform.ALIEXPRESS);
      expect(resultsAsc.results[0].price).toBe(89.0);
    });

    it('QA-E2E-3: Should filter listings by trust threshold and maximum price', async () => {
      const sessionId = 'session-filtering-test';
      const mockListingsData = [
        {
          id: 'list-1',
          platform: Platform.AMAZON,
          price: 100,
          totalCost: 100,
          trustScore: 92,
        },
        {
          id: 'list-2',
          platform: Platform.EBAY,
          price: 150,
          totalCost: 150,
          trustScore: 78,
        },
        {
          id: 'list-3',
          platform: Platform.ALIEXPRESS,
          price: 50,
          totalCost: 50,
          trustScore: 55, // Low trust
        },
      ];

      sessions.push({
        id: sessionId,
        status: SearchSessionStatus.DONE,
        resultListingIds: ['list-1', 'list-2', 'list-3'],
      } as any);

      listings = mockListingsData as any;

      // Filter: minTrust >= 70, maxPrice <= 120
      const filtered = await searchService.getSessionResults(sessionId, {
        minTrust: 70,
        maxPrice: 120,
      });

      expect(filtered.results.length).toBe(1);
      expect(filtered.results[0].id).toBe('list-1');
      expect(filtered.results[0].trustScore).toBeGreaterThanOrEqual(70);
      expect(Number(filtered.results[0].totalCost)).toBeLessThanOrEqual(120);
    });
  });

  describe('3. Image Visual Search via AI Extraction', () => {
    it('QA-E2E-4: Should extract product query from base64 image and dispatch scraper job', async () => {
      const fakeBase64 = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...';

      const session = await searchService.searchByImage({ imageBase64: fakeBase64 });
      expect(session).toBeDefined();
      expect(session.inputType).toBe(SearchInputType.IMAGE);
      expect(aiService.extractKeywordsFromImage).toHaveBeenCalledWith(fakeBase64);

      // Verify queue received the extracted query
      expect(mockScraperQueue.add).toHaveBeenCalledWith(
        'scrape-product',
        expect.objectContaining({
          sessionId: session.id,
          inputType: SearchInputType.TEXT,
          query: 'Sony Noise Cancelling Headphones',
        }),
      );
    });
  });

  describe('4. Real-Time WebSocket Gateway Event Emitting', () => {
    it('QA-E2E-5: Gateway should emit progress percentages correctly to subscribed room', () => {
      const gateway = new SearchEventsGateway();
      const mockServer = {
        to: vi.fn().mockReturnThis(),
        emit: vi.fn(),
      };
      (gateway as any).server = mockServer;

      gateway.emitProgress({
        sessionId: 'sess-ws-test',
        status: SearchSessionStatus.PROCESSING,
        progress: 55,
        message: 'Scanning Amazon, eBay, AliExpress, and Walmart in parallel...',
      });

      expect(mockServer.to).toHaveBeenCalledWith('session_sess-ws-test');
      expect(mockServer.emit).toHaveBeenCalledWith(
        'search:progress',
        expect.objectContaining({
          sessionId: 'sess-ws-test',
          progress: 55,
        }),
      );
    });
  });
});
