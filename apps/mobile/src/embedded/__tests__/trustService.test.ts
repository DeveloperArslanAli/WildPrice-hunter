import { TrustService } from '../services/trustService';
import { Platform } from '@wildprice/shared-types';

describe('TrustService (Embedded 6-Factor Composite Algorithm)', () => {
  it('should calculate platform baseline reliability properly', () => {
    const amazon = TrustService.calculate({ platform: Platform.AMAZON });
    expect(amazon.platformReliability).toBe(30);

    const walmart = TrustService.calculate({ platform: Platform.WALMART });
    expect(walmart.platformReliability).toBe(28);

    const ebay = TrustService.calculate({ platform: Platform.EBAY });
    expect(ebay.platformReliability).toBe(24);

    const aliexpress = TrustService.calculate({ platform: Platform.ALIEXPRESS });
    expect(aliexpress.platformReliability).toBe(14);

    const unknown = TrustService.calculate({ platform: Platform.UNKNOWN });
    expect(unknown.platformReliability).toBe(8);
  });

  it('should calculate seller rating correctly (0-5 stars mapped to 0-25 pts)', () => {
    const perfectRating = TrustService.calculate({
      platform: Platform.AMAZON,
      sellerRating: 5.0,
    });
    expect(perfectRating.sellerRating).toBe(25);

    const midRating = TrustService.calculate({
      platform: Platform.AMAZON,
      sellerRating: 4.0,
    });
    expect(midRating.sellerRating).toBe(20);

    const zeroRating = TrustService.calculate({
      platform: Platform.AMAZON,
      sellerRating: 0,
    });
    expect(zeroRating.sellerRating).toBe(0);
  });

  it('should calculate review volume logarithmically (0-15 pts)', () => {
    const hugeReviews = TrustService.calculate({
      platform: Platform.AMAZON,
      reviewCount: 10000,
    });
    expect(hugeReviews.reviewVolume).toBe(15);

    const moderateReviews = TrustService.calculate({
      platform: Platform.AMAZON,
      reviewCount: 100,
    });
    // log10(100)/4 * 15 = 2/4 * 15 = 7.5 -> round to 8
    expect(moderateReviews.reviewVolume).toBe(8);

    const zeroReviews = TrustService.calculate({
      platform: Platform.AMAZON,
      reviewCount: 0,
    });
    expect(zeroReviews.reviewVolume).toBe(0);
  });

  it('should calculate return policy points', () => {
    const freeReturn = TrustService.calculate({
      platform: Platform.AMAZON,
      hasFreeReturns: true,
    });
    expect(freeReturn.returnPolicy).toBe(15);

    const paidReturn = TrustService.calculate({
      platform: Platform.AMAZON,
      hasPaidReturns: true,
    });
    expect(paidReturn.returnPolicy).toBe(8);

    const noReturn = TrustService.calculate({
      platform: Platform.AMAZON,
      hasFreeReturns: false,
      hasPaidReturns: false,
    });
    expect(noReturn.returnPolicy).toBe(0);
  });

  it('should score seller account age brackets', () => {
    expect(TrustService.calculate({ platform: Platform.EBAY, sellerAgeYears: 6 }).sellerAccountAge).toBe(10);
    expect(TrustService.calculate({ platform: Platform.EBAY, sellerAgeYears: 3 }).sellerAccountAge).toBe(7);
    expect(TrustService.calculate({ platform: Platform.EBAY, sellerAgeYears: 1.5 }).sellerAccountAge).toBe(4);
    expect(TrustService.calculate({ platform: Platform.EBAY, sellerAgeYears: 0.5 }).sellerAccountAge).toBe(2);
  });

  it('should assign full domain trust automatically to major platforms', () => {
    const amazon = TrustService.calculate({ platform: Platform.AMAZON });
    expect(amazon.domainTrust).toBe(5);

    const walmart = TrustService.calculate({ platform: Platform.WALMART });
    expect(walmart.domainTrust).toBe(5);

    const ebay = TrustService.calculate({ platform: Platform.EBAY });
    expect(ebay.domainTrust).toBe(5);
  });

  it('should short-circuit to 0 if merchant is blocklisted', () => {
    const blocked = TrustService.calculate({
      platform: Platform.AMAZON,
      sellerRating: 5,
      reviewCount: 10000,
      isBlocklisted: true,
    });
    expect(blocked.total).toBe(0);
    expect(blocked.platformReliability).toBe(0);
    expect(blocked.sellerRating).toBe(0);
  });

  it('should clamp total trust score between 0 and 100', () => {
    const maxScore = TrustService.calculate({
      platform: Platform.AMAZON,
      sellerRating: 5.0,
      reviewCount: 50000,
      hasFreeReturns: true,
      sellerAgeYears: 10,
      hasSSL: true,
    });
    expect(maxScore.total).toBeLessThanOrEqual(100);
    expect(maxScore.total).toBeGreaterThanOrEqual(95);
  });

  it('should return human-readable trust labels and colors', () => {
    expect(TrustService.getTrustLabel(95).label).toBe('HIGHLY TRUSTED');
    expect(TrustService.getTrustLabel(75).label).toBe('TRUSTED');
    expect(TrustService.getTrustLabel(50).label).toBe('MODERATE');
    expect(TrustService.getTrustLabel(30).label).toBe('LOW TRUST');
    expect(TrustService.getTrustLabel(10).label).toBe('RISKY');
  });
});
