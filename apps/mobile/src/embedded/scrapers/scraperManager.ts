import { Platform } from '@wildprice/shared-types';
import { RawProductData, BaseScraper } from './scraper.types';
import { AmazonScraper } from './amazonScraper';
import { EbayScraper } from './ebayScraper';
import { AliExpressScraper } from './aliexpressScraper';
import { WalmartScraper } from './walmartScraper';

export class ScraperManager {
  private amazonScraper = new AmazonScraper();
  private ebayScraper = new EbayScraper();
  private aliexpressScraper = new AliExpressScraper();
  private walmartScraper = new WalmartScraper();

  getScraperForPlatform(platform: Platform): BaseScraper | null {
    switch (platform) {
      case Platform.AMAZON:
        return this.amazonScraper;
      case Platform.EBAY:
        return this.ebayScraper;
      case Platform.ALIEXPRESS:
        return this.aliexpressScraper;
      case Platform.WALMART:
        return this.walmartScraper;
      default:
        return null;
    }
  }

  async fetchOriginalByUrl(platform: Platform, url: string): Promise<RawProductData | null> {
    const scraper = this.getScraperForPlatform(platform);
    if (scraper && scraper.fetchByUrl) {
      try {
        const item = await scraper.fetchByUrl(url);
        if (item) return item;
      } catch {
        // Fall through
      }
    }

    // Best industrial practice: return null if no real data was scraped. Never inject fake products.
    return null;
  }

  async searchAllPlatforms(query: string, originalImageUrl?: string): Promise<RawProductData[]> {
    const scrapers: BaseScraper[] = [
      this.amazonScraper,
      this.ebayScraper,
      this.aliexpressScraper,
      this.walmartScraper,
    ];

    const results = await Promise.allSettled(
      scrapers.map((s) =>
        s.searchByKeyword(query, originalImageUrl).catch(() => [] as RawProductData[]),
      ),
    );

    const merged: RawProductData[] = [];
    results.forEach((r) => {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) {
        merged.push(...r.value);
      }
    });

    return merged;
  }
}

export const scraperManager = new ScraperManager();
