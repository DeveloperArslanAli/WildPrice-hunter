import axios from 'axios';
import { Platform } from '@wildprice/shared-types';
import { BaseScraper, RawProductData } from './scraper.types';
import { EMBEDDED_CONFIG } from '../config/embeddedConfig';

export class AmazonScraper implements BaseScraper {
  platform = Platform.AMAZON;

  async searchByKeyword(query: string, _originalImageUrl?: string): Promise<RawProductData[]> {
    if (EMBEDDED_CONFIG.RAINFOREST_API_KEY) {
      const results = await this.searchRainforest(query);
      if (results.length > 0) return results;
    }

    if (EMBEDDED_CONFIG.SERPAPI_KEY) {
      const results = await this.searchSerpApi(query);
      if (results.length > 0) return results;
    }

    return [];
  }

  async fetchByUrl(url: string): Promise<RawProductData | null> {
    const asinMatch =
      url.match(/\/dp\/([A-Z0-9]{10})/i) || url.match(/\/gp\/product\/([A-Z0-9]{10})/i);
    const asin = asinMatch?.[1]?.toUpperCase();

    // 1. Rainforest Live API lookup
    if (asin && EMBEDDED_CONFIG.RAINFOREST_API_KEY) {
      try {
        const { data } = await axios.get('https://api.rainforestapi.com/request', {
          params: {
            api_key: EMBEDDED_CONFIG.RAINFOREST_API_KEY,
            type: 'product',
            asin,
            amazon_domain: 'amazon.com',
          },
          timeout: EMBEDDED_CONFIG.NETWORK_TIMEOUT_MS,
        });

        const p = data?.product;
        if (p) {
          const price = p.buybox_winner?.price?.value ?? p.price?.value ?? 0;
          return {
            platform: Platform.AMAZON,
            title: p.title || 'Amazon Product',
            price,
            currency: 'USD',
            shippingCost: p.buybox_winner?.shipping?.price?.value ?? 0,
            productUrl: `https://www.amazon.com/dp/${asin}`,
            imageUrl: p.main_image?.link,
            rating: p.rating ?? 4.5,
            reviewCount: p.ratings_total ?? 100,
            sellerName: p.buybox_winner?.seller?.name ?? 'Amazon.com',
            inStock: true,
            returnPolicy: 'free',
            brand: p.brand,
            description: p.description,
            sellerAgeYears: 15,
            hasSsl: true,
          };
        }
      } catch {
        // Rainforest fetch failed, proceed to direct mobile fetch
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
        const ogImage =
          html.match(/<meta\s+property="og:image"\s+content="([^"]+)"/i) ||
          html.match(/data-old-hires="([^"]+)"/i);

        if (ogTitle) {
          const title = ogTitle[1].replace(/Amazon\.com\s*:\s*/i, '').replace(/:\s*Home & Kitchen.*$/i, '').trim();
          return {
            platform: Platform.AMAZON,
            title,
            price: 0,
            currency: 'USD',
            shippingCost: 0,
            productUrl: url,
            imageUrl: ogImage ? ogImage[1] : undefined,
            rating: 4.5,
            reviewCount: 200,
            sellerName: 'Amazon.com',
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

    // 3. Extract title from URL slug as last resort
    const titleMatch = url.match(/amazon\.[^/]+\/([^/]+)\/dp/i);
    if (titleMatch && titleMatch[1]) {
      const cleanSlugTitle = titleMatch[1].replace(/-/g, ' ').trim();
      return {
        platform: Platform.AMAZON,
        title: cleanSlugTitle,
        price: 0,
        currency: 'USD',
        shippingCost: 0,
        productUrl: url,
        rating: 4.5,
        reviewCount: 100,
        sellerName: 'Amazon.com',
        inStock: true,
        returnPolicy: 'free',
        sellerAgeYears: 15,
        hasSsl: true,
      };
    }

    return null;
  }

  private async searchRainforest(query: string): Promise<RawProductData[]> {
    try {
      const { data } = await axios.get('https://api.rainforestapi.com/request', {
        params: {
          api_key: EMBEDDED_CONFIG.RAINFOREST_API_KEY,
          type: 'search',
          amazon_domain: 'amazon.com',
          search_term: query,
          output: 'json',
        },
        timeout: EMBEDDED_CONFIG.NETWORK_TIMEOUT_MS,
      });

      return (data.search_results ?? [])
        .slice(0, EMBEDDED_CONFIG.MAX_SCRAPED_RESULTS_PER_PLATFORM)
        .map((item: any) => ({
          platform: Platform.AMAZON,
          title: item.title,
          price: item.price?.value ?? 0,
          currency: 'USD',
          shippingCost: 0,
          productUrl: item.link || `https://www.amazon.com/dp/${item.asin}`,
          imageUrl: item.image,
          rating: item.rating ?? 4.4,
          reviewCount: item.ratings_total ?? 450,
          sellerName: 'Amazon',
          inStock: true,
          returnPolicy: 'free' as const,
          sellerAgeYears: 10,
          hasSsl: true,
        }));
    } catch {
      return [];
    }
  }

  private async searchSerpApi(query: string): Promise<RawProductData[]> {
    try {
      const { data } = await axios.get('https://serpapi.com/search', {
        params: {
          api_key: EMBEDDED_CONFIG.SERPAPI_KEY,
          engine: 'google_shopping',
          q: `${query} amazon`,
          gl: 'us',
          hl: 'en',
          num: 20,
        },
        timeout: EMBEDDED_CONFIG.NETWORK_TIMEOUT_MS,
      });

      return (data.shopping_results ?? [])
        .filter(
          (item: any) =>
            String(item.link ?? '').toLowerCase().includes('amazon.com') ||
            String(item.source ?? '').toLowerCase().includes('amazon'),
        )
        .slice(0, EMBEDDED_CONFIG.MAX_SCRAPED_RESULTS_PER_PLATFORM)
        .map((item: any) => ({
          platform: Platform.AMAZON,
          title: item.title,
          price: parseFloat(String(item.price ?? '0').replace(/[^0-9.]/g, '')) || 0,
          currency: 'USD',
          shippingCost: 0,
          productUrl: item.link,
          imageUrl: item.thumbnail,
          rating: item.rating ?? 4.5,
          reviewCount: item.reviews ?? 210,
          sellerName: item.source ?? 'Amazon',
          inStock: true,
          returnPolicy: 'free' as const,
          sellerAgeYears: 10,
          hasSsl: true,
        }));
    } catch {
      return [];
    }
  }
}
