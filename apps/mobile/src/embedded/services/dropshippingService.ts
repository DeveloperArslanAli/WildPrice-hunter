import { localDb } from '../storage/localDb';
import { Platform, PlatformListing, DropshippingAnalysis } from '@wildprice/shared-types';

export class DropshippingService {
  static async analyze(productId: string): Promise<DropshippingAnalysis | null> {
    const listings = await localDb.getListingsForProduct(productId);
    if (!listings || listings.length === 0) return null;

    // Sourcing listing: AliExpress preferred, or cheapest listing
    let sourcingListing = listings.find((l) => l.platform === Platform.ALIEXPRESS);
    if (!sourcingListing) {
      const sorted = [...listings].sort((a, b) => Number(a.totalCost) - Number(b.totalCost));
      sourcingListing = sorted[0];
    }

    // Retail listing: Amazon, eBay, or Walmart (highest trusted or highest retail price)
    let retailListing = listings.find(
      (l) =>
        (l.platform === Platform.AMAZON ||
          l.platform === Platform.EBAY ||
          l.platform === Platform.WALMART) &&
        l.id !== sourcingListing?.id,
    );

    if (!retailListing) {
      const remaining = listings.filter((l) => l.id !== sourcingListing?.id);
      if (remaining.length > 0) {
        remaining.sort((a, b) => Number(b.totalCost) - Number(a.totalCost));
        retailListing = remaining[0];
      }
    }

    if (!sourcingListing || !retailListing) return null;

    const retailCost = Number(retailListing.totalCost);
    const sourceCost = Number(sourcingListing.totalCost);
    const profitMargin = Math.max(0, Math.round((retailCost - sourceCost) * 100) / 100);
    const profitMarginPercent =
      retailCost > 0 ? Math.max(0, Math.round((profitMargin / retailCost) * 100)) : 0;

    const reviewBonus = retailListing.reviewCount
      ? Math.round(Math.log10(retailListing.reviewCount) * 8)
      : 10;
    const nicheOpportunityScore = Math.min(100, Math.max(20, profitMarginPercent + reviewBonus));

    return {
      sourcingListing,
      retailListing,
      profitMargin,
      profitMarginPercent,
      nicheOpportunityScore,
    };
  }
}
