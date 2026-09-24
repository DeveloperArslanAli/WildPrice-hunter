import axios from 'axios';
import { Platform } from '@wildprice/shared-types';
import { BaseScraper, RawProductData } from './scraper.types';
import { EMBEDDED_CONFIG } from '../config/embeddedConfig';

export class WalmartScraper implements BaseScraper {
  platform = Platform.WALMART;

  async searchByKeyword(query: string, _originalImageUrl?: string): Promise<RawProductData[]> {
    if (EMBEDDED_CONFIG.SERPAPI_KEY) {
      try {
        const { data } = await axios.get('https://serpapi.com/search', {
          params: {
            api_key: EMBEDDED_CONFIG.SERPAPI_KEY,
            engine: 'walmart',
            query,
            sort: 'best_seller',
          },
          timeout: EMBEDDED_CONFIG.NETWORK_TIMEOUT_MS,
        });

        const items = data.organic_results ?? [];
        if (items.length > 0) {
          return items
            .slice(0, EMBEDDED_CONFIG.MAX_SCRAPED_RESULTS_PER_PLATFORM)
            .map((item: any) => this.mapWalmartResult(item));
        }
      } catch {
        // SerpAPI error
      }
    }

    // No fake mock listings
    return [];
  }

  async fetchByUrl(url: string): Promise<RawProductData | null> {
    const match = url.match(/\/ip\/(?:([^/]+)\/)?(\d+)/i);
    const slug = match ? match[1] : null;
    const productId = match ? match[2] : null;

    // 1. SerpAPI Walmart Product API if available
    if (productId && EMBEDDED_CONFIG.SERPAPI_KEY) {
      try {
        const { data } = await axios.get('https://serpapi.com/search', {
          params: {
            api_key: EMBEDDED_CONFIG.SERPAPI_KEY,
            engine: 'walmart_product',
            product_id: productId,
          },
          timeout: EMBEDDED_CONFIG.NETWORK_TIMEOUT_MS,
        });

        const res = data.product_result;
        if (res) {
          return {
            platform: Platform.WALMART,
            title: res.title ?? 'Walmart Product',
            price: res.price_map?.current_price ?? res.price ?? 0,
            currency: 'USD',
            shippingCost: res.shipping?.is_free ? 0 : 5.99,
            productUrl: url,
            imageUrl: res.images?.[0]?.url,
            rating: res.rating ?? 4.4,
            reviewCount: res.reviews ?? 100,
            sellerName: res.seller_name ?? 'Walmart.com',
            inStock: true,
            returnPolicy: 'free',
            sellerAgeYears: 15,
            hasSsl: true,
          };
        }
      } catch {
        // Fall through
      }
    }

    // 2. Direct mobile HTTP fetch
    try {
      const res = await axios.get(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        timeout: EMBEDDED_CONFIG.NETWORK_TIMEOUT_MS,
      });

      if (res.status === 200 && typeof res.data === 'string') {
        const html = res.data;
        const ogTitle =
          html.match(/<meta\s+property="og:title"\s+content="([^"]+)"/i) ||
          html.match(/<title>([^<]+)<\/title>/i);
        const ogImage = html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i);
        const priceMatch = html.match(/itemprop="price"\s+content="([^"]+)"/i);

        if (ogTitle) {
          const title = ogTitle[1].replace(/\s*-\s*Walmart\.com.*$/i, '').trim();
          return {
            platform: Platform.WALMART,
            title,
            price: priceMatch ? parseFloat(priceMatch[1]) || 0 : 0,
            currency: 'USD',
            shippingCost: 0,
            productUrl: url,
            imageUrl: ogImage ? ogImage[1] : undefined,
            rating: 4.4,
            reviewCount: 100,
            sellerName: 'Walmart.com',
            inStock: true,
            returnPolicy: 'free',
            sellerAgeYears: 15,
            hasSsl: true,
          };
        }
      }
    } catch {
      // Fall through
    }

    // 3. Extract title from URL slug if present
    if (slug) {
      const title = slug.replace(/-/g, ' ').trim();
      return {
        platform: Platform.WALMART,
        title,
        price: 0,
        currency: 'USD',
        shippingCost: 0,
        productUrl: url,
        rating: 4.4,
        reviewCount: 50,
        sellerName: 'Walmart.com',
        inStock: true,
        returnPolicy: 'free',
        sellerAgeYears: 15,
        hasSsl: true,
      };
    }

    return null;
  }

  private mapWalmartResult(item: any): RawProductData {
    const primaryOffer = item.primary_offer ?? {};
    const rawPrice =
      primaryOffer.offer_price ??
      parseFloat(String(item.price ?? '0').replace(/[^0-9.]/g, ''));
    const price = rawPrice || 0;

    return {
      platform: Platform.WALMART,
      title: item.title,
      price,
      currency: 'USD',
      shippingCost: item.shipping?.free_shipping ? 0 : 5.99,
      productUrl: item.product_page_url ?? `https://www.walmart.com/ip/${item.us_item_id}`,
      imageUrl: item.thumbnail,
      rating: item.rating?.average_rating ?? 4.3,
      reviewCount: item.rating?.number_of_reviews ?? 100,
      sellerName: item.seller_name ?? 'Walmart',
      inStock: !item.out_of_stock,
      returnPolicy: 'free',
      sellerAgeYears: 10,
      hasSsl: true,
    };
  }
}
