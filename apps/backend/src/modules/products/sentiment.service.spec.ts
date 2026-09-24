import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SentimentService } from './sentiment.service';
import { ConfigService } from '@nestjs/config';

describe('SentimentService', () => {
  let service: SentimentService;
  let mockProductsRepo: any;
  let mockListingsRepo: any;
  let mockConfig: any;

  beforeEach(() => {
    mockProductsRepo = {
      findOne: vi.fn(),
      save: vi.fn((p) => Promise.resolve(p)),
    };
    mockListingsRepo = {
      find: vi.fn(),
    };
    mockConfig = {
      get: vi.fn().mockReturnValue('test-gemini-key'),
    };

    service = new SentimentService(
      mockProductsRepo as any,
      mockListingsRepo as any,
      mockConfig as ConfigService,
    );
  });

  it('should throw NotFoundException if product does not exist', async () => {
    mockProductsRepo.findOne.mockResolvedValue(null);
    await expect(service.getOrAnalyzeSentiment('non-existent-id')).rejects.toThrow(
      'Product with ID non-existent-id not found',
    );
  });

  it('should return cached sentiment report if generated within 7 days', async () => {
    const cachedReport = {
      productId: 'p-1',
      productTitle: 'Sony Headphones',
      sentimentScore: 92,
      positiveHighlights: ['Crisp sound', 'Long battery'],
      negativeHighlights: ['Pricey'],
      summary: 'Excellent premium headphones.',
      fakeReviewRisk: 'LOW',
      fakeReviewIndicators: ['High authentic distribution'],
      verdict: 'HIGHLY RECOMMENDED',
      totalReviewsAnalyzed: 1200,
      extractedAt: new Date().toISOString(),
    };

    mockProductsRepo.findOne.mockResolvedValue({
      id: 'p-1',
      title: 'Sony Headphones',
      fingerprint: { sentimentReport: cachedReport },
      listings: [],
    });

    const result = await service.getOrAnalyzeSentiment('p-1');
    expect(result).toEqual(cachedReport);
    expect(mockProductsRepo.save).not.toHaveBeenCalled();
  });

  it('should generate fallback report with solid defaults when AI model is mocked or offline', async () => {
    mockProductsRepo.findOne.mockResolvedValue({
      id: 'p-2',
      title: 'Ergonomic Mechanical Keyboard',
      brand: 'Keychron',
      category: 'Electronics > Computer Accessories',
      description: 'Hot-swappable wireless keyboard',
      listings: [
        { platform: 'amazon', rating: 4.6, reviewCount: 450, price: 89.99 },
        { platform: 'walmart', rating: 4.4, reviewCount: 80, price: 79.99 },
      ],
    });

    // Cause generateContent to throw so fallback report triggers
    (service as any).model = {
      generateContent: vi.fn().mockRejectedValue(new Error('Network offline')),
    };

    const result = await service.getOrAnalyzeSentiment('p-2');

    expect(result).toBeDefined();
    expect(result.productId).toBe('p-2');
    expect(result.productTitle).toBe('Ergonomic Mechanical Keyboard');
    expect(result.sentimentScore).toBeGreaterThanOrEqual(80);
    expect(result.verdict).toBe('HIGHLY RECOMMENDED');
    expect(result.positiveHighlights.length).toBeGreaterThanOrEqual(2);
    expect(result.fakeReviewRisk).toBe('LOW');
    expect(mockProductsRepo.save).toHaveBeenCalled();
  });
});
