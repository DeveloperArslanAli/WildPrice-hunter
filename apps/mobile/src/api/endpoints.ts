import { LoginDto, RegisterDto, AuthTokens, UserPlan } from '@wildprice/shared-types';
import { localDb } from '../embedded/storage/localDb';
import { SearchOrchestrator } from '../embedded/orchestrator/searchOrchestrator';
import { DropshippingService } from '../embedded/services/dropshippingService';
import { GeminiClient } from '../embedded/services/geminiClient';

/**
 * WildPrice Hunter - Embedded API Facade
 *
 * Implements the exact same interface contracts as the previous external
 * HTTP endpoints, but executes all operations locally on-device using the
 * Embedded Backend engine.
 */

// ── Auth API ──────────────────────────────────────────────
export const authApi = {
  register: async (dto: RegisterDto) => {
    const user = await localDb.updateUser({
      email: dto.email,
      displayName: dto.displayName,
      plan: UserPlan.FREE,
    });
    const tokens: AuthTokens = {
      accessToken: `local_token_${Date.now()}`,
      refreshToken: `local_refresh_${Date.now()}`,
      expiresIn: 3600 * 24 * 30, // 30 days
    };
    return { user, tokens };
  },

  login: async (dto: LoginDto) => {
    const existing = await localDb.getUser();
    const user = await localDb.updateUser({
      email: dto.email,
      displayName: existing.displayName || dto.email.split('@')[0],
    });
    const tokens: AuthTokens = {
      accessToken: `local_token_${Date.now()}`,
      refreshToken: `local_refresh_${Date.now()}`,
      expiresIn: 3600 * 24 * 30,
    };
    return { user, tokens };
  },

  refresh: async (refreshToken: string) => {
    return {
      accessToken: `local_token_${Date.now()}`,
      refreshToken,
      expiresIn: 3600 * 24 * 30,
    };
  },

  logout: async () => {
    // Local session cleanup handled by store
  },

  getMe: async () => {
    return localDb.getUser();
  },
};

// ── Search API ────────────────────────────────────────────
export const searchApi = {
  searchByUrl: async (url: string) => {
    return SearchOrchestrator.startUrlSearch(url);
  },

  searchByText: async (query: string, category?: string) => {
    return SearchOrchestrator.startTextSearch(query, category);
  },

  searchByImage: async (imageBase64: string) => {
    return SearchOrchestrator.startImageSearch(imageBase64);
  },

  getStatus: async (sessionId: string) => {
    return localDb.getSession(sessionId);
  },

  getResults: async (
    sessionId: string,
    params?: { sortBy?: string; maxPrice?: number; minTrust?: number },
  ) => {
    return localDb.getSessionResults(sessionId, params);
  },

  // v0.4: Cancel an in-progress search — marks session as FAILED with cancellation reason
  cancelSearch: async (sessionId: string) => {
    const session = await localDb.getSession(sessionId);
    if (!session) return;
    if (session.status === 'done' || session.status === 'failed') return;
    (session as any).status = 'failed';
    (session as any).errorMessage = 'Search cancelled by user.';
    session.completedAt = new Date().toISOString();
    await localDb.saveSession(session);
  },
};

// ── Products API ──────────────────────────────────────────
export const productsApi = {
  getProduct: async (id: string) => {
    return localDb.getProduct(id);
  },

  getPriceHistory: async (listingId: string) => {
    return localDb.getPriceHistory(listingId);
  },

  getDropshippingAnalysis: async (productId: string) => {
    return DropshippingService.analyze(productId);
  },

  getSentiment: async (productId: string) => {
    const product = await localDb.getProduct(productId);
    const title = product ? product.title : 'Product';
    return GeminiClient.getSentimentReport(productId, title);
  },
};

// ── Watchlist API ─────────────────────────────────────────
export const watchlistApi = {
  getAll: async () => {
    return localDb.getWatchlist();
  },

  create: async (productId: string, targetPrice: number) => {
    return localDb.addWatchlist(productId, targetPrice);
  },

  updateTargetPrice: async (id: string, targetPrice: number) => {
    return localDb.updateWatchlistTarget(id, targetPrice);
  },

  remove: async (id: string) => {
    return localDb.removeWatchlist(id);
  },
};

// ── History API ───────────────────────────────────────────
export const historyApi = {
  getAll: async () => {
    return localDb.getHistory();
  },

  remove: async (id: string) => {
    return localDb.removeHistory(id);
  },

  clearAll: async () => {
    return localDb.clearHistory();
  },
};

// ── Users API ─────────────────────────────────────────────
export const usersApi = {
  getProfile: async () => {
    return localDb.getUser();
  },

  updateProfile: async (updates: {
    displayName?: string;
    dropshippingMode?: boolean;
    fcmToken?: string;
  }) => {
    return localDb.updateUser(updates);
  },
};
