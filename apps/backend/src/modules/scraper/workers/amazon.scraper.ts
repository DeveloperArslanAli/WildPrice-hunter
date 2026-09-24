import { Injectable, Logger } from '@nestjs/common';
import { Platform } from '@wildprice/shared-types';
import { BaseScraper, RawProductData } from '../scraper.types';
import { FirecrawlService } from '../firecrawl/firecrawl.service';

/**
 * Amazon scraper powered by Firecrawl structured extraction and marketplace search.
 * Bypasses anti-bot challenges and extracts clean product schemas.
 */
@Injectable()
export class AmazonScraper implements BaseScraper {
  platform = Platform.AMAZON;
  private readonly logger = new Logger(AmazonScraper.name);

  constructor(private readonly firecrawl: FirecrawlService) {}

  async searchByKeyword(query: string): Promise<RawProductData[]> {
    return this.firecrawl.searchMarketplace(Platform.AMAZON, query, 'amazon.com', 5);
  }

  async fetchByUrl(url: string): Promise<RawProductData | null> {
    // Validate ASIN pattern: amazon.com/dp/B0...
    const asinMatch = url.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i);
    if (!asinMatch) {
      this.logger.debug(`URL has no valid Amazon ASIN pattern: ${url}`);
      return null;
    }

    const result = await this.firecrawl.scrapeProductUrl(Platform.AMAZON, url);
    if (!result) return null;

    return {
      ...result,
      platform: Platform.AMAZON,
      sellerName: result.sellerName || 'Amazon',
      returnPolicy: 'free',
    };
  }
}
