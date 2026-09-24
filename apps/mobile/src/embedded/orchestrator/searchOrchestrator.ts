import {
  SearchInputType,
  SearchSessionStatus,
  SearchSession,
  Product,
  PlatformListing,
  Platform,
} from '@wildprice/shared-types';
import { localDb } from '../storage/localDb';
import { UrlParser } from '../services/urlParser';
import { TrustService } from '../services/trustService';
import { GeminiClient } from '../services/geminiClient';
import { scraperManager } from '../scrapers/scraperManager';
import { localEventBus } from '../events/localEventBus';
import { RawProductData } from '../scrapers/scraper.types';
import { EMBEDDED_CONFIG } from '../config/embeddedConfig';

/**
 * v0.4: Retry utility — retries an async operation up to maxRetries times
 * with a configurable delay between attempts.
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = EMBEDDED_CONFIG.SCRAPER_MAX_RETRIES,
  delayMs = EMBEDDED_CONFIG.SCRAPER_RETRY_DELAY_MS,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        await new Promise<void>((res) => setTimeout(() => res(), delayMs * (attempt + 1)));
      }
    }
  }
  throw lastError;
}

export class SearchOrchestrator {
  static async startUrlSearch(url: string): Promise<{ sessionId: string; status: string }> {
    await localDb.checkSearchLimit();
    const sessionId = this.generateSessionId();

    const session: SearchSession = {
      id: sessionId,
      inputType: SearchInputType.URL,
      inputValue: url,
      status: SearchSessionStatus.PROCESSING,
      resultCount: 0,
      createdAt: new Date().toISOString(),
    };

    await localDb.saveSession(session);
    await localDb.addHistory(sessionId);

    // Launch asynchronously in background without blocking response
    setTimeout(() => {
      this.executeSearch(sessionId, SearchInputType.URL, url).catch((err) => {
        console.warn(`[SearchOrchestrator] Error executing search:`, err);
      });
    }, 50);

    return { sessionId, status: SearchSessionStatus.PROCESSING };
  }

  static async startTextSearch(
    query: string,
    category?: string,
  ): Promise<{ sessionId: string; status: string }> {
    await localDb.checkSearchLimit();
    const sessionId = this.generateSessionId();

    const session: SearchSession = {
      id: sessionId,
      inputType: SearchInputType.TEXT,
      inputValue: query,
      status: SearchSessionStatus.PROCESSING,
      resultCount: 0,
      createdAt: new Date().toISOString(),
    };

    await localDb.saveSession(session);
    await localDb.addHistory(sessionId);

    setTimeout(() => {
      this.executeSearch(sessionId, SearchInputType.TEXT, query, category).catch((err) => {
        console.warn(`[SearchOrchestrator] Error executing search:`, err);
      });
    }, 50);

    return { sessionId, status: SearchSessionStatus.PROCESSING };
  }

  static async startImageSearch(
    imageBase64: string,
  ): Promise<{ sessionId: string; status: string }> {
    await localDb.checkSearchLimit();
    const sessionId = this.generateSessionId();

    // Query AI for image keywords
    const query = await GeminiClient.extractKeywordsFromImage(imageBase64);

    const session: SearchSession = {
      id: sessionId,
      inputType: SearchInputType.IMAGE,
      inputValue: query,
      status: SearchSessionStatus.PROCESSING,
      resultCount: 0,
      createdAt: new Date().toISOString(),
    };

    await localDb.saveSession(session);
    await localDb.addHistory(sessionId);

    setTimeout(() => {
      this.executeSearch(sessionId, SearchInputType.IMAGE, query).catch((err) => {
        console.warn(`[SearchOrchestrator] Error executing search:`, err);
      });
    }, 50);

    return { sessionId, status: SearchSessionStatus.PROCESSING };
  }

  private static async executeSearch(
    sessionId: string,
    inputType: SearchInputType,
    inputValue: string,
    category?: string,
  ): Promise<void> {
    const session = await localDb.getSession(sessionId);
    if (!session) return;

    try {
      // 1. Initial Progress
      localEventBus.emit('search:progress', {
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 15,
        message: 'Initializing search across platforms...',
      });

      let searchQuery = inputValue;
      let originalProduct: Product | null = null;
      let originalListing: PlatformListing | null = null;

      // If URL input, fetch original product — v0.4: wrapped in withRetry
      if (inputType === SearchInputType.URL) {
        const parsed = UrlParser.parse(inputValue);
        const rawOriginal = await withRetry(() =>
          scraperManager.fetchOriginalByUrl(parsed.platform, inputValue),
        );

        if (rawOriginal) {
          originalProduct = await this.saveOrGetProduct(rawOriginal);
          searchQuery = SearchOrchestrator.buildKeywordQuery(rawOriginal);

          originalListing = await this.saveListingRecord(
            sessionId,
            rawOriginal,
            originalProduct.id,
            1.0,
          );
          (session as any).originalProductId = originalProduct.id;
          (session as any).originalListingId = originalListing.id;
          session.originalProduct = originalProduct;
          await localDb.saveSession(session);
        } else if (parsed.keywords) {
          searchQuery = parsed.keywords;
        }
      }

      // 2. AI Fingerprinting
      localEventBus.emit('search:progress', {
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 35,
        message: 'Fingerprinting item & extracting key specs...',
      });

      const fingerprint = await GeminiClient.extractFingerprint({
        title: originalProduct ? originalProduct.title : searchQuery,
        brand: originalProduct?.brand,
        category: originalProduct?.category || category,
      });

      if (fingerprint?.canonicalTitle) {
        searchQuery = fingerprint.canonicalTitle;
      }

      if (originalProduct) {
        originalProduct.fingerprint = fingerprint;
        await localDb.saveProduct(originalProduct);
      }

      // 3. Parallel platform scraping — v0.4: wrapped in withRetry for resilience
      localEventBus.emit('search:progress', {
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 55,
        message: 'Scanning Amazon, eBay, AliExpress, and Walmart in parallel...',
      });

      const rawResults = await withRetry(() =>
        scraperManager.searchAllPlatforms(searchQuery, originalProduct?.imageUrl),
      );

      // 4. Trust scoring & comparison auditing
      localEventBus.emit('search:progress', {
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 80,
        message: `Auditing trust scores and comparing ${rawResults.length} listings...`,
      });

      const resultListingIds: string[] = [];
      let lowestPrice = originalListing ? originalListing.price : Infinity;

      for (const raw of rawResults) {
        try {
          // Avoid duplicate of original
          if (
            originalListing &&
            raw.platform === originalListing.platform &&
            raw.productUrl === originalListing.productUrl
          ) {
            continue;
          }

          // Calculate similarity
          let similarityScore = 0.8;
          if (fingerprint && raw.title) {
            similarityScore = await GeminiClient.calculateSimilarity(fingerprint, raw.title);
          }

          if (similarityScore < 0.5) continue;

          // Calculate trust
          const trustBreakdown = TrustService.calculate({
            platform: raw.platform,
            sellerRating: raw.rating,
            reviewCount: raw.reviewCount,
            hasFreeReturns: raw.returnPolicy === 'free',
            hasPaidReturns: raw.returnPolicy === 'paid',
            sellerAgeYears: raw.sellerAgeYears,
            hasSSL: raw.hasSsl ?? true,
          });

          // Save product & listing
          const product = await this.saveOrGetProduct(raw);
          const listing = await this.saveListingRecord(
            sessionId,
            raw,
            product.id,
            similarityScore,
            trustBreakdown,
          );

          resultListingIds.push(listing.id);
          if (listing.price < lowestPrice) {
            lowestPrice = listing.price;
          }

          // Emit real-time listing found
          localEventBus.emit('search:listing_found', {
            sessionId,
            listing,
            lowestPriceSoFar: lowestPrice,
          });
        } catch {
          // Ignore individual listing errors
        }
      }

      // 5. Completion
      session.status = SearchSessionStatus.DONE;
      session.resultCount = resultListingIds.length;
      (session as any).resultListingIds = resultListingIds;
      session.completedAt = new Date().toISOString();
      await localDb.saveSession(session);

      const savings = originalListing ? Math.max(0, originalListing.price - lowestPrice) : 0;

      localEventBus.emit('search:completed', {
        sessionId,
        resultCount: resultListingIds.length,
        lowestPrice: lowestPrice === Infinity ? undefined : lowestPrice,
        savingsVsOriginal: savings,
        completedAt: session.completedAt,
      });
    } catch (err: any) {
      session.status = SearchSessionStatus.FAILED;
      (session as any).errorMessage = err?.message || 'Search encountered an issue';
      session.completedAt = new Date().toISOString();
      await localDb.saveSession(session);

      localEventBus.emit('search:progress', {
        sessionId,
        status: SearchSessionStatus.FAILED,
        progress: 0,
        message: err?.message || 'Hunt failed',
      });
    }
  }

  private static async saveOrGetProduct(raw: RawProductData): Promise<Product> {
    const existing = await localDb.findProductByTitle(raw.title);
    if (existing) return existing;

    const newProduct: Product = {
      id: `prod_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: raw.title,
      brand: raw.brand,
      imageUrl: raw.imageUrl,
      description: raw.description,
      createdAt: new Date().toISOString(),
    };

    return localDb.saveProduct(newProduct);
  }

  private static async saveListingRecord(
    sessionId: string,
    raw: RawProductData,
    productId: string,
    similarityScore: number,
    trustBreakdown?: ReturnType<typeof TrustService.calculate>,
  ): Promise<PlatformListing> {
    const totalCost = Math.round((raw.price + raw.shippingCost) * 100) / 100;
    const listingId = `list_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const listing: PlatformListing = {
      id: listingId,
      productId,
      platform: raw.platform,
      title: raw.title,
      price: raw.price,
      currency: raw.currency || 'USD',
      shippingCost: raw.shippingCost,
      totalCost,
      rating: raw.rating,
      reviewCount: raw.reviewCount,
      sellerName: raw.sellerName,
      sellerUrl: raw.sellerUrl,
      productUrl: raw.productUrl,
      imageUrl: raw.imageUrl,
      inStock: raw.inStock,
      returnPolicy: raw.returnPolicy,
      similarityScore,
      trustScore: trustBreakdown?.total ?? 60,
      trustBreakdown: trustBreakdown as any,
      lastScrapedAt: new Date().toISOString(),
    };

    return localDb.saveListing(listing);
  }

  private static buildKeywordQuery(raw: RawProductData): string {
    const FILLER_WORDS = new Set([
      'the', 'a', 'an', 'and', 'or', 'for', 'with', 'in', 'on', 'at', 'to',
      'of', 'by', 'from', 'pack', 'set', 'lot', 'piece', 'pcs', 'qty',
      'new', 'original', 'genuine', 'official', 'authentic', 'quality',
      'free', 'fast', 'shipping', 'delivery', 'sale', 'deal', 'offer',
      'men', 'women', 'mens', 'womens', "men's", "women's", 'unisex',
      'premium', 'best', 'top', 'great', 'high', 'pro', 'ultra',
    ]);

    const parts: string[] = [];

    if (raw.brand && raw.brand.toLowerCase() !== 'unknown') {
      parts.push(raw.brand.trim());
    }

    const modelMatch = raw.title.match(/\b([A-Z]{1,4}[-]?\d+[A-Z0-9-]*)\b/g);
    if (modelMatch?.length) {
      parts.push(...modelMatch.slice(0, 2));
    }

    const titleWords = raw.title
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !FILLER_WORDS.has(w.toLowerCase()));

    for (const word of titleWords) {
      if (parts.length >= 5) break;
      if (!parts.some((p) => p.toLowerCase() === word.toLowerCase())) {
        parts.push(word);
      }
    }

    return parts.slice(0, 5).join(' ').trim() || raw.title.split(' ').slice(0, 4).join(' ');
  }

  private static generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  }
}
