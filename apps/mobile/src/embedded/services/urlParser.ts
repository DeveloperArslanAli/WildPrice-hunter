import { Platform } from '@wildprice/shared-types';

export interface ParsedProductUrl {
  platform: Platform;
  productId?: string; // ASIN, item number, etc.
  canonicalUrl: string;
  keywords?: string;
}

/**
 * Embedded URL Parser for detecting platforms and extracting product IDs.
 * Pure TypeScript, zero external dependencies.
 */
export class UrlParser {
  static parse(rawUrl: string): ParsedProductUrl {
    try {
      // Clean and normalize
      let url = rawUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      // Check for simple domain regex if URL constructor fails in some JS runtimes
      const hostnameMatch = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/]+)/i);
      const hostname = hostnameMatch ? hostnameMatch[1].toLowerCase() : '';

      // Amazon
      if (hostname.includes('amazon.')) {
        return this.parseAmazon(url);
      }

      // eBay
      if (hostname.includes('ebay.')) {
        return this.parseEbay(url);
      }

      // AliExpress
      if (hostname.includes('aliexpress.')) {
        return this.parseAliExpress(url);
      }

      // Walmart
      if (hostname.includes('walmart.')) {
        return this.parseWalmart(url);
      }

      // Etsy
      if (hostname.includes('etsy.')) {
        return this.parseEtsy(url);
      }

      // Generic Shopify detection
      if (url.includes('/products/') || hostname.includes('myshopify.com')) {
        return this.parseShopify(url);
      }

      // Unknown platform
      return {
        platform: Platform.UNKNOWN,
        canonicalUrl: url,
      };
    } catch {
      return { platform: Platform.UNKNOWN, canonicalUrl: rawUrl };
    }
  }

  private static parseAmazon(url: string): ParsedProductUrl {
    const asinMatch =
      url.match(/\/dp\/([A-Z0-9]{10})/i) ||
      url.match(/\/gp\/product\/([A-Z0-9]{10})/i);

    const asin = asinMatch?.[1]?.toUpperCase();
    const slugMatch = url.match(/amazon\.[^/]+\/([^/]+)\/dp/i);
    const slugTitle = slugMatch ? slugMatch[1].replace(/-/g, ' ').trim() : undefined;

    return {
      platform: Platform.AMAZON,
      productId: asin,
      canonicalUrl: asin ? `https://www.amazon.com/dp/${asin}` : url,
      keywords: slugTitle || asin,
    };
  }

  private static parseEbay(url: string): ParsedProductUrl {
    const itemMatch = url.match(/\/itm\/(?:([^/]+)\/)?(\d+)/i);
    const slug = itemMatch?.[1];
    const itemId = itemMatch?.[2] || (url.match(/\/itm\/(\d+)/i)?.[1]);

    const decoded = decodeURIComponent(url);
    const brandMatch = decoded.match(/brand=([a-zA-Z0-9_-]+)/i);
    const brand = brandMatch ? brandMatch[1] : undefined;

    const slugTitle = slug && !/^\d+$/.test(slug) ? slug.replace(/[-_]/g, ' ') : undefined;
    const keywords = slugTitle || (brand ? `${brand}` : itemId);

    return {
      platform: Platform.EBAY,
      productId: itemId,
      canonicalUrl: itemId ? `https://www.ebay.com/itm/${itemId}` : url,
      keywords,
    };
  }

  private static parseAliExpress(url: string): ParsedProductUrl {
    const itemMatch = url.match(/\/item\/(\d+)\.html/i) || url.match(/\/item\/(\d+)/i);
    const itemId = itemMatch?.[1];
    return {
      platform: Platform.ALIEXPRESS,
      productId: itemId,
      canonicalUrl: url,
      keywords: itemId,
    };
  }

  private static parseWalmart(url: string): ParsedProductUrl {
    const itemMatch = url.match(/\/ip\/(?:([^/]+)\/)?(\d+)/i);
    const slug = itemMatch?.[1];
    const itemId = itemMatch?.[2] || (url.match(/\/ip\/(\d+)/i)?.[1]);
    const slugTitle = slug && !/^\d+$/.test(slug) ? slug.replace(/[-_]/g, ' ') : undefined;

    return {
      platform: Platform.WALMART,
      productId: itemId,
      canonicalUrl: url,
      keywords: slugTitle || itemId,
    };
  }

  private static parseEtsy(url: string): ParsedProductUrl {
    const listingMatch = url.match(/\/listing\/(\d+)/i);
    const listingId = listingMatch?.[1];
    return {
      platform: Platform.ETSY,
      productId: listingId,
      canonicalUrl: url,
    };
  }

  private static parseShopify(url: string): ParsedProductUrl {
    const productSlug = url.split('/products/')[1]?.split('?')[0]?.replace(/-/g, ' ');
    return {
      platform: Platform.SHOPIFY,
      canonicalUrl: url,
      keywords: productSlug,
    };
  }
}
