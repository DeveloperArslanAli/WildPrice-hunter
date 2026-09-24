// ─────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────

export enum Platform {
  AMAZON = 'amazon',
  EBAY = 'ebay',
  ALIEXPRESS = 'aliexpress',
  WALMART = 'walmart',
  ETSY = 'etsy',
  SHOPIFY = 'shopify',
  UNKNOWN = 'unknown',
}

export enum SearchInputType {
  URL = 'url',
  TEXT = 'text',
  IMAGE = 'image',
  BARCODE = 'barcode',
}

export enum SearchSessionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  DONE = 'done',
  FAILED = 'failed',
}

export enum UserPlan {
  FREE = 'free',
  PRO = 'pro',
}

export enum SortBy {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  TRUST_DESC = 'trust_desc',
  SAVINGS_DESC = 'savings_desc',
  RATING_DESC = 'rating_desc',
}

// ─────────────────────────────────────────────────────
// CORE ENTITIES
// ─────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  plan: UserPlan;
  dropshippingMode: boolean;
  createdAt: string;
}

export interface ProductFingerprint {
  canonicalTitle: string;
  brand?: string;
  category?: string;
  keyAttributes: string[];
  modelNumber?: string;
  similarityThreshold: number;
}

export interface Product {
  id: string;
  title: string;
  brand?: string;
  category?: string;
  imageUrl?: string;
  description?: string;
  fingerprint?: ProductFingerprint;
  createdAt: string;
}

export interface TrustScoreBreakdown {
  platformReliability: number;  // 0-30
  sellerRating: number;          // 0-25
  reviewVolume: number;          // 0-15
  returnPolicy: number;          // 0-15
  sellerAccountAge: number;      // 0-10
  domainTrust: number;           // 0-5
  total: number;                 // 0-100
}

export interface PlatformListing {
  id: string;
  productId: string;
  platform: Platform;
  title?: string;
  sellerName?: string;
  sellerUrl?: string;
  productUrl: string;
  price: number;
  currency: string;
  shippingCost: number;
  totalCost: number;             // price + shippingCost
  rating?: number;               // 0-5
  reviewCount?: number;
  inStock: boolean;
  trustScore: number;            // 0-100
  trustBreakdown?: TrustScoreBreakdown;
  similarityScore: number;       // 0-1
  imageUrl?: string;
  returnPolicy?: 'free' | 'paid' | 'none' | 'unknown';
  lastScrapedAt: string;
}

export interface PriceHistoryPoint {
  price: number;
  date: string;
}

// ─────────────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────────────

export interface SearchSession {
  id: string;
  userId?: string;
  inputType: SearchInputType;
  inputValue: string;
  status: SearchSessionStatus;
  originalProduct?: Product;
  resultCount: number;
  createdAt: string;
  completedAt?: string;
}

export interface SearchResultsResponse {
  session: SearchSession;
  originalListing?: PlatformListing;
  results: PlatformListing[];
  cheapestListing?: PlatformListing;
  maxSavings?: number;
  maxSavingsPercent?: number;
}

// ─────────────────────────────────────────────────────
// WATCHLIST
// ─────────────────────────────────────────────────────

export interface WatchlistItem {
  id: string;
  userId: string;
  product: Product;
  targetPrice: number;
  currency: string;
  isActive: boolean;
  lastCheckedAt?: string;
  notificationSentAt?: string;
  createdAt: string;
}

// ─────────────────────────────────────────────────────
// DROPSHIPPING
// ─────────────────────────────────────────────────────

export interface DropshippingAnalysis {
  sourcingListing: PlatformListing;    // AliExpress (cheapest)
  retailListing: PlatformListing;      // Amazon/eBay (sell price)
  profitMargin: number;                // dollars
  profitMarginPercent: number;         // percentage
  nicheOpportunityScore: number;       // 0-100
}

// ─────────────────────────────────────────────────────
// API TYPES
// ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
}

// Auth
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  displayName: string;
}

// Search requests
export interface SearchUrlDto {
  url: string;
}

export interface SearchTextDto {
  query: string;
  category?: string;
}

// ─────────────────────────────────────────────────────
// PLATFORM METADATA
// ─────────────────────────────────────────────────────

export const PLATFORM_META: Record<
  Platform,
  { label: string; color: string; bgColor: string; emoji: string }
> = {
  [Platform.AMAZON]: {
    label: 'Amazon',
    color: '#1A1A1A',
    bgColor: '#FF9900',
    emoji: '🟠',
  },
  [Platform.EBAY]: {
    label: 'eBay',
    color: '#FFFFFF',
    bgColor: '#0064D2',
    emoji: '🔵',
  },
  [Platform.ALIEXPRESS]: {
    label: 'AliExpress',
    color: '#FFFFFF',
    bgColor: '#E62B0E',
    emoji: '🔴',
  },
  [Platform.WALMART]: {
    label: 'Walmart',
    color: '#FFFFFF',
    bgColor: '#0071CE',
    emoji: '🟢',
  },
  [Platform.ETSY]: {
    label: 'Etsy',
    color: '#FFFFFF',
    bgColor: '#F1641E',
    emoji: '🟣',
  },
  [Platform.SHOPIFY]: {
    label: 'Shopify',
    color: '#1A1A1A',
    bgColor: '#96BF48',
    emoji: '⬜',
  },
  [Platform.UNKNOWN]: {
    label: 'Web',
    color: '#FFFFFF',
    bgColor: '#888888',
    emoji: '🌐',
  },
};
