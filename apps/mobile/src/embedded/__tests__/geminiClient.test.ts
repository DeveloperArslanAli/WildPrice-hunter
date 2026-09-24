import { GeminiClient } from '../services/geminiClient';

jest.setTimeout(20000);

describe('GeminiClient (AI Fingerprinting & Sentiment)', () => {
  describe('Product Fingerprint Extraction', () => {
    it('should extract canonical title and attributes', async () => {
      const result = await GeminiClient.extractFingerprint({
        title: 'Sony WH-1000XM5 Noise Canceling Wireless Headphones - Black',
        brand: 'Sony',
        category: 'Electronics',
      });

      expect(result).toBeDefined();
      expect(result.canonicalTitle).toBeDefined();
      expect(result.canonicalTitle.length).toBeGreaterThan(0);
      expect(result.brand).toBe('Sony');
      expect(Array.isArray(result.keyAttributes)).toBe(true);
      expect(result.similarityThreshold).toBeGreaterThan(0);
    });
  });

  describe('Product Similarity Calculation', () => {
    it('should compute similarity between target fingerprint and candidate title', async () => {
      const fingerprint = {
        canonicalTitle: 'Sony WH-1000XM5 Wireless Headphones',
        keyAttributes: ['Sony', 'WH-1000XM5', 'Wireless'],
        similarityThreshold: 0.7,
      };

      // Very similar title
      const highSim = await GeminiClient.calculateSimilarity(
        fingerprint,
        'Sony WH-1000XM5 Over-Ear Bluetooth Headphones Black',
      );
      expect(highSim).toBeGreaterThanOrEqual(0.5);
      expect(highSim).toBeLessThanOrEqual(1.0);

      // Low similarity candidate
      const lowSim = await GeminiClient.calculateSimilarity(
        fingerprint,
        'Samsung Galaxy S24 Ultra Phone Case',
      );
      expect(lowSim).toBeLessThanOrEqual(highSim);
    });
  });

  describe('Review Sentiment & Fake Review Risk Audit', () => {
    it('should generate complete sentiment report matching contract', async () => {
      const report = await GeminiClient.getSentimentReport(
        'prod-test-99',
        'Sony WH-1000XM5 Headphones',
        4.6,
        1500,
      );

      expect(report.productId).toBe('prod-test-99');
      expect(report.productTitle).toBe('Sony WH-1000XM5 Headphones');
      expect(report.sentimentScore).toBeGreaterThanOrEqual(0);
      expect(report.sentimentScore).toBeLessThanOrEqual(100);
      expect(Array.isArray(report.positiveHighlights)).toBe(true);
      expect(report.positiveHighlights.length).toBeGreaterThan(0);
      expect(Array.isArray(report.negativeHighlights)).toBe(true);
      expect(report.summary).toBeDefined();
      expect(['LOW', 'MEDIUM', 'HIGH']).toContain(report.fakeReviewRisk);
      expect(Array.isArray(report.fakeReviewIndicators)).toBe(true);
      expect([
        'HIGHLY RECOMMENDED',
        'GOOD BUY',
        'MIXED REVIEWS',
        'PROCEED WITH CAUTION',
      ]).toContain(report.verdict);
      expect(report.totalReviewsAnalyzed).toBe(1500);
    });
  });

  describe('Image Keyword Extraction', () => {
    it('should extract fallback search keywords for image input', async () => {
      const keywords = await GeminiClient.extractKeywordsFromImage('fake-base64-data');
      expect(typeof keywords).toBe('string');
      expect(keywords.length).toBeGreaterThan(0);
    });
  });
});
