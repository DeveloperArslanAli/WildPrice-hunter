import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import { SearchSession } from '../search/entities/search-session.entity';
import { Product, PlatformListing, PriceHistory } from '../products/entities/product.entity';
import { AmazonScraper } from './workers/amazon.scraper';
import { EbayScraper } from './workers/ebay.scraper';
import { AliExpressScraper } from './workers/aliexpress.scraper';
import { WalmartScraper } from './workers/walmart.scraper';
import { AiService } from '../ai/ai.service';
import { TrustService } from '../trust/trust.service';
import { UrlParserService } from '../search/url-parser.service';
import { ScraperJobData, RawProductData } from './scraper.types';
import { SearchSessionStatus, Platform } from '@wildprice/shared-types';
import { SCRAPER_QUEUE_NAME } from './scraper.constants';
import { SearchInputType } from '@wildprice/shared-types';
import { SearchEventsGateway } from '../search/search.gateway';

@Processor(SCRAPER_QUEUE_NAME)
export class ScraperProcessor extends WorkerHost {
  private readonly logger = new Logger(ScraperProcessor.name);

  constructor(
    @InjectRepository(SearchSession)
    private sessionsRepo: Repository<SearchSession>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(PlatformListing)
    private listingsRepo: Repository<PlatformListing>,
    @InjectRepository(PriceHistory)
    private priceHistoryRepo: Repository<PriceHistory>,
    private amazonScraper: AmazonScraper,
    private ebayScraper: EbayScraper,
    private aliexpressScraper: AliExpressScraper,
    private walmartScraper: WalmartScraper,
    private aiService: AiService,
    private trustService: TrustService,
    private urlParser: UrlParserService,
    @Inject(forwardRef(() => SearchEventsGateway))
    private searchGateway: SearchEventsGateway,
  ) {
    super();
  }

  async process(job: Job<ScraperJobData>): Promise<void> {
    const { sessionId, inputType, url, query, category } = job.data;
    this.logger.log(`Processing scrape job: session=${sessionId} type=${inputType}`);

    const session = await this.sessionsRepo.findOne({ where: { id: sessionId } });
    if (!session) {
      this.logger.error(`Session ${sessionId} not found`);
      return;
    }

    try {
      this.searchGateway.emitProgress({
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 15,
        message: 'Initializing search across platforms...',
      });

      // ── Step 1: Determine search query ────────────────────────────
      let searchQuery = query ?? '';
      let originalProduct: Product | null = null;
      let originalListing: PlatformListing | null = null;

      if (inputType === SearchInputType.URL && url) {
        const parsed = this.urlParser.parse(url);
        this.logger.log(`Parsed URL → platform=${parsed.platform} id=${parsed.productId}`);

        // Fetch the original product data
        const scraperForPlatform = this.getScraperForPlatform(parsed.platform);
        const hasFetchByUrl =
          scraperForPlatform &&
          'fetchByUrl' in scraperForPlatform &&
          typeof (scraperForPlatform as any).fetchByUrl === 'function';

        if (hasFetchByUrl) {
          this.logger.log(`Fetching original product via ${parsed.platform} scraper...`);
          const rawOriginal = await (scraperForPlatform as any).fetchByUrl(url);

          if (rawOriginal) {
            originalProduct = await this.saveProduct(rawOriginal);
            // Use a clean keyword-optimized query from the start (full title degrades
            // cross-platform search quality on eBay / AliExpress / Walmart)
            searchQuery = ScraperProcessor.buildKeywordQuery(rawOriginal);

            // Save original listing
            originalListing = await this.saveListing(
              sessionId,
              rawOriginal,
              originalProduct.id,
              1.0,
            );
            this.logger.log(`Original product saved: "${rawOriginal.title}" ($${rawOriginal.price}) → query: "${searchQuery}"`);
          }
        }

        if (!searchQuery) {
          searchQuery = parsed.productId ?? url;
        }
      }

      // ── Step 2: Generate AI fingerprint & refine search query ────────
      let fingerprint;
      if (originalProduct) {
        this.searchGateway.emitProgress({
          sessionId,
          status: SearchSessionStatus.PROCESSING,
          progress: 35,
          message: 'Fingerprinting item & extracting key specs...',
        });

        fingerprint = await this.aiService.extractProductFingerprint({
          title: originalProduct.title,
          brand: originalProduct.brand,
          category: originalProduct.category,
          description: originalProduct.description,
        });
        await this.productsRepo.update(originalProduct.id, { fingerprint: fingerprint as any });

        // ★ KEY FIX: Use the AI-normalized canonical title as the search query.
        // This converts verbose product titles like:
        //   "Casio Men's F91W-1 Classic Resin Strap Digital Sport Watch"
        // into a clean cross-platform search query like:
        //   "Casio F91W Digital Watch"
        // Dramatically improves relevance on eBay, AliExpress, and Walmart.
        if (fingerprint?.canonicalTitle) {
          const refined = await this.aiService.buildSearchKeywords(fingerprint);
          searchQuery = refined || fingerprint.canonicalTitle;
          this.logger.log(`Search query refined via fingerprint: "${searchQuery}"`);
        }
      }

      // Save original product to session
      if (originalProduct) {
        session.originalProductId = originalProduct.id;
        session.originalListingId = originalListing?.id;
      }

      // ── Step 3: Parallel scraping across all platforms ─────────────
      this.searchGateway.emitProgress({
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 55,
        message: 'Scanning Amazon, eBay, AliExpress, and Walmart in parallel...',
      });

      this.logger.log(`Starting parallel scrape for: "${searchQuery}"`);
      const scrapers = [
        this.amazonScraper,
        this.ebayScraper,
        this.aliexpressScraper,
        this.walmartScraper,
      ];

      const scraperResults = await Promise.allSettled(
        scrapers.map((scraper) =>
          scraper.searchByKeyword(searchQuery).catch((err) => {
            this.logger.warn(`Scraper ${scraper.platform} failed: ${err}`);
            return [] as RawProductData[];
          }),
        ),
      );

      const allRawResults: RawProductData[] = [];
      scraperResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          allRawResults.push(...result.value);
        }
      });

      this.logger.log(`Got ${allRawResults.length} raw results from all platforms`);

      // ── Step 4: Save results with trust scores ─────────────────────
      this.searchGateway.emitProgress({
        sessionId,
        status: SearchSessionStatus.PROCESSING,
        progress: 80,
        message: `Auditing trust scores and comparing ${allRawResults.length} listings...`,
      });

      const resultListingIds: string[] = [];
      let lowestPrice = originalListing?.price ?? Infinity;

      for (const raw of allRawResults) {
        try {
          // Skip if it's the same platform as original (avoid duplicate)
          if (
            originalListing &&
            raw.platform === originalListing.platform &&
            raw.productUrl === originalListing.productUrl
          ) {
            continue;
          }

          // Calculate similarity score
          let similarityScore = 0.8; // Default
          if (fingerprint && raw.title) {
            similarityScore = await this.aiService.calculateSimilarity(
              fingerprint,
              raw.title,
            );
          }

          // Skip if similarity too low (< 0.5)
          if (similarityScore < 0.5) {
            this.logger.debug(`Skipping low similarity result: "${raw.title}" (${similarityScore})`);
            continue;
          }

          // Calculate trust score
          const trustBreakdown = this.trustService.calculate({
            platform: raw.platform,
            sellerRating: raw.rating,
            reviewCount: raw.reviewCount,
            hasFreeReturns: raw.returnPolicy === 'free',
            hasPaidReturns: raw.returnPolicy === 'paid',
            sellerAgeYears: raw.sellerAgeYears,
            hasSSL: raw.hasSsl ?? true,
          });

          // Find or create product
          const product = await this.saveProduct(raw);

          // Save listing + record price history
          const listing = await this.saveListing(sessionId, raw, product.id, similarityScore, trustBreakdown);
          resultListingIds.push(listing.id);

          if (listing.price < lowestPrice) {
            lowestPrice = listing.price;
          }

          // Real-time WebSocket emission of listing found!
          this.searchGateway.emitListingFound({
            sessionId,
            listing,
            lowestPriceSoFar: lowestPrice,
          });
        } catch (err) {
          this.logger.warn(`Failed to save listing: ${err}`);
        }
      }

      // ── Step 5: Update session as done & notify clients ─────────────
      session.status = SearchSessionStatus.DONE;
      session.resultCount = resultListingIds.length;
      session.resultListingIds = resultListingIds;
      session.completedAt = new Date();
      await this.sessionsRepo.save(session);

      const savings = originalListing ? Math.max(0, originalListing.price - lowestPrice) : 0;

      this.searchGateway.emitSearchCompleted({
        sessionId,
        resultCount: resultListingIds.length,
        lowestPrice: lowestPrice === Infinity ? undefined : lowestPrice,
        savingsVsOriginal: savings,
        completedAt: session.completedAt.toISOString(),
      });

      this.logger.log(
        `Session ${sessionId} completed: ${resultListingIds.length} results saved. Lowest=$${lowestPrice}, Savings=$${savings}`,
      );
    } catch (err) {
      this.logger.error(`Scrape job failed for session ${sessionId}: ${err}`);
      await this.failSession(session, String(err));
    }
  }

  private getScraperForPlatform(platform: Platform) {
    switch (platform) {
      case Platform.AMAZON:
        return this.amazonScraper;
      case Platform.EBAY:
        return this.ebayScraper;
      case Platform.ALIEXPRESS:
        return this.aliexpressScraper;
      case Platform.WALMART:
        return this.walmartScraper;
      default:
        return null;
    }
  }

  private async saveProduct(raw: RawProductData): Promise<Product> {
    // Try to find existing product by title match
    let product = await this.productsRepo.findOne({
      where: { title: raw.title },
    });

    if (!product) {
      product = this.productsRepo.create({
        title: raw.title,
        brand: raw.brand,
        imageUrl: raw.imageUrl,
        description: raw.description,
      });
      await this.productsRepo.save(product);
    }

    return product;
  }

  private async saveListing(
    sessionId: string,
    raw: RawProductData,
    productId: string,
    similarityScore: number,
    trustBreakdown?: ReturnType<TrustService['calculate']>,
  ): Promise<PlatformListing> {
    const totalCost = raw.price + raw.shippingCost;

    const listing = this.listingsRepo.create({
      productId,
      platform: raw.platform,
      price: raw.price,
      currency: raw.currency,
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
      sellerAgeYears: raw.sellerAgeYears,
      hasSsl: raw.hasSsl,
      similarityScore,
      trustScore: trustBreakdown?.total ?? 50,
      trustBreakdown: trustBreakdown as any,
      lastScrapedAt: new Date(),
    });

    const savedListing = (await this.listingsRepo.save(listing as any)) as unknown as PlatformListing;

    // Record historical price point (Phase 3 Price History)
    try {
      const priceHistory = this.priceHistoryRepo.create({
        listingId: savedListing.id,
        price: savedListing.price,
      });
      await this.priceHistoryRepo.save(priceHistory);
    } catch (err) {
      this.logger.warn(`Could not save price history for listing ${savedListing.id}: ${err}`);
    }

    return savedListing;
  }

  /**
   * Builds a clean, keyword-optimized search query from raw product data.
   * Strips filler marketing words and returns a 3-6 token query.
   * Used as an initial fallback before AI fingerprint is available.
   */
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

    // Prioritise brand (usually most searchable signal)
    if (raw.brand && raw.brand.toLowerCase() !== 'unknown') {
      parts.push(raw.brand.trim());
    }

    // Extract model number if present (e.g. F91W, WH-1000XM5, AirPods Pro)
    const modelMatch = raw.title.match(/\b([A-Z]{1,4}[-]?\d+[A-Z0-9-]*)\b/g);
    if (modelMatch?.length) {
      parts.push(...modelMatch.slice(0, 2));
    }

    // Add significant words from title (skip filler)
    const titleWords = raw.title
      .replace(/[^a-zA-Z0-9\s-]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !FILLER_WORDS.has(w.toLowerCase()));

    for (const word of titleWords) {
      if (parts.length >= 6) break;
      // Skip if word is already captured (e.g. brand or model)
      if (!parts.some((p) => p.toLowerCase() === word.toLowerCase())) {
        parts.push(word);
      }
    }

    return parts.slice(0, 6).join(' ').trim() || raw.title.split(' ').slice(0, 5).join(' ');
  }

  private async failSession(session: SearchSession, message: string): Promise<void> {
    session.status = SearchSessionStatus.FAILED;
    session.errorMessage = message;
    session.completedAt = new Date();
    await this.sessionsRepo.save(session);

    this.searchGateway.emitProgress({
      sessionId: session.id,
      status: SearchSessionStatus.FAILED,
      progress: 0,
      message,
    });
  }
}
