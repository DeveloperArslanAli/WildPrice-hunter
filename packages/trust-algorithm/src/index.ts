import { Platform, TrustScoreBreakdown } from '@wildprice/shared-types';

// ─────────────────────────────────────────────────────
// Platform Baseline Reliability Scores (out of 30)
// ─────────────────────────────────────────────────────
const PLATFORM_RELIABILITY: Record<Platform, number> = {
  [Platform.AMAZON]: 30,
  [Platform.WALMART]: 28,
  [Platform.EBAY]: 24,
  [Platform.ETSY]: 22,
  [Platform.SHOPIFY]: 18,
  [Platform.ALIEXPRESS]: 14,
  [Platform.UNKNOWN]: 8,
};

export interface TrustInputs {
  platform: Platform;
  sellerRating?: number;        // 0-5
  reviewCount?: number;
  hasFreeReturns?: boolean;
  hasPaidReturns?: boolean;
  sellerAgeYears?: number;
  domainAgeYears?: number;       // for Shopify/unknown stores
  hasSSL?: boolean;
  isBlocklisted?: boolean;
}

/**
 * Calculates a composite trust score (0–100) for a platform listing.
 *
 * Weights:
 *  - Platform Reliability   → 30 pts
 *  - Seller Rating          → 25 pts
 *  - Review Volume          → 15 pts
 *  - Return Policy          → 15 pts
 *  - Seller Account Age     → 10 pts
 *  - Domain Trust           →  5 pts
 *  Total                    → 100 pts
 */
export function calculateTrustScore(inputs: TrustInputs): TrustScoreBreakdown {
  // Immediate blocklist short-circuit
  if (inputs.isBlocklisted) {
    return {
      platformReliability: 0,
      sellerRating: 0,
      reviewVolume: 0,
      returnPolicy: 0,
      sellerAccountAge: 0,
      domainTrust: 0,
      total: 0,
    };
  }

  // 1. Platform Reliability (0–30)
  const platformReliability = PLATFORM_RELIABILITY[inputs.platform] ?? 8;

  // 2. Seller Rating (0–25)
  let sellerRating = 0;
  if (inputs.sellerRating !== undefined && inputs.sellerRating >= 0) {
    sellerRating = Math.round((inputs.sellerRating / 5) * 25);
  }

  // 3. Review Volume (0–15)
  let reviewVolume = 0;
  if (inputs.reviewCount !== undefined && inputs.reviewCount > 0) {
    // log10(reviewCount) / log10(10000) * 15, clamped to 15
    const logScore = Math.log10(inputs.reviewCount) / Math.log10(10000);
    reviewVolume = Math.min(15, Math.round(logScore * 15));
  }

  // 4. Return Policy (0–15)
  let returnPolicy = 0;
  if (inputs.hasFreeReturns) {
    returnPolicy = 15;
  } else if (inputs.hasPaidReturns) {
    returnPolicy = 8;
  }

  // 5. Seller Account Age (0–10)
  let sellerAccountAge = 0;
  if (inputs.sellerAgeYears !== undefined) {
    if (inputs.sellerAgeYears >= 5) sellerAccountAge = 10;
    else if (inputs.sellerAgeYears >= 2) sellerAccountAge = 7;
    else if (inputs.sellerAgeYears >= 1) sellerAccountAge = 4;
    else sellerAccountAge = 2;
  }

  // 6. Domain Trust (0–5) — mainly for Shopify/unknown stores
  let domainTrust = 0;
  if (
    inputs.platform === Platform.AMAZON ||
    inputs.platform === Platform.WALMART ||
    inputs.platform === Platform.EBAY ||
    inputs.platform === Platform.ETSY
  ) {
    // Trusted major platforms get full domain trust automatically
    domainTrust = 5;
  } else {
    if (inputs.hasSSL) domainTrust += 2;
    if (inputs.domainAgeYears !== undefined) {
      if (inputs.domainAgeYears >= 3) domainTrust += 3;
      else if (inputs.domainAgeYears >= 1) domainTrust += 2;
      else domainTrust += 1;
    }
    domainTrust = Math.min(5, domainTrust);
  }

  const total = Math.min(
    100,
    platformReliability + sellerRating + reviewVolume + returnPolicy + sellerAccountAge + domainTrust,
  );

  return {
    platformReliability,
    sellerRating,
    reviewVolume,
    returnPolicy,
    sellerAccountAge,
    domainTrust,
    total,
  };
}

/**
 * Returns a human-readable trust label for a score.
 */
export function getTrustLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 80) return { label: 'HIGHLY TRUSTED', color: '#00CC66' };
  if (score >= 60) return { label: 'TRUSTED', color: '#C8FF00' };
  if (score >= 40) return { label: 'MODERATE', color: '#FF9900' };
  if (score >= 20) return { label: 'LOW TRUST', color: '#FF3B00' };
  return { label: 'RISKY', color: '#FF0055' };
}
