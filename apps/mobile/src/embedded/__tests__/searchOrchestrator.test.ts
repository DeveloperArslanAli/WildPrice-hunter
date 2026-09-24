import { SearchOrchestrator } from '../orchestrator/searchOrchestrator';
import { localDb } from '../storage/localDb';
import { localEventBus } from '../events/localEventBus';
import { scraperManager } from '../scrapers/scraperManager';
import { GeminiClient } from '../services/geminiClient';
import { SearchSessionStatus, Platform } from '@wildprice/shared-types';

describe('SearchOrchestrator (Embedded Hunt Engine)', () => {
  beforeEach(() => {
    jest.spyOn(scraperManager, 'searchAllPlatforms').mockResolvedValue([
      {
        platform: Platform.AMAZON,
        title: 'Bose QuietComfort 45 Headphones (Black)',
        price: 279.0,
        currency: 'USD',
        shippingCost: 0,
        productUrl: 'https://amazon.com/dp/B098FKXT8L',
        imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e',
        rating: 4.7,
        reviewCount: 3200,
        sellerName: 'Amazon',
        inStock: true,
        returnPolicy: 'free',
        sellerAgeYears: 12,
        hasSsl: true,
      },
      {
        platform: Platform.EBAY,
        title: 'Bose QuietComfort 45 Noise Cancelling',
        price: 229.0,
        currency: 'USD',
        shippingCost: 0,
        productUrl: 'https://ebay.com/itm/12345678',
        rating: 4.6,
        reviewCount: 450,
        sellerName: 'ElectronicsDirect',
        inStock: true,
        returnPolicy: 'free',
        sellerAgeYears: 6,
        hasSsl: true,
      },
    ]);

    jest.spyOn(scraperManager, 'fetchOriginalByUrl').mockResolvedValue({
      platform: Platform.AMAZON,
      title: 'Bose QuietComfort 45 Headphones',
      price: 329.0,
      currency: 'USD',
      shippingCost: 0,
      productUrl: 'https://www.amazon.com/dp/B098FKXT8L',
      rating: 4.7,
      reviewCount: 3500,
      sellerName: 'Amazon Retail',
      inStock: true,
      returnPolicy: 'free',
      sellerAgeYears: 12,
      hasSsl: true,
    });

    jest.spyOn(GeminiClient, 'extractFingerprint').mockResolvedValue({
      canonicalTitle: 'Bose QuietComfort 45 Headphones',
      brand: 'Bose',
      category: 'Audio',
      keyAttributes: ['Noise Cancelling', 'Wireless'],
      similarityThreshold: 0.7,
    });

    jest.spyOn(GeminiClient, 'calculateSimilarity').mockResolvedValue(0.92);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should start text search and emit all progress and completion events', async () => {
    const progressUpdates: number[] = [];
    let completedData: any = null;
    let foundListing: any = null;

    const res = await SearchOrchestrator.startTextSearch('Bose QuietComfort 45');
    expect(res.sessionId).toBeDefined();
    expect(res.status).toBe(SearchSessionStatus.PROCESSING);

    // Subscribe to events
    const unsubscribe = localEventBus.subscribe(res.sessionId, {
      onProgress: (data) => {
        progressUpdates.push(data.progress);
      },
      onListingFound: (data) => {
        foundListing = data.listing;
      },
      onCompleted: (data) => {
        completedData = data;
      },
    });

    // Wait for the async orchestrator pipeline to complete
    await new Promise((resolve) => setTimeout(() => resolve(undefined), 250));

    // Verify progress progression
    expect(progressUpdates).toContain(15);
    expect(progressUpdates).toContain(35);
    expect(progressUpdates).toContain(55);
    expect(progressUpdates).toContain(80);

    // Verify session persisted to localDb
    const session = await localDb.getSession(res.sessionId);
    expect(session).not.toBeNull();
    expect(session?.status).toBe(SearchSessionStatus.DONE);
    expect(session?.resultCount).toBeGreaterThan(0);

    // Verify listings found
    expect(foundListing).toBeDefined();
    expect(foundListing.price).toBeGreaterThan(0);
    expect(foundListing.platform).toBeDefined();

    // Verify completed payload
    expect(completedData).not.toBeNull();
    expect(completedData.sessionId).toBe(res.sessionId);
    expect(completedData.resultCount).toBeGreaterThan(0);

    unsubscribe();
  });

  it('should start URL search and parse original product', async () => {
    const res = await SearchOrchestrator.startUrlSearch('https://www.amazon.com/dp/B098FKXT8L');
    expect(res.sessionId).toBeDefined();
    expect(res.status).toBe(SearchSessionStatus.PROCESSING);

    await new Promise((resolve) => setTimeout(() => resolve(undefined), 250));

    const session = await localDb.getSession(res.sessionId);
    expect(session).not.toBeNull();
    expect(session?.status).toBe(SearchSessionStatus.DONE);
    expect(session?.originalProduct).toBeDefined();
  });
});
