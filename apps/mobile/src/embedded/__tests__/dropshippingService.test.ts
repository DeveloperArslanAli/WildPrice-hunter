import { DropshippingService } from '../services/dropshippingService';
import { localDb } from '../storage/localDb';
import { Platform, PlatformListing } from '@wildprice/shared-types';

describe('DropshippingService (Arbitrage & Opportunity Scoring)', () => {
  const mockProductId = 'test-prod-123';

  beforeEach(async () => {
    // Clean database listings
    await localDb.ensureLoaded();
  });

  it('should return null when product has no listings', async () => {
    const analysis = await DropshippingService.analyze('non-existent-product');
    expect(analysis).toBeNull();
  });

  it('should correctly calculate margins between AliExpress and Amazon', async () => {
    // Sourcing listing (AliExpress)
    const sourcingListing: PlatformListing = {
      id: 'list-aliexpress-1',
      productId: mockProductId,
      platform: Platform.ALIEXPRESS,
      price: 25.0,
      shippingCost: 0,
      totalCost: 25.0,
      currency: 'USD',
      productUrl: 'https://aliexpress.com/item/1',
      inStock: true,
      similarityScore: 0.9,
      trustScore: 70,
      lastScrapedAt: new Date().toISOString(),
    };

    // Retail listing (Amazon)
    const retailListing: PlatformListing = {
      id: 'list-amazon-1',
      productId: mockProductId,
      platform: Platform.AMAZON,
      price: 90.0,
      shippingCost: 0,
      totalCost: 90.0,
      currency: 'USD',
      productUrl: 'https://amazon.com/dp/1',
      inStock: true,
      similarityScore: 1.0,
      trustScore: 92,
      reviewCount: 500,
      lastScrapedAt: new Date().toISOString(),
    };

    await localDb.saveListing(sourcingListing);
    await localDb.saveListing(retailListing);

    const analysis = await DropshippingService.analyze(mockProductId);
    expect(analysis).not.toBeNull();
    expect(analysis!.sourcingListing.platform).toBe(Platform.ALIEXPRESS);
    expect(analysis!.retailListing.platform).toBe(Platform.AMAZON);

    // Margin = 90 - 25 = 65
    expect(analysis!.profitMargin).toBe(65.0);
    // Percentage = (65 / 90) * 100 = 72.22 -> 72%
    expect(analysis!.profitMarginPercent).toBe(72);
    // Opportunity score >= 70
    expect(analysis!.nicheOpportunityScore).toBeGreaterThanOrEqual(70);
  });
});
