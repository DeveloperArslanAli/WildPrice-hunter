import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { Platform } from '@wildprice/shared-types';
import { RawProductData } from '../scraper.types';
import {
  FirecrawlScrapeResponse,
  FirecrawlSearchResponse,
  FirecrawlSearchResultItem,
  ProductExtractSchema,
} from './firecrawl.types';

@Injectable()
export class FirecrawlService {
  private readonly logger = new Logger(FirecrawlService.name);
  private readonly apiKey: string | undefined;
  private readonly apiUrl: string;

  constructor(
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.apiKey = this.config.get<string>('FIRECRAWL_API_KEY');
    const rawUrl = this.config.get<string>('FIRECRAWL_API_URL') || 'https://api.firecrawl.dev';
    const cleanUrl = rawUrl.replace(/\/+$/, '');
    this.apiUrl = cleanUrl.endsWith('/v1') ? cleanUrl : `${cleanUrl}/v1`;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0 && !this.apiKey.includes('your_firecrawl'));
  }

  /**
   * Scrapes a single product URL using Firecrawl structured JSON extraction.
   * Gracefully falls back to direct OpenGraph / JSON-LD extraction if Firecrawl is unavailable.
   */
  async scrapeProductUrl(platform: Platform, url: string): Promise<RawProductData | null> {
    if (!this.isConfigured()) {
      this.logger.debug(`No active FIRECRAWL_API_KEY — using direct fallback parser for ${url}`);
      return this.fallbackDirectScrape(platform, url);
    }

    try {
      this.logger.log(`[Firecrawl] Scraping product URL via ${this.apiUrl}/scrape: ${url}`);

      const { data } = await firstValueFrom(
        this.http.post<FirecrawlScrapeResponse>(
          `${this.apiUrl}/scrape`,
          {
            url,
            formats: ['json'],
            jsonOptions: {
              schema: ProductExtractSchema,
            },
            onlyMainContent: true,
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 25000,
          },
        ),
      );

      const json = data.data?.json;
      const metadata = data.data?.metadata;

      const title = json?.title || metadata?.title;
      const rawPrice = json?.price;
      const price = typeof rawPrice === 'number' && !isNaN(rawPrice) ? rawPrice : 0;

      if (!title) {
        this.logger.warn(`[Firecrawl] Incomplete metadata from Firecrawl for ${url} — falling back`);
        return this.fallbackDirectScrape(platform, url);
      }

      return {
        platform,
        title,
        price,
        currency: json?.currency || 'USD',
        shippingCost: json?.shippingCost ?? 0,
        productUrl: url,
        imageUrl: json?.imageUrl || metadata?.ogImage,
        rating: json?.rating,
        reviewCount: json?.reviewCount,
        sellerName: json?.sellerName || this.getDefaultSellerName(platform),
        sellerUrl: json?.sellerUrl,
        inStock: json?.inStock ?? true,
        returnPolicy: json?.returnPolicy || 'free',
        brand: json?.brand,
        description: json?.description || metadata?.description,
      };
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || String(err);
      this.logger.warn(`[Firecrawl] Cloud scrape error for ${url}: ${msg} — activating fallback`);
      return this.fallbackDirectScrape(platform, url);
    }
  }

  /**
   * Searches a specific marketplace domain using Firecrawl web search and extracts structured product listings.
   */
  async searchMarketplace(
    platform: Platform,
    query: string,
    domain: string,
    limit = 5,
  ): Promise<RawProductData[]> {
    if (!this.isConfigured()) {
      this.logger.debug(`No active FIRECRAWL_API_KEY — skipping cloud search for "${query}" on ${domain}`);
      return [];
    }

    try {
      this.logger.log(`[Firecrawl] Searching ${domain} for "${query}" (limit: ${limit})`);

      const { data } = await firstValueFrom(
        this.http.post<FirecrawlSearchResponse>(
          `${this.apiUrl}/search`,
          {
            query: `${query} site:${domain}`,
            limit,
            scrapeOptions: {
              formats: ['json'],
              jsonOptions: {
                schema: ProductExtractSchema,
              },
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json',
            },
            timeout: 30000,
          },
        ),
      );

      const items = data.data || [];
      const results: RawProductData[] = [];

      for (const item of items) {
        const mapped = this.mapSearchResultToRawProduct(platform, item, domain);
        if (mapped) {
          results.push(mapped);
        }
      }

      return results.slice(0, limit);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || String(err);
      this.logger.warn(`[Firecrawl] Search failed for "${query}" on ${domain}: ${msg}`);
      return [];
    }
  }

  /**
   * Direct resilient fallback extracting JSON-LD schema or OpenGraph metadata
   * if Firecrawl is unconfigured or encounters cloud rate-limiting.
   */
  private async fallbackDirectScrape(platform: Platform, url: string): Promise<RawProductData | null> {
    try {
      this.logger.debug(`[Firecrawl Fallback] Attempting direct OpenGraph/JSON-LD fetch for ${url}`);
      const { data } = await firstValueFrom(
        this.http.get(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
          },
          timeout: 12000,
        }),
      );

      const html = typeof data === 'string' ? data : JSON.stringify(data);

      // 1. Try JSON-LD Product schema
      const jsonLdMatches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
      for (const match of jsonLdMatches) {
        try {
          const parsed = JSON.parse(match[1]);
          const item = Array.isArray(parsed)
            ? parsed.find((p) => p && p['@type'] === 'Product')
            : parsed && parsed['@type'] === 'Product'
            ? parsed
            : null;

          if (item && item.name) {
            const rawPrice = item.offers?.price ?? item.offers?.[0]?.price ?? '0';
            const price = parseFloat(String(rawPrice).replace(/[^0-9.]/g, '')) || 0;
            return {
              platform,
              title: item.name,
              price,
              currency: item.offers?.priceCurrency ?? 'USD',
              shippingCost: 0,
              productUrl: url,
              imageUrl: Array.isArray(item.image) ? item.image[0] : item.image,
              rating: item.aggregateRating?.ratingValue ? parseFloat(item.aggregateRating.ratingValue) : undefined,
              reviewCount: item.aggregateRating?.reviewCount ? parseInt(item.aggregateRating.reviewCount, 10) : undefined,
              sellerName: item.offers?.seller?.name || this.getDefaultSellerName(platform),
              inStock: !String(item.offers?.availability).includes('OutOfStock'),
              returnPolicy: 'free',
              brand: typeof item.brand === 'string' ? item.brand : item.brand?.name,
              description: item.description,
            };
          }
        } catch {
          // Continue scanning
        }
      }

      // 2. Try Open Graph tags
      const ogTitle = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)?.[1];
      const ogImage = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)?.[1];
      const ogPrice =
        html.match(/<meta[^>]*property=["'](?:og:price:amount|product:price:amount)["'][^>]*content=["']([^"']+)["']/i)?.[1] ||
        html.match(/"price":\s*"([^"]+)"/i)?.[1];

      if (ogTitle) {
        const cleanTitle = ogTitle.replace(/\s*\|\s*(?:eBay|Amazon|Walmart|AliExpress).*$/i, '').trim();
        return {
          platform,
          title: cleanTitle,
          price: ogPrice ? parseFloat(ogPrice.replace(/[^0-9.]/g, '')) || 0 : 0,
          currency: 'USD',
          shippingCost: 0,
          productUrl: url,
          imageUrl: ogImage,
          sellerName: this.getDefaultSellerName(platform),
          inStock: true,
          returnPolicy: 'free',
        };
      }
    } catch (err: any) {
      this.logger.debug(`[Firecrawl Fallback] Direct fetch failed for ${url}: ${err.message}`);
    }

    return null;
  }

  private mapSearchResultToRawProduct(
    platform: Platform,
    item: FirecrawlSearchResultItem,
    domain: string,
  ): RawProductData | null {
    const json = item.json;
    const metadata = item.metadata;
    const title = json?.title || item.title || metadata?.title;
    const productUrl = item.url || metadata?.sourceURL;

    if (!title || !productUrl) {
      return null;
    }

    // Determine price from structured JSON or regex fallback from title/description/markdown
    let price = json?.price;
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      const textToScan = `${title} ${item.description || ''} ${item.markdown || ''}`;
      const priceMatch =
        textToScan.match(/(?:US\s*)?\$([0-9]{1,5}(?:\.[0-9]{2})?)/i) ||
        textToScan.match(/([0-9]{1,5}(?:\.[0-9]{2})?)\s*USD/i);
      price = priceMatch ? parseFloat(priceMatch[1]) : 0;
    }

    return {
      platform,
      title,
      price: price || 0,
      currency: json?.currency || 'USD',
      shippingCost: json?.shippingCost ?? 0,
      productUrl,
      imageUrl: json?.imageUrl || metadata?.ogImage,
      rating: json?.rating,
      reviewCount: json?.reviewCount,
      sellerName: json?.sellerName || this.getDefaultSellerName(platform),
      sellerUrl: json?.sellerUrl,
      inStock: json?.inStock ?? true,
      returnPolicy: json?.returnPolicy || 'free',
      brand: json?.brand,
      description: json?.description || item.description,
    };
  }

  private getDefaultSellerName(platform: Platform): string {
    switch (platform) {
      case Platform.AMAZON:
        return 'Amazon';
      case Platform.EBAY:
        return 'eBay Seller';
      case Platform.ALIEXPRESS:
        return 'AliExpress Store';
      case Platform.WALMART:
        return 'Walmart';
      default:
        return 'Verified Merchant';
    }
  }
}
