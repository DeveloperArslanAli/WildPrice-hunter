import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from './search.service';
import { NotFoundException } from '@nestjs/common';
import { SearchInputType, SearchSessionStatus, SortBy, Platform } from '@wildprice/shared-types';
import { SCRAPE_JOB_NAME } from '../scraper/scraper.constants';

describe('SearchService (Orchestrator QA Suite)', () => {
  let service: SearchService;
  let mockSessionsRepo: any;
  let mockProductsRepo: any;
  let mockListingsRepo: any;
  let mockUsersRepo: any;
  let mockQueue: any;
  let mockAi: any;
  let mockUrlParser: any;
  let mockConfig: any;

  beforeEach(() => {
    mockSessionsRepo = {
      create: vi.fn((s) => ({ ...s, id: 'session-uuid-1' })),
      save: vi.fn((s) => Promise.resolve(s)),
      findOne: vi.fn(),
    };
    mockProductsRepo = {
      findOne: vi.fn(),
    };
    mockListingsRepo = {
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };
    mockUsersRepo = {
      findOne: vi.fn(),
      update: vi.fn(),
    };
    mockQueue = {
      add: vi.fn().mockResolvedValue({ id: 'job-1' }),
    };
    mockAi = {
      extractKeywordsFromImage: vi.fn(),
    };
    mockUrlParser = {
      parse: vi.fn(),
    };
    mockConfig = {
      get: vi.fn(),
    };

    service = new SearchService(
      mockSessionsRepo,
      mockProductsRepo,
      mockListingsRepo,
      mockUsersRepo,
      mockQueue,
      mockAi,
      mockUrlParser,
      mockConfig,
    );
  });

  describe('Search Dispatching', () => {
    it('should create search session and dispatch BullMQ job for URL search', async () => {
      const result = await service.searchByUrl({ url: 'https://amazon.com/dp/B08N5WRWNW' });

      expect(result).toBeDefined();
      expect(result.id).toBe('session-uuid-1');
      expect(result.inputType).toBe(SearchInputType.URL);
      expect(mockSessionsRepo.save).toHaveBeenCalled();
      expect(mockQueue.add).toHaveBeenCalledWith(SCRAPE_JOB_NAME, expect.objectContaining({
        sessionId: 'session-uuid-1',
        url: 'https://amazon.com/dp/B08N5WRWNW',
      }));
    });

    it('should create search session and dispatch job for keyword text search', async () => {
      const result = await service.searchByText({ query: 'gaming mouse wireless' });

      expect(result).toBeDefined();
      expect(result.inputType).toBe(SearchInputType.TEXT);
      expect(mockQueue.add).toHaveBeenCalledWith(SCRAPE_JOB_NAME, expect.objectContaining({
        query: 'gaming mouse wireless',
      }));
    });
  });

  describe('Session Status & Results Retrieval', () => {
    it('should throw NotFoundException if session does not exist', async () => {
      mockSessionsRepo.findOne.mockResolvedValue(null);
      await expect(service.getSessionStatus('non-existent')).rejects.toThrow(NotFoundException);
    });

    it('should compute price savings and sort results correctly', async () => {
      const mockSession = {
        id: 'sess-1',
        resultListingIds: ['list-1', 'list-2', 'list-3'],
        originalListingId: 'orig-1',
      };

      const mockOriginal = {
        id: 'orig-1',
        platform: Platform.AMAZON,
        totalCost: 50.0,
      };

      const mockListings = [
        { id: 'list-1', platform: Platform.EBAY, totalCost: 35.0, trustScore: 85, rating: 4.5 },
        { id: 'list-2', platform: Platform.ALIEXPRESS, totalCost: 20.0, trustScore: 60, rating: 4.0 },
        { id: 'list-3', platform: Platform.WALMART, totalCost: 40.0, trustScore: 90, rating: 4.8 },
      ];

      mockSessionsRepo.findOne.mockResolvedValue(mockSession);
      mockListingsRepo.findOne.mockResolvedValue(mockOriginal);
      mockListingsRepo.createQueryBuilder.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockListings),
      });

      // Query sorted by lowest price (Price ASC)
      const res = await service.getSessionResults('sess-1', { sortBy: SortBy.PRICE_ASC });

      expect(res.results.length).toBe(3);
      // Lowest price should be first ($20 AliExpress)
      expect(res.results[0].totalCost).toBe(20.0);
      expect(res.cheapestListing?.totalCost).toBe(20.0);
      // Max savings should be $50 - $20 = $30 (60%)
      expect(res.maxSavings).toBe(30.0);
      expect(res.maxSavingsPercent).toBe(60);
    });

    it('should correctly sort results by trust score descending', async () => {
      const mockSession = {
        id: 'sess-2',
        resultListingIds: ['l-1', 'l-2'],
      };

      const mockListings = [
        { id: 'l-1', platform: Platform.ALIEXPRESS, totalCost: 15.0, trustScore: 55 },
        { id: 'l-2', platform: Platform.WALMART, totalCost: 25.0, trustScore: 95 },
      ];

      mockSessionsRepo.findOne.mockResolvedValue(mockSession);
      mockListingsRepo.createQueryBuilder.mockReturnValue({
        where: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockListings),
      });

      const res = await service.getSessionResults('sess-2', { sortBy: SortBy.TRUST_DESC });

      // Higher trust (95 Walmart) should be first
      expect(res.results[0].trustScore).toBe(95);
      expect(res.results[1].trustScore).toBe(55);
    });
  });
});
