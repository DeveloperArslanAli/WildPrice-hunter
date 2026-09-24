import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors, Typography, Spacing, Borders, Shadows } from '../constants/theme';
import { BrutalButton } from '../components/ui/BrutalButton';
import { STORAGE_KEYS } from '../constants/app';

const { width } = Dimensions.get('window');

interface Slide {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  highlight: string;
  previewType: 'link' | 'matrix' | 'trust';
  bgAccent: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    badge: 'STEP 1: ANY PLATFORM',
    badgeColor: Colors.warning,
    title: 'DROP ANY PRODUCT LINK',
    highlight: 'SCAN THE ENTIRE WEB',
    subtitle:
      'Saw an item on Amazon, eBay, TikTok Shop, or Instagram? Just copy the link and drop it in. WildPrice AI fingerprints and identifies the exact model instantly.',
    previewType: 'link',
    bgAccent: Colors.warning,
  },
  {
    id: '2',
    badge: 'STEP 2: ARBITRAGE MATRIX',
    badgeColor: Colors.accentCyan,
    title: 'STOP OVERPAYING EVERYWHERE',
    highlight: 'SAME PRODUCT. HALF PRICE.',
    subtitle:
      'Stores markup the exact same goods by 200% to 500%. We search manufacturer warehouses, wholesale listings, and alternate stores to find the real lowest price.',
    previewType: 'matrix',
    bgAccent: Colors.accentCyan,
  },
  {
    id: '3',
    badge: 'STEP 3: SAFETY FIRST',
    badgeColor: Colors.accentGreen,
    title: 'VERIFIED TRUST RATIO',
    highlight: 'BUY WITH 100% CONFIDENCE',
    subtitle:
      'Cheap prices mean nothing if the seller is fraudulent. Our multi-factor Trust Score audits seller age, buyer feedback, dispute rate, and return policies.',
    previewType: 'trust',
    bgAccent: Colors.accentGreen,
  },
];

export const OnboardingScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleFinish = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDED, 'true');
    } catch {
      // ignore
    }
    navigation.replace('Main');
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleSkip = () => {
    handleFinish();
  };

  const renderSlidePreview = (slide: Slide) => {
    if (slide.previewType === 'link') {
      return (
        <View style={[styles.previewBox, { backgroundColor: Colors.bgCard }]}>
          <View style={styles.previewHeader}>
            <View style={styles.trafficLightRow}>
              <View style={[styles.trafficLight, { backgroundColor: Colors.accentRed }]} />
              <View style={[styles.trafficLight, { backgroundColor: Colors.warning }]} />
              <View style={[styles.trafficLight, { backgroundColor: Colors.accentGreen }]} />
            </View>
            <Text style={styles.previewHeaderTitle}>LINK_DETECTED.EXE</Text>
          </View>
          <View style={styles.mockUrlBox}>
            <Text style={styles.mockUrlPlatform}>AMAZON.COM</Text>
            <Text style={styles.mockUrlText} numberOfLines={1}>
              amazon.com/dp/B09XYZ123?ref=smart_watch_v2
            </Text>
          </View>
          <View style={styles.detectedItemRow}>
            <View style={styles.detectedIcon}>
              <Text style={{ fontSize: 24 }}>⌚</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detectedName}>Noise-Cancelling Smartwatch Pro</Text>
              <Text style={styles.detectedOriginalPrice}>Amazon Price: $54.99</Text>
            </View>
          </View>
        </View>
      );
    }

    if (slide.previewType === 'matrix') {
      return (
        <View style={[styles.previewBox, { backgroundColor: Colors.bgCard }]}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewHeaderTitle}>PRICE_COMPARISON_MATRIX</Text>
            <Text style={styles.savingsTag}>SAVE $32.49</Text>
          </View>
          <View style={styles.matrixRow}>
            <View style={styles.matrixPlatform}>
              <Text style={styles.matrixPlatformText}>ALIEXPRESS</Text>
            </View>
            <Text style={styles.matrixBestPrice}>$22.50</Text>
            <View style={styles.lowestBadge}>
              <Text style={styles.lowestBadgeText}>LOWEST</Text>
            </View>
          </View>
          <View style={styles.matrixRow}>
            <View style={[styles.matrixPlatform, { backgroundColor: Colors.accentCyan }]}>
              <Text style={styles.matrixPlatformText}>EBAY STORE</Text>
            </View>
            <Text style={styles.matrixMidPrice}>$34.00</Text>
            <Text style={styles.matrixDelta}>+$11.50</Text>
          </View>
          <View style={styles.matrixRow}>
            <View style={[styles.matrixPlatform, { backgroundColor: Colors.amazon }]}>
              <Text style={styles.matrixPlatformText}>AMAZON</Text>
            </View>
            <Text style={styles.matrixHighPrice}>$54.99</Text>
            <Text style={styles.matrixDelta}>+$32.49</Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.previewBox, { backgroundColor: Colors.bgCard }]}>
        <View style={styles.previewHeader}>
          <Text style={styles.previewHeaderTitle}>AUDIT_REPORT_V4</Text>
          <View style={styles.trustScoreTag}>
            <Text style={styles.trustScoreNumber}>94</Text>
            <Text style={styles.trustScoreOutOf}>/100</Text>
          </View>
        </View>
        <View style={styles.trustRow}>
          <Text style={styles.trustLabel}>PLATFORM RELIABILITY</Text>
          <Text style={styles.trustValue}>30 / 30 pts</Text>
        </View>
        <View style={styles.trustRow}>
          <Text style={styles.trustLabel}>SELLER ACCOUNT (5+ YRS)</Text>
          <Text style={styles.trustValue}>10 / 10 pts</Text>
        </View>
        <View style={styles.trustRow}>
          <Text style={styles.trustLabel}>30-DAY FREE RETURNS</Text>
          <Text style={styles.trustValue}>15 / 15 pts</Text>
        </View>
        <View style={styles.verifiedBanner}>
          <Text style={styles.verifiedBannerText}>✓ VERIFIED AUTHENTIC SELLER</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Top Bar: Logo & Skip */}
      <View style={styles.topBar}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>⚡ WILDPRICE</Text>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipText}>SKIP</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.slideContainer}>
            {/* Category Tag */}
            <View style={[styles.badge, { backgroundColor: item.badgeColor }]}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>

            {/* Title & Highlight */}
            <Text style={styles.title}>{item.title}</Text>
            <View style={[styles.highlightPill, { backgroundColor: item.bgAccent }]}>
              <Text style={styles.highlightText}>{item.highlight}</Text>
            </View>

            {/* Dynamic Interactive Preview Card */}
            <View style={styles.previewWrapper}>{renderSlidePreview(item)}</View>

            {/* Subtitle / Description */}
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          </View>
        )}
      />

      {/* Footer Navigation */}
      <View style={styles.footer}>
        {/* Step Indicator */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                currentIndex === idx ? styles.dotActive : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Action Button */}
        <View style={styles.buttonWrapper}>
          <BrutalButton
            label={currentIndex === SLIDES.length - 1 ? 'LAUNCH WILDPRICE ⚡' : 'NEXT STEP →'}
            onPress={handleNext}
            variant="primary"
            size="lg"
            fullWidth
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  logoBadge: {
    backgroundColor: Colors.ink,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    ...Shadows.default,
  },
  logoText: {
    color: Colors.warning,
    fontSize: Typography.small,
    fontWeight: Typography.black,
    letterSpacing: 1.5,
  },
  skipButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    backgroundColor: Colors.bgCard,
    ...Shadows.default,
  },
  skipText: {
    fontSize: Typography.small,
    fontWeight: Typography.bold,
    color: Colors.ink,
  },
  slideContainer: {
    width,
    paddingHorizontal: Spacing.lg,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    marginBottom: Spacing.sm,
    ...Shadows.default,
  },
  badgeText: {
    fontSize: Typography.label,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  title: {
    fontSize: Typography.h1,
    fontWeight: Typography.black,
    color: Colors.ink,
    lineHeight: 38,
    marginBottom: 6,
  },
  highlightPill: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    marginBottom: Spacing.lg,
    ...Shadows.default,
  },
  highlightText: {
    fontSize: Typography.h4,
    fontWeight: Typography.black,
    color: Colors.ink,
  },
  previewWrapper: {
    width: '100%',
    marginVertical: Spacing.md,
  },
  previewBox: {
    borderWidth: Borders.widthThick,
    borderColor: Colors.ink,
    padding: Spacing.md,
    ...Shadows.default,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
    paddingBottom: Spacing.xs,
    marginBottom: Spacing.md,
  },
  trafficLightRow: {
    flexDirection: 'row',
    gap: 5,
  },
  trafficLight: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  previewHeaderTitle: {
    fontSize: Typography.label,
    fontWeight: Typography.black,
    color: Colors.inkMuted,
    letterSpacing: 1,
  },
  mockUrlBox: {
    backgroundColor: Colors.bgPrimary,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  mockUrlPlatform: {
    fontSize: 9,
    fontWeight: Typography.black,
    color: Colors.amazon,
    letterSpacing: 1,
    marginBottom: 2,
  },
  mockUrlText: {
    fontSize: Typography.xs,
    fontFamily: 'Courier',
    color: Colors.inkMuted,
  },
  detectedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.bgPrimary,
    padding: Spacing.sm,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  detectedIcon: {
    width: 44,
    height: 44,
    backgroundColor: Colors.warning,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectedName: {
    fontSize: Typography.small,
    fontWeight: Typography.bold,
    color: Colors.ink,
  },
  detectedOriginalPrice: {
    fontSize: Typography.xs,
    color: Colors.accentRed,
    fontWeight: Typography.bold,
  },
  savingsTag: {
    backgroundColor: Colors.accentGreen,
    color: Colors.ink,
    fontSize: 10,
    fontWeight: Typography.black,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  matrixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  matrixPlatform: {
    backgroundColor: Colors.accentRed,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  matrixPlatformText: {
    fontSize: 10,
    fontWeight: Typography.black,
    color: Colors.bgCard,
  },
  matrixBestPrice: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.accentGreen,
  },
  matrixMidPrice: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.ink,
  },
  matrixHighPrice: {
    fontSize: Typography.body,
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
    textDecorationLine: 'line-through',
  },
  matrixDelta: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.accentRed,
  },
  lowestBadge: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  lowestBadgeText: {
    fontSize: 9,
    fontWeight: Typography.black,
    color: Colors.ink,
  },
  trustScoreTag: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  trustScoreNumber: {
    fontSize: Typography.h4,
    fontWeight: Typography.black,
    color: Colors.ink,
  },
  trustScoreOutOf: {
    fontSize: 10,
    fontWeight: Typography.bold,
    color: Colors.ink,
  },
  trustRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  trustLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.ink,
  },
  trustValue: {
    fontSize: Typography.xs,
    fontFamily: 'Courier',
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
  },
  verifiedBanner: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.accentGreen,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    paddingVertical: Spacing.xs,
    alignItems: 'center',
  },
  verifiedBannerText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: Typography.small,
    color: Colors.inkMuted,
    lineHeight: 22,
    marginTop: Spacing.xs,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignSelf: 'center',
  },
  dot: {
    height: 8,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.ink,
  },
  dotInactive: {
    width: 8,
    backgroundColor: Colors.bgPrimary,
  },
  buttonWrapper: {
    width: '100%',
  },
});
