import { Injectable, Logger } from '@nestjs/common';
import { Platform } from '@wildprice/shared-types';
import { BaseScraper, RawProductData } from '../scraper.types';
import { FirecrawlService } from '../firecrawl/firecrawl.service';

/**
 * AliExpress scraper powered by Firecrawl.
 * Provides both direct URL scraping and multi-listing keyword search for dropshipping sourcing.
 */
@Injectable()
export class AliExpressScraper implements BaseScraper {
  platform = Platform.ALIEXPRESS;
  private readonly logger = new Logger(AliExpressScraper.name);

  constructor(private readonly firecrawl: FirecrawlService) {}

  async searchByKeyword(query: string): Promise<RawProductData[]> {
    return this.firecrawl.searchMarketplace(Platform.ALIEXPRESS, query, 'aliexpress.com', 5);
  }

  async fetchByUrl(url: string): Promise<RawProductData | null> {
    // Validate AliExpress product pattern: aliexpress.com/item/12345678.html
    const isAliExpress = /aliexpress\.com\/item\/(?:[^/]+\/)?(\d+)/i.test(url) || url.includes('aliexpress.com');
    if (!isAliExpress) {
      this.logger.debug(`URL has no valid AliExpress product pattern: ${url}`);
      return null;
    }

    const result = await this.firecrawl.scrapeProductUrl(Platform.ALIEXPRESS, url);
    if (!result) return null;

    return {
      ...result,
      platform: Platform.ALIEXPRESS,
      sellerName: result.sellerName || 'AliExpress Store',
      returnPolicy: result.returnPolicy || 'paid',
    };
  }
}
