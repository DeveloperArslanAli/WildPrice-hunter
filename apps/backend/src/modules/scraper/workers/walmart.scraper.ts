import { Injectable, Logger } from '@nestjs/common';
import { Platform } from '@wildprice/shared-types';
import { BaseScraper, RawProductData } from '../scraper.types';
import { FirecrawlService } from '../firecrawl/firecrawl.service';

/**
 * Walmart scraper powered by Firecrawl.
 * Extracts retail and 3rd-party marketplace product data and prices.
 */
@Injectable()
export class WalmartScraper implements BaseScraper {
  platform = Platform.WALMART;
  private readonly logger = new Logger(WalmartScraper.name);

  constructor(private readonly firecrawl: FirecrawlService) {}

  async searchByKeyword(query: string): Promise<RawProductData[]> {
    return this.firecrawl.searchMarketplace(Platform.WALMART, query, 'walmart.com', 5);
  }

  async fetchByUrl(url: string): Promise<RawProductData | null> {
    // Validate Walmart product pattern: walmart.com/ip/.../123456789
    const idMatch = url.match(/\/ip\/(?:[^/]+\/)?(\d+)/i);
    if (!idMatch) {
      this.logger.debug(`URL has no valid Walmart product ID pattern: ${url}`);
      return null;
    }

    const result = await this.firecrawl.scrapeProductUrl(Platform.WALMART, url);
    if (!result) return null;

    return {
      ...result,
      platform: Platform.WALMART,
      sellerName: result.sellerName || 'Walmart',
      returnPolicy: result.returnPolicy || 'free',
    };
  }
}
