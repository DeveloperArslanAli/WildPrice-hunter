/**
 * WildPrice Hunter — Design System Tokens
 * Style: Flat + Brutalism
 * v0.5: Added responsive scaling utilities, safe-area constants, TAB_BAR_HEIGHT
 */

import { Dimensions, Platform, PixelRatio } from 'react-native';

// ── Responsive Scaling ─────────────────────────────────────
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (designed for 375pt width — iPhone 13 mini / most common)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Scale a size relative to screen width.
 * Use for horizontal dimensions, font sizes, icon sizes.
 */
export const scale = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel((SCREEN_WIDTH / BASE_WIDTH) * size));
};

/**
 * Scale a size relative to screen height.
 * Use for vertical dimensions, spacing between major sections.
 */
export const verticalScale = (size: number): number => {
  return Math.round(PixelRatio.roundToNearestPixel((SCREEN_HEIGHT / BASE_HEIGHT) * size));
};

/**
 * Moderate scale — scales between the original size and the scaled size.
 * Best for font sizes and icon sizes to prevent extreme scaling on tablets.
 * factor: 0 = no scaling, 1 = full scaling. Default 0.5 is recommended.
 */
export const moderateScale = (size: number, factor = 0.5): number => {
  return Math.round(size + (scale(size) - size) * factor);
};

/** Width as percentage of screen width */
export const wp = (percent: number): number => (SCREEN_WIDTH * percent) / 100;

/** Height as percentage of screen height */
export const hp = (percent: number): number => (SCREEN_HEIGHT * percent) / 100;

export { SCREEN_WIDTH, SCREEN_HEIGHT };

// Detect tablet (width >= 600dp)
export const IS_TABLET = SCREEN_WIDTH >= 600;
// Detect small phone (width < 360dp)
export const IS_SMALL_PHONE = SCREEN_WIDTH < 360;

/** Standard tab bar height — used by screens to add bottom padding */
export const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 76;
/** Content bottom padding — tab bar height + extra breathing room */
export const CONTENT_BOTTOM_PADDING = TAB_BAR_HEIGHT + 24;

// ─────────────────────────────────────────────────────────────────────────────

export const Colors = {
  // ── Backgrounds ───────────────────────────────────
  bgPrimary: '#F5F0E8',      // Cream — main background
  bgCard: '#FFFFFF',          // Pure white — card fill
  bgDark: '#0D0D0D',          // Near-black — dark mode background
  bgDarkCard: '#1A1A1A',      // Dark card

  // ── Core ──────────────────────────────────────────
  ink: '#1A1A1A',             // Near-black — borders, primary text
  inkMuted: '#666666',        // Secondary text
  inkLight: '#999999',        // Tertiary text

  // ── Accents ───────────────────────────────────────
  accentRed: '#FF3B00',       // Brutal red-orange — CTA, price badges
  accentCyan: '#00D4F5',      // Electric cyan — trust score, links
  accentGreen: '#C8FF00',     // Acid green — savings badge
  accentViolet: '#7B2FBE',    // Deep violet

  // ── Semantic ──────────────────────────────────────
  success: '#00CC66',
  error: '#FF0055',
  warning: '#FF9900',

  // ── Platform Colors ───────────────────────────────
  amazon: '#FF9900',
  ebay: '#0064D2',
  aliexpress: '#E62B0E',
  walmart: '#0071CE',
  etsy: '#F1641E',
  shopify: '#96BF48',

  // ── Transparent ───────────────────────────────────
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.08)',
};

export const Typography = {
  // Font Families
  display: 'SpaceGrotesk-Bold',
  displayMedium: 'SpaceGrotesk-Medium',
  displayRegular: 'SpaceGrotesk-Regular',
  mono: 'IBMPlexMono-Bold',
  monoRegular: 'IBMPlexMono-Regular',

  // Font Sizes — moderately scaled for responsiveness
  h1: moderateScale(32),
  h2: moderateScale(24),
  h3: moderateScale(20),
  h4: moderateScale(17),
  body: moderateScale(16),
  small: moderateScale(14),
  xs: moderateScale(12),
  label: moderateScale(11),

  // Font Weights
  black: '900' as const,
  bold: '700' as const,
  semibold: '600' as const,
  medium: '500' as const,
  regular: '400' as const,

  // Line Heights
  lineHeightTight: 1.2,
  lineHeightNormal: 1.5,
  lineHeightRelaxed: 1.7,

  // Letter Spacing
  letterSpacingLabel: 2,
  letterSpacingTight: -0.5,
};

export const Spacing = {
  xxs: scale(2),
  xs: scale(4),
  sm: scale(8),
  md: scale(12),
  base: scale(16),
  lg: scale(20),
  xl: scale(24),
  xxl: scale(32),
  xxxl: scale(48),
  section: scale(64),
};

export const BorderRadius = {
  none: 0,       // Brutalist — no rounding on key elements
  xs: 2,
  sm: 4,         // Slight rounding for inputs
  badge: 2,
};

export const Borders = {
  width: 2,
  widthThick: 3,
  color: Colors.ink,
  style: 'solid' as const,
};

export const Shadows = {
  // Hard brutalist shadows (offset, no blur)
  default: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  pressed: {
    shadowColor: Colors.ink,
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 1,
  },
  accent: {
    shadowColor: Colors.accentRed,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  cyan: {
    shadowColor: Colors.accentCyan,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
};

export const Animations = {
  fast: 150,
  normal: 250,
  slow: 400,
};

// Platform badge metadata (matches PLATFORM_META from shared types)
export const PlatformMeta = {
  amazon: { label: 'Amazon', color: '#1A1A1A', bgColor: '#FF9900' },
  ebay: { label: 'eBay', color: '#FFFFFF', bgColor: '#0064D2' },
  aliexpress: { label: 'AliExpress', color: '#FFFFFF', bgColor: '#E62B0E' },
  walmart: { label: 'Walmart', color: '#FFFFFF', bgColor: '#0071CE' },
  etsy: { label: 'Etsy', color: '#FFFFFF', bgColor: '#F1641E' },
  shopify: { label: 'Shopify', color: '#1A1A1A', bgColor: '#96BF48' },
  unknown: { label: 'Web', color: '#FFFFFF', bgColor: '#666666' },
} as const;
