import { Platform } from 'react-native';

/**
 * WildPrice Hunter API Configuration
 *
 * Network Strategy:
 * - Local Development:
 *   - Android Studio Emulator (AVD): 10.0.2.2 maps to host localhost
 *   - MSI App Player / BlueStacks / Genymotion / Physical devices on LAN: 192.168.1.5 or host IP
 * - Production:
 *   - Set your live cloud API domain (e.g. https://api.wildpricehunter.com/api)
 */
export const LOCAL_HOST_IP = '192.168.1.5'; // Host machine LAN IP
export const LOCAL_PORT = '3000';

const getBaseUrl = (): string => {
  return 'embedded://wildprice';
};

export const API_BASE_URL = getBaseUrl();

export const POLL_INTERVAL_MS = 2000;   // How often to poll search status
export const POLL_MAX_ATTEMPTS = 30;    // Max polling attempts (60s total)
export const FREE_DAILY_SEARCHES = 10; // v0.4: expanded from 5 → 10 (matches EMBEDDED_CONFIG)

export const STORAGE_KEYS = {
  ACCESS_TOKEN: '@wildprice:access_token',
  REFRESH_TOKEN: '@wildprice:refresh_token',
  USER: '@wildprice:user',
  ONBOARDED: '@wildprice:onboarded',
  THEME: '@wildprice:theme',
};

export const QUERY_KEYS = {
  SEARCH_STATUS: 'search-status',
  SEARCH_RESULTS: 'search-results',
  WATCHLIST: 'watchlist',
  HISTORY: 'history',
  PROFILE: 'profile',
  PRODUCT: 'product',
  PRICE_HISTORY: 'price-history',
};
