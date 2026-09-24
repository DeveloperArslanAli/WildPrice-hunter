import { useWindowDimensions, PixelRatio, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ResponsiveLayout {
  width: number;
  height: number;
  fontScale: number;
  isSmallPhone: boolean;
  isMediumPhone: boolean;
  isLargePhone: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  wp: (percent: number) => number;
  hp: (percent: number) => number;
  scale: (size: number) => number;
  moderateScale: (size: number, factor?: number) => number;
  fontSize: (size: number) => number;
  maxContentWidth: number | '100%';
  safeBottomInset: number;
  safeTopInset: number;
  tabBarHeight: number;
  contentBottomPadding: number;
}

const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Custom React hook for dynamic, live-updating responsive design.
 * Automatically recalculates when window dimensions, orientation,
 * or split-screen size changes.
 */
export const useResponsiveLayout = (): ResponsiveLayout => {
  const { width, height, fontScale } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const isSmallPhone = width < 360;
  const isMediumPhone = width >= 360 && width < 420;
  const isLargePhone = width >= 420 && width < 600;
  const isTablet = width >= 600;
  const isLandscape = width > height;

  /** Width as a percentage of the current screen width */
  const wp = (percent: number): number => Math.round((width * percent) / 100);

  /** Height as a percentage of the current screen height */
  const hp = (percent: number): number => Math.round((height * percent) / 100);

  /**
   * Scale size proportionally based on screen width.
   * Caps scaling on tablets to prevent ballooning UI elements.
   */
  const scale = (size: number): number => {
    const effectiveWidth = isTablet ? Math.min(width, 640) : width;
    return Math.round(PixelRatio.roundToNearestPixel((effectiveWidth / BASE_WIDTH) * size));
  };

  /**
   * Moderate scale for text and icons, scaling halfway between original and full scale.
   */
  const moderateScale = (size: number, factor = 0.5): number => {
    return Math.round(size + (scale(size) - size) * factor);
  };

  /**
   * Accessible font scaling: accounts for system fontScale while capping
   * extreme scaling to avoid text overflow/clipping.
   */
  const fontSize = (size: number): number => {
    const base = moderateScale(size, 0.4);
    const clampedFontScale = Math.min(Math.max(fontScale, 0.85), 1.3);
    return Math.round(base * clampedFontScale);
  };

  // Safe bottom clearance for gesture bars and navigation bars
  const safeBottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 12 : 8);
  const safeTopInset = insets.top;
  const tabBarHeight = 62 + safeBottomInset;
  const contentBottomPadding = tabBarHeight + 24;
  const maxContentWidth = isTablet ? 640 : '100%';

  return {
    width,
    height,
    fontScale,
    isSmallPhone,
    isMediumPhone,
    isLargePhone,
    isTablet,
    isLandscape,
    wp,
    hp,
    scale,
    moderateScale,
    fontSize,
    maxContentWidth,
    safeBottomInset,
    safeTopInset,
    tabBarHeight,
    contentBottomPadding,
  };
};
