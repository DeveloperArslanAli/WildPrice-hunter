import { Injectable, Logger } from '@nestjs/common';
import { Platform } from '@wildprice/shared-types';
import { BaseScraper, RawProductData } from '../scraper.types';
import { FirecrawlService } from '../firecrawl/firecrawl.service';

/**
 * eBay scraper powered by Firecrawl structured extraction and marketplace search.
 */
@Injectable()
export class EbayScraper implements BaseScraper {
  platform = Platform.EBAY;
  private readonly logger = new Logger(EbayScraper.name);

  constructor(private readonly firecrawl: FirecrawlService) {}

  async searchByKeyword(query: string): Promise<RawProductData[]> {
    return this.firecrawl.searchMarketplace(Platform.EBAY, query, 'ebay.com/itm/', 5);
  }

  async fetchByUrl(url: string): Promise<RawProductData | null> {
    // Validate eBay item ID pattern: ebay.com/itm/123456789
    const itemMatch = url.match(/\/itm\/(?:[^/]+\/)?(\d+)/i);
    if (!itemMatch) {
      this.logger.debug(`URL has no valid eBay item ID pattern: ${url}`);
      return null;
    }

    const result = await this.firecrawl.scrapeProductUrl(Platform.EBAY, url);
    if (!result) return null;

    return {
      ...result,
      platform: Platform.EBAY,
      sellerName: result.sellerName || 'eBay Seller',
    };
  }
}
