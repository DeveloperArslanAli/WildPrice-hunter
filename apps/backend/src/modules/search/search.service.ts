import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { ConfigService } from '@nestjs/config';
import { SearchSession } from './entities/search-session.entity';
import { Product, PlatformListing } from '../products/entities/product.entity';
import { User } from '../users/entities/user.entity';
import { AiService } from '../ai/ai.service';
import { UrlParserService } from './url-parser.service';
import { SearchUrlDto, SearchTextDto, SearchImageDto, SearchResultsQueryDto } from './dto/search.dto';
import { SearchInputType, SearchSessionStatus, SortBy, Platform } from '@wildprice/shared-types';
import { SCRAPER_QUEUE_NAME, SCRAPE_JOB_NAME } from '../scraper/scraper.constants';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectRepository(SearchSession)
    private sessionsRepo: Repository<SearchSession>,
    @InjectRepository(Product)
    private productsRepo: Repository<Product>,
    @InjectRepository(PlatformListing)
    private listingsRepo: Repository<PlatformListing>,
    @InjectRepository(User)
    private usersRepo: Repository<User>,
    @InjectQueue(SCRAPER_QUEUE_NAME)
    private scraperQueue: Queue,
    private aiService: AiService,
    private urlParser: UrlParserService,
    private config: ConfigService,
  ) {}

  /**
   * Initiates a URL-based product search.
   * Returns session ID immediately; scraping happens asynchronously.
   */
  async searchByUrl(
    dto: SearchUrlDto,
    userId?: string,
  ): Promise<SearchSession> {
    await this.checkSearchLimit(userId);

    const session = this.sessionsRepo.create({
      userId,
      inputType: SearchInputType.URL,
      inputValue: dto.url,
      status: SearchSessionStatus.PROCESSING,
    });
    await this.sessionsRepo.save(session);

    // Dispatch to scraper queue
    await this.scraperQueue.add(SCRAPE_JOB_NAME, {
      sessionId: session.id,
      inputType: SearchInputType.URL,
      url: dto.url,
      userId,
    });

    if (userId) await this.incrementDailyCount(userId);
    return session;
  }

  /**
   * Initiates a text/keyword product search.
   */
  async searchByText(
    dto: SearchTextDto,
    userId?: string,
  ): Promise<SearchSession> {
    await this.checkSearchLimit(userId);

    const session = this.sessionsRepo.create({
      userId,
      inputType: SearchInputType.TEXT,
      inputValue: dto.query,
      status: SearchSessionStatus.PROCESSING,
    });
    await this.sessionsRepo.save(session);

    await this.scraperQueue.add(SCRAPE_JOB_NAME, {
      sessionId: session.id,
      inputType: SearchInputType.TEXT,
      query: dto.query,
      category: dto.category,
      userId,
    });

    if (userId) await this.incrementDailyCount(userId);
    return session;
  }

  /**
   * Initiates an image-based product search using Gemini Vision.
   */
  async searchByImage(
    dto: SearchImageDto,
    userId?: string,
  ): Promise<SearchSession> {
    await this.checkSearchLimit(userId);

    // Extract keywords from image via Gemini
    const query = await this.aiService.extractKeywordsFromImage(dto.imageBase64);
    this.logger.log(`Image search → extracted query: "${query}"`);

    const session = this.sessionsRepo.create({
      userId,
      inputType: SearchInputType.IMAGE,
      inputValue: query,
      status: SearchSessionStatus.PROCESSING,
    });
    await this.sessionsRepo.save(session);

    await this.scraperQueue.add(SCRAPE_JOB_NAME, {
      sessionId: session.id,
      inputType: SearchInputType.TEXT,
      query,
      userId,
    });

    if (userId) await this.incrementDailyCount(userId);
    return session;
  }

  /**
   * Gets the current status and results of a search session.
   */
  async getSessionStatus(sessionId: string, userId?: string): Promise<SearchSession> {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { originalProduct: true },
    });
    if (!session) throw new NotFoundException('Search session not found');
    return session;
  }

  /**
   * Returns the sorted and filtered comparison results for a completed session.
   */
  async getSessionResults(
    sessionId: string,
    query: SearchResultsQueryDto,
    userId?: string,
  ) {
    const session = await this.sessionsRepo.findOne({
      where: { id: sessionId },
      relations: { originalProduct: true },
    });
    if (!session) throw new NotFoundException('Search session not found');

    if (!session.resultListingIds?.length) {
      return {
        session,
        results: [],
        originalListing: null,
        cheapestListing: null,
        maxSavings: null,
      };
    }

    // Fetch all result listings
    let listings = await this.listingsRepo
      .createQueryBuilder('l')
      .where('l.id IN (:...ids)', { ids: session.resultListingIds })
      .getMany();

    // Apply filters
    if (query.maxPrice) {
      listings = listings.filter((l) => Number(l.totalCost) <= query.maxPrice!);
    }
    if (query.minTrust) {
      listings = listings.filter((l) => l.trustScore >= query.minTrust!);
    }

    // Apply sorting
    listings = this.sortListings(listings, query.sortBy ?? SortBy.PRICE_ASC);

    // Get original listing if available
    const originalListing = session.originalListingId
      ? await this.listingsRepo.findOne({ where: { id: session.originalListingId } })
      : null;

    const cheapestListing = listings[0] ?? null;
    const maxSavings =
      originalListing && cheapestListing
        ? Number(originalListing.totalCost) - Number(cheapestListing.totalCost)
        : null;

    return {
      session,
      originalListing,
      results: listings,
      cheapestListing,
      maxSavings,
      maxSavingsPercent:
        maxSavings && originalListing
          ? Math.round((maxSavings / Number(originalListing.totalCost)) * 100)
          : null,
    };
  }

  private sortListings(listings: PlatformListing[], sortBy: SortBy): PlatformListing[] {
    return [...listings].sort((a, b) => {
      switch (sortBy) {
        case SortBy.PRICE_ASC:
          return Number(a.totalCost) - Number(b.totalCost);
        case SortBy.PRICE_DESC:
          return Number(b.totalCost) - Number(a.totalCost);
        case SortBy.TRUST_DESC:
          return b.trustScore - a.trustScore;
        case SortBy.RATING_DESC:
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case SortBy.SAVINGS_DESC:
          return Number(a.totalCost) - Number(b.totalCost); // Same as price asc
        default:
          return 0;
      }
    });
  }

  private async checkSearchLimit(userId?: string): Promise<void> {
    if (!userId) return; // Guest mode: unlimited but session not saved

    const user = await this.usersRepo.findOne({ where: { id: userId } });
    if (!user) return;
    if (user.plan === 'pro') return; // Pro users: unlimited

    // Reset daily count if needed
    const now = new Date();
    const resetAt = user.dailySearchResetAt;
    if (!resetAt || resetAt.toDateString() !== now.toDateString()) {
      await this.usersRepo.update(userId, {
        dailySearchCount: 0,
        dailySearchResetAt: now,
      });
      return;
    }

    const limit = this.config.get<number>('FREE_TIER_DAILY_SEARCHES', 5);
    if (user.dailySearchCount >= limit) {
      throw new ForbiddenException(
        `Free plan limit: ${limit} searches per day. Upgrade to Pro for unlimited searches.`,
      );
    }
  }

  private async incrementDailyCount(userId: string): Promise<void> {
    await this.usersRepo.increment({ id: userId }, 'dailySearchCount', 1);
  }
}
