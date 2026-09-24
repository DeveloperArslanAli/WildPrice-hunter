import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  SearchSession,
  Product,
  PlatformListing,
  PriceHistoryPoint,
  WatchlistItem,
  User,
  UserPlan,
  SortBy,
  SearchResultsResponse,
} from '@wildprice/shared-types';
import { EMBEDDED_CONFIG } from '../config/embeddedConfig';

/** Typed search history record stored in AsyncStorage */
interface SearchHistoryItem {
  id: string;
  userId: string;
  sessionId: string;
  session?: SearchSession;
  createdAt: string;
}

const STORAGE_KEYS = {
  SESSIONS: '@wildprice:embedded:sessions',
  PRODUCTS: '@wildprice:embedded:products',
  LISTINGS: '@wildprice:embedded:listings',
  PRICE_HISTORY: '@wildprice:embedded:price_history',
  WATCHLIST: '@wildprice:embedded:watchlist',
  HISTORY: '@wildprice:embedded:history',
  USER_PROFILE: '@wildprice:embedded:user_profile',
  DAILY_SEARCH_STATS: '@wildprice:embedded:daily_searches',
};

// Default Guest / Local User
const DEFAULT_USER: User = {
  id: 'local-hunter-user',
  email: 'hunter@wildprice.local',
  displayName: 'Wild Hunter',
  plan: UserPlan.FREE,
  dropshippingMode: false,
  createdAt: new Date().toISOString(),
};

class LocalDatabase {
  private sessionsCache: Map<string, SearchSession> = new Map();
  private productsCache: Map<string, Product> = new Map();
  private listingsCache: Map<string, PlatformListing> = new Map();
  private priceHistoryCache: Map<string, PriceHistoryPoint[]> = new Map();
  private watchlistCache: WatchlistItem[] = [];
  private historyCache: SearchHistoryItem[] = [];
  private currentUser: User = DEFAULT_USER;
  private isLoaded = false;
  private loadPromise: Promise<void> | null = null;

  constructor() {
    this.loadPromise = this.loadFromDisk();
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const [
        sessionsRaw,
        productsRaw,
        listingsRaw,
        historyRaw,
        watchlistRaw,
        searchHistRaw,
        userRaw,
      ] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SESSIONS),
        AsyncStorage.getItem(STORAGE_KEYS.PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.LISTINGS),
        AsyncStorage.getItem(STORAGE_KEYS.PRICE_HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.WATCHLIST),
        AsyncStorage.getItem(STORAGE_KEYS.HISTORY),
        AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE),
      ]);

      if (sessionsRaw) {
        const parsed = JSON.parse(sessionsRaw);
        Object.entries(parsed).forEach(([k, v]) => this.sessionsCache.set(k, v as SearchSession));
      }
      if (productsRaw) {
        const parsed = JSON.parse(productsRaw);
        Object.entries(parsed).forEach(([k, v]) => this.productsCache.set(k, v as Product));
      }
      if (listingsRaw) {
        const parsed = JSON.parse(listingsRaw);
        Object.entries(parsed).forEach(([k, v]) => this.listingsCache.set(k, v as PlatformListing));
      }
      if (historyRaw) {
        const parsed = JSON.parse(historyRaw);
        Object.entries(parsed).forEach(([k, v]) =>
          this.priceHistoryCache.set(k, v as PriceHistoryPoint[]),
        );
      }
      if (watchlistRaw) {
        this.watchlistCache = JSON.parse(watchlistRaw);
      }
      if (searchHistRaw) {
        this.historyCache = JSON.parse(searchHistRaw);
      }
      if (userRaw) {
        this.currentUser = JSON.parse(userRaw);
      }
      this.isLoaded = true;
    } catch (e) {
      console.warn('[LocalDatabase] Error loading data from disk:', e);
      this.isLoaded = true;
    }
  }

  public async ensureLoaded(): Promise<void> {
    if (this.isLoaded) return;
    if (this.loadPromise) await this.loadPromise;
  }

  // ─────────────────────────────────────────────────────────────
  // SESSIONS
  // ─────────────────────────────────────────────────────────────

  async saveSession(session: SearchSession): Promise<SearchSession> {
    await this.ensureLoaded();
    this.sessionsCache.set(session.id, session);
    this.persistSessions();
    return session;
  }

  async getSession(id: string): Promise<SearchSession | null> {
    await this.ensureLoaded();
    return this.sessionsCache.get(id) || null;
  }

  private persistSessions() {
    const obj: Record<string, SearchSession> = {};
    this.sessionsCache.forEach((val, key) => {
      obj[key] = val;
    });
    AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(obj)).catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────
  // PRODUCTS
  // ─────────────────────────────────────────────────────────────

  async saveProduct(product: Product): Promise<Product> {
    await this.ensureLoaded();
    this.productsCache.set(product.id, product);
    this.persistProducts();
    return product;
  }

  async getProduct(id: string): Promise<Product | null> {
    await this.ensureLoaded();
    return this.productsCache.get(id) || null;
  }

  async findProductByTitle(title: string): Promise<Product | null> {
    await this.ensureLoaded();
    const cleanTitle = title.trim().toLowerCase();
    for (const p of this.productsCache.values()) {
      if (p.title.trim().toLowerCase() === cleanTitle) {
        return p;
      }
    }
    return null;
  }

  private persistProducts() {
    const obj: Record<string, Product> = {};
    this.productsCache.forEach((val, key) => {
      obj[key] = val;
    });
    AsyncStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(obj)).catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────
  // LISTINGS & PRICE HISTORY
  // ─────────────────────────────────────────────────────────────

  async saveListing(listing: PlatformListing): Promise<PlatformListing> {
    await this.ensureLoaded();

    // v0.4: Prune listings cache if it exceeds max threshold to prevent AsyncStorage bloat
    if (this.listingsCache.size >= EMBEDDED_CONFIG.MAX_LISTINGS_CACHE) {
      this.pruneListingsCache();
    }

    this.listingsCache.set(listing.id, listing);
    this.persistListings();

    // Record price history point, capped at MAX_PRICE_HISTORY_POINTS
    const points = this.priceHistoryCache.get(listing.id) || [];
    points.push({
      price: listing.price,
      date: new Date().toISOString(),
    });
    const cappedPoints = points.slice(-EMBEDDED_CONFIG.MAX_PRICE_HISTORY_POINTS);
    this.priceHistoryCache.set(listing.id, cappedPoints);
    this.persistPriceHistory();

    return listing;
  }

  /**
   * v0.4: Prunes the listings cache by removing the oldest 20% of entries.
   * Called automatically when the cache exceeds MAX_LISTINGS_CACHE.
   */
  private pruneListingsCache(): void {
    const entries = Array.from(this.listingsCache.entries());
    const pruneCount = Math.floor(entries.length * 0.2);
    entries.slice(0, pruneCount).forEach(([key]) => this.listingsCache.delete(key));
    console.info(`[LocalDatabase] Pruned ${pruneCount} old listings from cache.`);
  }

  async getListing(id: string): Promise<PlatformListing | null> {
    await this.ensureLoaded();
    return this.listingsCache.get(id) || null;
  }

  async getListingsForProduct(productId: string): Promise<PlatformListing[]> {
    await this.ensureLoaded();
    const results: PlatformListing[] = [];
    this.listingsCache.forEach((l) => {
      if (l.productId === productId) results.push(l);
    });
    return results;
  }

  async getPriceHistory(listingId: string): Promise<PriceHistoryPoint[]> {
    await this.ensureLoaded();
    const existing = this.priceHistoryCache.get(listingId);
    if (existing && existing.length > 0) {
      return existing;
    }
    // Generate realistic historical baseline if newly found
    const listing = this.listingsCache.get(listingId);
    const basePrice = listing ? listing.price : 99.99;
    const syntheticPoints: PriceHistoryPoint[] = [];
    const now = Date.now();
    for (let i = 14; i >= 0; i--) {
      const dayDate = new Date(now - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const variance = (Math.sin(i) * 0.08) * basePrice;
      syntheticPoints.push({
        price: Math.max(1, Math.round((basePrice + variance) * 100) / 100),
        date: dayDate,
      });
    }
    this.priceHistoryCache.set(listingId, syntheticPoints);
    this.persistPriceHistory();
    return syntheticPoints;
  }

  private persistListings() {
    const obj: Record<string, PlatformListing> = {};
    this.listingsCache.forEach((val, key) => {
      obj[key] = val;
    });
    AsyncStorage.setItem(STORAGE_KEYS.LISTINGS, JSON.stringify(obj)).catch(() => {});
  }

  private persistPriceHistory() {
    const obj: Record<string, PriceHistoryPoint[]> = {};
    this.priceHistoryCache.forEach((val, key) => {
      obj[key] = val;
    });
    AsyncStorage.setItem(STORAGE_KEYS.PRICE_HISTORY, JSON.stringify(obj)).catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────
  // SEARCH RESULTS QUERY & SORTING
  // ─────────────────────────────────────────────────────────────

  async getSessionResults(
    sessionId: string,
    params?: { sortBy?: string; maxPrice?: number; minTrust?: number },
  ): Promise<SearchResultsResponse> {
    await this.ensureLoaded();
    const session = this.sessionsCache.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const listingIds = (session as any).resultListingIds || [];
    let listings: PlatformListing[] = [];
    for (const id of listingIds) {
      const l = this.listingsCache.get(id);
      if (l) listings.push(l);
    }

    // Apply filters
    if (params?.maxPrice !== undefined) {
      listings = listings.filter((l) => Number(l.totalCost) <= params.maxPrice!);
    }
    if (params?.minTrust !== undefined) {
      listings = listings.filter((l) => l.trustScore >= params.minTrust!);
    }

    // Apply sorting
    const sortBy = (params?.sortBy as SortBy) || SortBy.PRICE_ASC;
    listings = this.sortListings(listings, sortBy);

    const originalListingId = (session as any).originalListingId;
    const originalListing = originalListingId ? this.listingsCache.get(originalListingId) : undefined;
    const cheapestListing = listings[0] ?? undefined;

    let maxSavings: number | undefined;
    let maxSavingsPercent: number | undefined;

    if (originalListing && cheapestListing) {
      const diff = Number(originalListing.totalCost) - Number(cheapestListing.totalCost);
      if (diff > 0) {
        maxSavings = Math.round(diff * 100) / 100;
        maxSavingsPercent = Math.round((diff / Number(originalListing.totalCost)) * 100);
      } else {
        maxSavings = 0;
        maxSavingsPercent = 0;
      }
    }

    return {
      session,
      originalListing,
      results: listings,
      cheapestListing,
      maxSavings,
      maxSavingsPercent,
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
          return Number(a.totalCost) - Number(b.totalCost);
        default:
          return 0;
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // WATCHLIST
  // ─────────────────────────────────────────────────────────────

  async getWatchlist(): Promise<WatchlistItem[]> {
    await this.ensureLoaded();
    return [...this.watchlistCache];
  }

  async addWatchlist(productId: string, targetPrice: number, currency = 'USD'): Promise<WatchlistItem> {
    await this.ensureLoaded();
    const product = this.productsCache.get(productId) || {
      id: productId,
      title: 'Monitored Product',
      createdAt: new Date().toISOString(),
    };

    const newItem: WatchlistItem = {
      id: `wl-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: this.currentUser.id,
      product,
      targetPrice,
      currency,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    this.watchlistCache.unshift(newItem);
    AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(this.watchlistCache)).catch(() => {});
    return newItem;
  }

  async updateWatchlistTarget(id: string, targetPrice: number): Promise<WatchlistItem> {
    await this.ensureLoaded();
    const item = this.watchlistCache.find((w) => w.id === id);
    if (!item) throw new Error('Watchlist item not found');
    item.targetPrice = targetPrice;
    AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(this.watchlistCache)).catch(() => {});
    return item;
  }

  async removeWatchlist(id: string): Promise<void> {
    await this.ensureLoaded();
    this.watchlistCache = this.watchlistCache.filter((w) => w.id !== id);
    AsyncStorage.setItem(STORAGE_KEYS.WATCHLIST, JSON.stringify(this.watchlistCache)).catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────
  // SEARCH HISTORY
  // ─────────────────────────────────────────────────────────────

  async getHistory(): Promise<SearchHistoryItem[]> {
    await this.ensureLoaded();
    // Hydrate sessions in history items
    return this.historyCache.map((item) => {
      const session = this.sessionsCache.get(item.sessionId) || item.session;
      return {
        ...item,
        session,
      };
    });
  }

  async addHistory(sessionId: string): Promise<void> {
    await this.ensureLoaded();
    const session = this.sessionsCache.get(sessionId);
    const item: SearchHistoryItem = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: this.currentUser.id,
      sessionId,
      session,
      createdAt: new Date().toISOString(),
    };
    // v0.4: Keep max 100 history items (up from 50)
    this.historyCache.unshift(item);
    if (this.historyCache.length > 100) this.historyCache = this.historyCache.slice(0, 100);
    AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.historyCache)).catch(() => {});
  }

  async removeHistory(id: string): Promise<void> {
    await this.ensureLoaded();
    this.historyCache = this.historyCache.filter((h) => h.id !== id);
    AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(this.historyCache)).catch(() => {});
  }

  async clearHistory(): Promise<void> {
    await this.ensureLoaded();
    this.historyCache = [];
    AsyncStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify([])).catch(() => {});
  }

  // ─────────────────────────────────────────────────────────────
  // USER PROFILE & SEARCH LIMITS
  // ─────────────────────────────────────────────────────────────

  async getUser(): Promise<User> {
    await this.ensureLoaded();
    return this.currentUser;
  }

  async updateUser(updates: Partial<User>): Promise<User> {
    await this.ensureLoaded();
    this.currentUser = { ...this.currentUser, ...updates };
    AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(this.currentUser)).catch(() => {});
    return this.currentUser;
  }

  async checkSearchLimit(): Promise<void> {
    await this.ensureLoaded();
    if (this.currentUser.plan === UserPlan.PRO) return;

    const todayStr = new Date().toDateString();
    const statsRaw = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_SEARCH_STATS);
    let stats = statsRaw ? JSON.parse(statsRaw) : { date: todayStr, count: 0 };

    if (stats.date !== todayStr) {
      stats = { date: todayStr, count: 0 };
    }

    if (stats.count >= EMBEDDED_CONFIG.FREE_DAILY_SEARCHES) {
      // v0.4: Uses config-driven limit (10/day free tier)
      throw new Error(
        `Daily search limit (${EMBEDDED_CONFIG.FREE_DAILY_SEARCHES} hunts) reached for Free Tier. Upgrade to Pro for unlimited hunts.`,
      );
    }

    stats.count += 1;
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_SEARCH_STATS, JSON.stringify(stats));
  }
}

export const localDb = new LocalDatabase();
