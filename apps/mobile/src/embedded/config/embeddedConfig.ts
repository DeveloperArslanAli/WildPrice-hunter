/**
 * WildPrice Hunter - Embedded Backend Configuration
 *
 * Configures API keys, runtime defaults, and feature flags for
 * the embedded, offline-first mobile engine.
 *
 * v0.4: Upgraded to gemini-2.0-flash, expanded free tier to 10 searches/day,
 *       increased network timeout for reliability, raised result cap per platform.
 */

export const EMBEDDED_CONFIG = {
  // Google Gemini AI — upgraded to gemini-2.0-flash for fast, high-quality real-time analysis
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your_gemini_api_key_here',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
  GEMINI_PROJECT_NUMBER: process.env.GEMINI_PROJECT_NUMBER || '',
  GEMINI_PROJECT_NAME: process.env.GEMINI_PROJECT_NAME || '',

  // SerpAPI (Google Shopping, eBay, Walmart, AliExpress)
  SERPAPI_KEY: process.env.SERPAPI_KEY || 'your_serpapi_key_here',

  // Rainforest API (Amazon live product data)
  RAINFOREST_API_KEY: process.env.RAINFOREST_API_KEY || 'your_rainforest_key_here',

  // Limits and thresholds
  FREE_DAILY_SEARCHES: 10,             // v0.4: expanded from 5 → 10 hunts/day (free tier)
  NETWORK_TIMEOUT_MS: 15000,           // v0.4: 15s for reliability on slow mobile connections
  MAX_SCRAPED_RESULTS_PER_PLATFORM: 8, // v0.4: increased from 5 → 8 for richer comparisons
  SIMILARITY_THRESHOLD: 0.45,          // v0.4: slightly more inclusive (was 0.5) for edge products

  // Retry strategy for scraper resilience
  SCRAPER_MAX_RETRIES: 2,
  SCRAPER_RETRY_DELAY_MS: 800,

  // Storage management
  MAX_LISTINGS_CACHE: 500,             // Prune listings cache above this threshold
  MAX_PRICE_HISTORY_POINTS: 90,        // Keep up to 90-day price history per listing

  // 100% Real-time scraping — no synthetic/mock fallbacks
  OFFLINE_FALLBACK_ENABLED: false,
};
