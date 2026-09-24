import { describe, it, expect } from 'vitest';
import { calculateTrustScore, getTrustLabel } from './index';
import { Platform } from '@wildprice/shared-types';

describe('Trust Score Algorithm (QA & Stress Test Suite)', () => {
  describe('Blocklist & Immediate Short-Circuits', () => {
    it('should return strict 0 across all sub-scores when store is blocklisted', () => {
      const score = calculateTrustScore({
        platform: Platform.AMAZON,
        sellerRating: 5.0,
        reviewCount: 99999,
        hasFreeReturns: true,
        sellerAgeYears: 10,
        isBlocklisted: true,
      });

      expect(score.total).toBe(0);
      expect(score.platformReliability).toBe(0);
      expect(score.sellerRating).toBe(0);
      expect(score.reviewVolume).toBe(0);
      expect(score.returnPolicy).toBe(0);
      expect(score.sellerAccountAge).toBe(0);
      expect(score.domainTrust).toBe(0);
    });
  });

  describe('Platform Reliability Scoring (0–30 pts)', () => {
    const expectations: [Platform, number][] = [
      [Platform.AMAZON, 30],
      [Platform.WALMART, 28],
      [Platform.EBAY, 24],
      [Platform.ETSY, 22],
      [Platform.SHOPIFY, 18],
      [Platform.ALIEXPRESS, 14],
      [Platform.UNKNOWN, 8],
    ];

    it.each(expectations)(
      'should assign correct platform reliability: %s -> %d pts',
      (platform, expectedPts) => {
        const score = calculateTrustScore({ platform });
        expect(score.platformReliability).toBe(expectedPts);
      },
    );
  });

  describe('Seller Rating Scoring (0–25 pts)', () => {
    it('should award 25 pts for 5.0 rating', () => {
      const score = calculateTrustScore({ platform: Platform.UNKNOWN, sellerRating: 5.0 });
      expect(score.sellerRating).toBe(25);
    });

    it('should award 20 pts for 4.0 rating', () => {
      const score = calculateTrustScore({ platform: Platform.UNKNOWN, sellerRating: 4.0 });
      expect(score.sellerRating).toBe(20);
    });

    it('should award 0 pts for 0 rating or missing rating', () => {
      const zeroScore = calculateTrustScore({ platform: Platform.UNKNOWN, sellerRating: 0 });
      expect(zeroScore.sellerRating).toBe(0);

      const undefinedScore = calculateTrustScore({ platform: Platform.UNKNOWN });
      expect(undefinedScore.sellerRating).toBe(0);
    });
  });

  describe('Review Volume Logarithmic Scoring (0–15 pts)', () => {
    it('should clamp review score at 15 for 10,000+ reviews', () => {
      const score10k = calculateTrustScore({ platform: Platform.UNKNOWN, reviewCount: 10000 });
      expect(score10k.reviewVolume).toBe(15);

      const score100k = calculateTrustScore({ platform: Platform.UNKNOWN, reviewCount: 100000 });
      expect(score100k.reviewVolume).toBe(15);
    });

    it('should scale accurately for small to mid-sized stores', () => {
      const score10 = calculateTrustScore({ platform: Platform.UNKNOWN, reviewCount: 10 });
      expect(score10.reviewVolume).toBe(4);

      const score100 = calculateTrustScore({ platform: Platform.UNKNOWN, reviewCount: 100 });
      expect(score100.reviewVolume).toBe(8);

      const score1000 = calculateTrustScore({ platform: Platform.UNKNOWN, reviewCount: 1000 });
      expect(score1000.reviewVolume).toBe(11);
    });
  });

  describe('Return Policy Scoring (0–15 pts)', () => {
    it('should award 15 pts for free returns', () => {
      const score = calculateTrustScore({ platform: Platform.UNKNOWN, hasFreeReturns: true });
      expect(score.returnPolicy).toBe(15);
    });

    it('should award 8 pts for paid returns', () => {
      const score = calculateTrustScore({ platform: Platform.UNKNOWN, hasPaidReturns: true });
      expect(score.returnPolicy).toBe(8);
    });

    it('should award 0 pts when no return policy is guaranteed', () => {
      const score = calculateTrustScore({ platform: Platform.UNKNOWN });
      expect(score.returnPolicy).toBe(0);
    });
  });

  describe('Domain Trust & SSL Verification (0–5 pts)', () => {
    it('should automatically award full 5 pts domain trust for major marketplaces', () => {
      const platforms = [Platform.AMAZON, Platform.WALMART, Platform.EBAY, Platform.ETSY];
      for (const p of platforms) {
        const score = calculateTrustScore({ platform: p });
        expect(score.domainTrust).toBe(5);
      }
    });

    it('should audit SSL and domain age for independent Shopify stores', () => {
      const newShopWithoutSsl = calculateTrustScore({
        platform: Platform.SHOPIFY,
        hasSSL: false,
        domainAgeYears: 0.5,
      });
      expect(newShopWithoutSsl.domainTrust).toBe(1);

      const establishedShopWithSsl = calculateTrustScore({
        platform: Platform.SHOPIFY,
        hasSSL: true,
        domainAgeYears: 4,
      });
      expect(establishedShopWithSsl.domainTrust).toBe(5);
    });
  });

  describe('Score Normalization & Label Classification', () => {
    it('should never exceed maximum 100 total score', () => {
      const perfectScore = calculateTrustScore({
        platform: Platform.AMAZON,
        sellerRating: 5.0,
        reviewCount: 50000,
        hasFreeReturns: true,
        sellerAgeYears: 10,
        hasSSL: true,
      });
      expect(perfectScore.total).toBe(100);
    });

    it('should classify labels and color codes accurately across ranges', () => {
      expect(getTrustLabel(95)).toEqual({ label: 'HIGHLY TRUSTED', color: '#00CC66' });
      expect(getTrustLabel(80)).toEqual({ label: 'HIGHLY TRUSTED', color: '#00CC66' });
      expect(getTrustLabel(75)).toEqual({ label: 'TRUSTED', color: '#C8FF00' });
      expect(getTrustLabel(60)).toEqual({ label: 'TRUSTED', color: '#C8FF00' });
      expect(getTrustLabel(50)).toEqual({ label: 'MODERATE', color: '#FF9900' });
      expect(getTrustLabel(40)).toEqual({ label: 'MODERATE', color: '#FF9900' });
      expect(getTrustLabel(30)).toEqual({ label: 'LOW TRUST', color: '#FF3B00' });
      expect(getTrustLabel(20)).toEqual({ label: 'LOW TRUST', color: '#FF3B00' });
      expect(getTrustLabel(15)).toEqual({ label: 'RISKY', color: '#FF0055' });
      expect(getTrustLabel(0)).toEqual({ label: 'RISKY', color: '#FF0055' });
    });
  });
});
