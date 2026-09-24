import { Injectable, Logger } from '@nestjs/common';
import { Platform } from '@wildprice/shared-types';

export interface ParsedProductUrl {
  platform: Platform;
  productId?: string; // ASIN, item number, etc.
  canonicalUrl: string;
  keywords?: string;
  titleSlug?: string;
}

/**
 * Detects the platform from a URL, extracts product identifiers,
 * and cleans product titles/slugs into high-relevance search queries for other e-commerce APIs.
 */
@Injectable()
export class UrlParserService {
  private readonly logger = new Logger(UrlParserService.name);

  parse(url: string): ParsedProductUrl {
    try {
      const parsed = new URL(url);
      const hostname = parsed.hostname.toLowerCase();

      // Amazon (e.g. amazon.com, amazon.co.uk, amazon.de)
      if (/(?:^|\.)amazon\.[a-z]{2,3}(?:\.[a-z]{2})?$/i.test(hostname)) {
        return this.parseAmazon(parsed);
      }

      // eBay (e.g. ebay.com, ebay.co.uk)
      if (/(?:^|\.)ebay\.[a-z]{2,3}(?:\.[a-z]{2})?$/i.test(hostname)) {
        return this.parseEbay(parsed);
      }

      // AliExpress (e.g. aliexpress.com, aliexpress.us)
      if (/(?:^|\.)aliexpress\.[a-z]{2,3}(?:\.[a-z]{2})?$/i.test(hostname)) {
        return this.parseAliExpress(parsed);
      }

      // Walmart (e.g. walmart.com, walmart.ca)
      if (/(?:^|\.)walmart\.[a-z]{2,3}(?:\.[a-z]{2})?$/i.test(hostname)) {
        return this.parseWalmart(parsed);
      }

      // Etsy
      if (/(?:^|\.)etsy\.[a-z]{2,3}(?:\.[a-z]{2})?$/i.test(hostname)) {
        return this.parseEtsy(parsed);
      }

      // Generic Shopify detection
      if (parsed.pathname.includes('/products/') || hostname.includes('myshopify.com')) {
        return this.parseShopify(parsed);
      }

      // Unknown platform
      return {
        platform: Platform.UNKNOWN,
        canonicalUrl: url,
      };
    } catch {
      this.logger.warn(`Failed to parse URL: ${url}`);
      return { platform: Platform.UNKNOWN, canonicalUrl: url };
    }
  }

  /**
   * Cleans verbose, noise-heavy product titles (like Amazon listings)
   * into clean, focused 3-5 word search queries for eBay, Walmart, and AliExpress APIs.
   *
   * Example:
   * "Juicer Machines, Juilist 3\" Wide Mouth Centrifugal Juicer, Max 800W, 3-Speed Extractor Juicer for Whole Fruit and Vegetables Cleaning Brush Included BPA Free Stainless Steel"
   * -> "Juicer Machines Centrifugal Juicer Extractor"
   */
  cleanProductTitle(rawTitle: string): string {
    if (!rawTitle || typeof rawTitle !== 'string') return '';

    // 1. Remove bracketed / parenthetical marketing claims: [Upgraded 2026], (BPA Free), etc.
    let cleaned = rawTitle
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\[[^\]]*\]/g, ' ')
      .replace(/\{[^}]*\}/g, ' ');

    // 2. Remove specifications, dimensions, power ratings, model codes (e.g. 800W, 3", 12V, 1080P, 4K, 3-Speed)
    cleaned = cleaned
      .replace(/\b\d+[- ]*(?:w|watt|watts|v|volt|volts|rpm|oz|lb|kg|g|ml|l|liter|liters|mm|cm|inch|inches|ft|meter|meters|speed|speeds|pack|pcs|piece|pieces|count|ct)\b/gi, ' ')
      .replace(/\b\d+["']\b/g, ' ')
      .replace(/\b[A-Z0-9]{10}\b/g, ' '); // Amazon ASINs like B08N5WRWNW

    // 3. Remove non-alphanumeric noise punctuation (quotes, pipes, slashes, hyphens)
    cleaned = cleaned.replace(/[^a-zA-Z0-9\s]/g, ' ');

    // 4. Marketing filler & noise words to filter out
    const NOISE_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to', 'of', 'by', 'from',
      'pack', 'set', 'lot', 'piece', 'pcs', 'qty', 'count',
      'new', 'original', 'genuine', 'official', 'authentic', 'quality', 'premium', 'deluxe',
      'free', 'fast', 'shipping', 'delivery', 'sale', 'deal', 'offer', 'discount',
      'upgrade', 'upgraded', 'latest', 'newest', 'hot', 'best', 'top', 'great', 'high', 'pro', 'ultra', 'max',
      'easy', 'clean', 'cleaning', 'included', 'brush', 'safe', 'bpa', 'free', 'stainless', 'steel',
      'whole', 'fruit', 'fruits', 'vegetable', 'vegetables', 'wide', 'mouth',
      'men', 'women', 'mens', 'womens', "men's", "women's", 'unisex', 'kids', 'adult',
    ]);

    const words = cleaned
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !NOISE_WORDS.has(w.toLowerCase()));

    // Deduplicate words preserving order
    const seen = new Set<string>();
    const deduplicated: string[] = [];
    for (const w of words) {
      const lower = w.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        deduplicated.push(w);
      }
      if (deduplicated.length >= 6) break;
    }

    return deduplicated.join(' ').trim() || cleaned.split(/\s+/).slice(0, 4).join(' ').trim();
  }

  private parseAmazon(url: URL): ParsedProductUrl {
    // Amazon URLs: /dp/ASIN, /gp/product/ASIN, or /Title-Slug/dp/ASIN
    const asinMatch =
      url.pathname.match(/\/dp\/([A-Z0-9]{10})/i) ||
      url.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);

    const asin = asinMatch?.[1]?.toUpperCase();

    // Extract title slug before /dp/ if present: e.g. /Juicer-Machines-Juilist-Centrifugal-Extractor/dp/B08...
    let titleSlug: string | undefined;
    let keywords: string | undefined;

    const slugMatch = url.pathname.match(/^\/([^/]+)\/(?:dp|gp\/product)\/[A-Z0-9]{10}/i);
    if (slugMatch && slugMatch[1]) {
      titleSlug = slugMatch[1].replace(/-/g, ' ');
      // Clean slug into high-quality search terms (e.g. "Juicer Machines Centrifugal Extractor")
      keywords = this.cleanProductTitle(titleSlug);
    }

    return {
      platform: Platform.AMAZON,
      productId: asin,
      canonicalUrl: asin ? `https://www.amazon.com/dp/${asin}` : url.href,
      titleSlug,
      keywords, // Note: Never pass raw ASIN as keyword to external APIs
    };
  }

  private parseEbay(url: URL): ParsedProductUrl {
    // eBay: /itm/TITLE/ITEM_NUMBER or /itm/ITEM_NUMBER
    const itemMatch = url.pathname.match(/\/itm\/(?:([^/]+)\/)?(\d+)/i);
    const slug = itemMatch?.[1]?.replace(/-/g, ' ');
    const itemId = itemMatch?.[2];

    return {
      platform: Platform.EBAY,
      productId: itemId,
      canonicalUrl: itemId ? `https://www.ebay.com/itm/${itemId}` : url.href,
      titleSlug: slug,
      keywords: slug ? this.cleanProductTitle(slug) : undefined,
    };
  }

  private parseAliExpress(url: URL): ParsedProductUrl {
    // AliExpress: /item/PRODUCT_ID.html or /item/TITLE/PRODUCT_ID.html
    const itemMatch = url.pathname.match(/\/item\/(?:([^/]+)\/)?(\d+)\.html/i);
    const slug = itemMatch?.[1]?.replace(/-/g, ' ');
    const itemId = itemMatch?.[2];

    return {
      platform: Platform.ALIEXPRESS,
      productId: itemId,
      canonicalUrl: itemId ? `https://www.aliexpress.com/item/${itemId}.html` : url.href,
      titleSlug: slug,
      keywords: slug ? this.cleanProductTitle(slug) : undefined,
    };
  }

  private parseWalmart(url: URL): ParsedProductUrl {
    // Walmart: /ip/TITLE/ITEM_ID
    const itemMatch = url.pathname.match(/\/ip\/(?:([^/]+)\/)?(\d+)/i);
    const slug = itemMatch?.[1]?.replace(/-/g, ' ');
    const itemId = itemMatch?.[2];

    return {
      platform: Platform.WALMART,
      productId: itemId,
      canonicalUrl: itemId ? `https://www.walmart.com/ip/${itemId}` : url.href,
      titleSlug: slug,
      keywords: slug ? this.cleanProductTitle(slug) : undefined,
    };
  }

  private parseEtsy(url: URL): ParsedProductUrl {
    // Etsy: /listing/LISTING_ID/TITLE
    const listingMatch = url.pathname.match(/\/listing\/(\d+)(?:\/([^/]+))?/i);
    const listingId = listingMatch?.[1];
    const slug = listingMatch?.[2]?.replace(/-/g, ' ');

    return {
      platform: Platform.ETSY,
      productId: listingId,
      canonicalUrl: listingId ? `https://www.etsy.com/listing/${listingId}` : url.href,
      titleSlug: slug,
      keywords: slug ? this.cleanProductTitle(slug) : undefined,
    };
  }

  private parseShopify(url: URL): ParsedProductUrl {
    const rawSlug = url.pathname.split('/products/')[1]?.split('?')[0]?.replace(/-/g, ' ');
    return {
      platform: Platform.SHOPIFY,
      canonicalUrl: url.href,
      titleSlug: rawSlug,
      keywords: rawSlug?.trim(),
    };
  }
}
