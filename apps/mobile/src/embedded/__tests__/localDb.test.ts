import { localDb } from '../storage/localDb';
import {
  SearchSession,
  SearchSessionStatus,
  SearchInputType,
  Product,
  PlatformListing,
  Platform,
  SortBy,
  UserPlan,
} from '@wildprice/shared-types';

describe('LocalDatabase (Embedded Storage Engine)', () => {
  beforeEach(async () => {
    await localDb.ensureLoaded();
  });

  describe('Search Sessions', () => {
    it('should save and retrieve a search session', async () => {
      const sessionId = `test-sess-${Date.now()}`;
      const session: SearchSession = {
        id: sessionId,
        inputType: SearchInputType.TEXT,
        inputValue: 'Sony Headphones',
        status: SearchSessionStatus.PROCESSING,
        resultCount: 0,
        createdAt: new Date().toISOString(),
      };

      await localDb.saveSession(session);
      const retrieved = await localDb.getSession(sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(sessionId);
      expect(retrieved?.inputValue).toBe('Sony Headphones');
      expect(retrieved?.status).toBe(SearchSessionStatus.PROCESSING);
    });
  });

  describe('Products & Deduplication', () => {
    it('should find existing product by title case-insensitively', async () => {
      const prodId = `prod-${Date.now()}`;
      const product: Product = {
        id: prodId,
        title: 'Apple MacBook Pro M3',
        brand: 'Apple',
        createdAt: new Date().toISOString(),
      };

      await localDb.saveProduct(product);

      const found = await localDb.findProductByTitle('apple macbook pro m3');
      expect(found).not.toBeNull();
      expect(found?.id).toBe(prodId);
    });
  });

  describe('Listings, Price History & Results Sorting', () => {
    it('should store listings and calculate sorted search results', async () => {
      const sessionId = `test-sess-sort-${Date.now()}`;
      const prodId = `test-prod-sort-${Date.now()}`;

      const listing1: PlatformListing = {
        id: `list-1-${Date.now()}`,
        productId: prodId,
        platform: Platform.AMAZON,
        price: 100.0,
        shippingCost: 0,
        totalCost: 100.0,
        currency: 'USD',
        productUrl: 'https://amazon.com',
        inStock: true,
        similarityScore: 1.0,
        trustScore: 90,
        rating: 4.8,
        lastScrapedAt: new Date().toISOString(),
      };

      const listing2: PlatformListing = {
        id: `list-2-${Date.now()}`,
        productId: prodId,
        platform: Platform.EBAY,
        price: 80.0,
        shippingCost: 5.0,
        totalCost: 85.0,
        currency: 'USD',
        productUrl: 'https://ebay.com',
        inStock: true,
        similarityScore: 0.9,
        trustScore: 80,
        rating: 4.2,
        lastScrapedAt: new Date().toISOString(),
      };

      await localDb.saveListing(listing1);
      await localDb.saveListing(listing2);

      const session: SearchSession = {
        id: sessionId,
        inputType: SearchInputType.TEXT,
        inputValue: 'Gadget',
        status: SearchSessionStatus.DONE,
        resultCount: 2,
        createdAt: new Date().toISOString(),
      };
      (session as any).resultListingIds = [listing1.id, listing2.id];
      (session as any).originalListingId = listing1.id;
      await localDb.saveSession(session);

      // Price Ascending Sort
      const resPriceAsc = await localDb.getSessionResults(sessionId, { sortBy: SortBy.PRICE_ASC });
      expect(resPriceAsc.results.length).toBe(2);
      expect(resPriceAsc.results[0].id).toBe(listing2.id); // 85 vs 100
      expect(resPriceAsc.cheapestListing?.id).toBe(listing2.id);
      expect(resPriceAsc.maxSavings).toBe(15.0); // 100 - 85
      expect(resPriceAsc.maxSavingsPercent).toBe(15);

      // Trust Descending Sort
      const resTrustDesc = await localDb.getSessionResults(sessionId, { sortBy: SortBy.TRUST_DESC });
      expect(resTrustDesc.results[0].id).toBe(listing1.id); // 90 vs 80
    });

    it('should generate realistic price history for listings', async () => {
      const listingId = `list-history-${Date.now()}`;
      const points = await localDb.getPriceHistory(listingId);
      expect(Array.isArray(points)).toBe(true);
      expect(points.length).toBeGreaterThan(0);
      expect(points[0].price).toBeGreaterThan(0);
      expect(points[0].date).toBeDefined();
    });
  });

  describe('Watchlist', () => {
    it('should add, update target, and remove watchlist item', async () => {
      const prodId = `prod-wl-${Date.now()}`;
      const item = await localDb.addWatchlist(prodId, 150.0);
      expect(item.id).toBeDefined();
      expect(item.targetPrice).toBe(150.0);

      const all = await localDb.getWatchlist();
      expect(all.some((w) => w.id === item.id)).toBe(true);

      const updated = await localDb.updateWatchlistTarget(item.id, 120.0);
      expect(updated.targetPrice).toBe(120.0);

      await localDb.removeWatchlist(item.id);
      const afterRemove = await localDb.getWatchlist();
      expect(afterRemove.some((w) => w.id === item.id)).toBe(false);
    });
  });

  describe('Search History', () => {
    it('should add, retrieve, and clear search history', async () => {
      const sessId = `sess-hist-${Date.now()}`;
      await localDb.addHistory(sessId);

      const history = await localDb.getHistory();
      expect(history.some((h) => h.sessionId === sessId)).toBe(true);

      await localDb.clearHistory();
      const cleared = await localDb.getHistory();
      expect(cleared.length).toBe(0);
    });
  });

  describe('User Profile & Search Limits', () => {
    it('should update and retrieve user profile', async () => {
      const updated = await localDb.updateUser({
        displayName: 'Master Hunter',
        dropshippingMode: true,
      });
      expect(updated.displayName).toBe('Master Hunter');
      expect(updated.dropshippingMode).toBe(true);

      const user = await localDb.getUser();
      expect(user.displayName).toBe('Master Hunter');
    });

    it('should allow search within limit and check Pro tier bypass', async () => {
      await expect(localDb.checkSearchLimit()).resolves.not.toThrow();

      // Pro tier user should never throw
      await localDb.updateUser({ plan: UserPlan.PRO });
      await expect(localDb.checkSearchLimit()).resolves.not.toThrow();

      // Reset back to Free
      await localDb.updateUser({ plan: UserPlan.FREE });
    });
  });
});
