import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Animated,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Colors, Typography, Spacing, Borders, Shadows, scale, CONTENT_BOTTOM_PADDING,
} from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BrutalButton } from '../components/ui/BrutalButton';
import { searchApi } from '../api/endpoints';
import { useSearchStore } from '../store/search.store';

type SearchMode = 'url' | 'text' | 'image';

const RECENT_SEARCHES_MOCK = [
  { id: '1', query: 'Sony WH-1000XM5', platform: 'Amazon' },
  { id: '2', query: 'Nike Air Max 270', platform: 'eBay' },
  { id: '3', query: 'Apple AirPods Pro', platform: 'Walmart' },
];

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { setSession } = useSearchStore();
  const layout = useResponsiveLayout();

  const [mode, setMode] = useState<SearchMode>('url');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const inputRef = useRef<any>(null);
  const glowAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.ink, Colors.accentCyan],
  });

  const handlePaste = async () => {
    try {
      const text = await Clipboard.getString();
      if (text) setInputValue(text);
    } catch {
      Alert.alert('Paste', 'Could not read clipboard');
    }
  };

  const extractErrorMessage = (error: any): string => {
    if (error?.response?.data?.message) {
      if (Array.isArray(error.response.data.message)) {
        return error.response.data.message.join('\n');
      }
      return String(error.response.data.message);
    }
    if (error?.message === 'Network Error' || error?.code === 'ERR_NETWORK') {
      return 'Unable to connect. Please check your network connection.';
    }
    if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      return 'Connection timed out. Please try again.';
    }
    return error?.message ?? 'Something went wrong. Please try again.';
  };

  const handleSearch = async () => {
    const rawInput = inputValue.trim();
    if (!rawInput) {
      Alert.alert('Enter a value', 'Please paste a product URL or type a product name.');
      return;
    }

    setLoading(true);
    try {
      let result;
      let effectiveQuery = rawInput;

      if (mode === 'url') {
        let normalizedUrl = rawInput;

        // Auto-fix missing protocol for naked domains
        if (!/^https?:\/\//i.test(normalizedUrl)) {
          if (/^(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/i.test(normalizedUrl)) {
            normalizedUrl = `https://${normalizedUrl}`;
          } else if (
            normalizedUrl.includes('keywords=') ||
            normalizedUrl.includes('k=') ||
            normalizedUrl.includes('q=')
          ) {
            const paramMatch = normalizedUrl.match(/(?:keywords|k|q)=([^&]+)/i);
            if (paramMatch) {
              const extractedKeyword = decodeURIComponent(paramMatch[1].replace(/\+/g, ' '));
              effectiveQuery = extractedKeyword;
              setInputValue(extractedKeyword);
              result = await searchApi.searchByText(extractedKeyword);
            } else {
              throw new Error('Incomplete URL. Please enter a full product URL starting with https://');
            }
          } else {
            // Text query in URL tab — gracefully fallback to searchByText
            effectiveQuery = rawInput;
            result = await searchApi.searchByText(rawInput);
          }
        }

        if (!result) {
          result = await searchApi.searchByUrl(normalizedUrl);
          effectiveQuery = normalizedUrl;
        }
      } else {
        result = await searchApi.searchByText(rawInput);
      }

      setSession(result.sessionId, effectiveQuery);
      navigation.navigate('Results', { sessionId: result.sessionId, query: effectiveQuery });
    } catch (error: any) {
      Alert.alert('Search Failed', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: layout.contentBottomPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          overScrollMode="never"
        >
          <View style={[styles.mainWrapper, { maxWidth: layout.maxContentWidth }]}>
            {/* ── Logo / Header ─────────────────────────── */}
            <View style={[
              styles.header,
              layout.isLandscape && styles.headerLandscape,
            ]}>
              <View style={styles.logoRow}>
                <View style={[
                  styles.logoIcon,
                  { width: layout.scale(48), height: layout.scale(48) },
                ]}>
                  <Text style={[styles.logoIconText, { fontSize: layout.fontSize(20) }]}>W</Text>
                </View>
                <View>
                  <Text style={[styles.logoText, { fontSize: layout.fontSize(24) }]}>WILDPRICE</Text>
                  <Text style={[styles.logoSub, { fontSize: layout.fontSize(17) }]}>HUNTER</Text>
                </View>
              </View>
              <Text style={styles.tagline}>DROP A LINK. WE FIND IT CHEAPER.</Text>
            </View>

            {/* ── Mode Tabs ─────────────────────────────── */}
            <View style={styles.modeTabs}>
              {([
                { key: 'url', label: '🔗 LINK' },
                { key: 'text', label: '🔍 SEARCH' },
                { key: 'image', label: '📷 IMAGE' },
              ] as const).map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  onPress={() => setMode(key)}
                  style={[
                    styles.modeTab,
                    mode === key && styles.modeTabActive,
                    // Ensure 44pt minimum touch target on all device sizes
                    { minHeight: Math.max(44, layout.scale(44)) },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modeTabText,
                      mode === key && styles.modeTabTextActive,
                      { fontSize: layout.fontSize(12) },
                    ]}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>


            {/* ── Input Area ────────────────────────────── */}
            <View style={[
              styles.inputContainer,
              layout.isLandscape && { paddingHorizontal: layout.scale(32) },
            ]}>
              <Animated.View style={[styles.inputWrapper, { borderColor }]}>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, { fontSize: layout.fontSize(16) }]}
                  value={inputValue}
                  onChangeText={setInputValue}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  placeholder={
                    mode === 'url'
                      ? 'Paste product URL from Amazon, eBay, TikTok...'
                      : 'Type product name (e.g. Sony WH-1000XM5)'
                  }
                  placeholderTextColor={Colors.inkLight}
                  multiline={mode === 'url'}
                  numberOfLines={mode === 'url' ? 2 : 1}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                  textAlignVertical="top"
                />

                {/* Paste / Clear button */}
                {inputValue ? (
                  <TouchableOpacity
                    onPress={() => setInputValue('')}
                    style={styles.inputAction}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.inputActionText}>✕</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={handlePaste}
                    style={styles.inputAction}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.inputActionText}>PASTE</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>

              {/* Search CTA */}
              <BrutalButton
                label="HUNT THE PRICE 🔍"
                onPress={handleSearch}
                loading={loading}
                fullWidth
                size="lg"
                style={styles.searchButton}
              />
            </View>

          {/* ── Stats Banner ──────────────────────────── */}
          <View style={styles.statsBanner}>
            {/* Fixed: was "3 PLATFORMS" — we search 4: Amazon, eBay, AliExpress, Walmart */}
            <StatItem value="4" label="PLATFORMS" />
            <View style={styles.statsDivider} />
            <StatItem value="∞" label="PRODUCTS" />
            <View style={styles.statsDivider} />
            <StatItem value="100%" label="FREE" />
          </View>

          {/* ── How It Works ──────────────────────────── */}
          <View style={styles.howItWorks}>
            <Text style={styles.sectionLabel}>HOW IT WORKS</Text>
            <View style={styles.steps}>
              <StepItem number="01" title="DROP A LINK" desc="From Amazon, eBay, AliExpress, Walmart, or anywhere" />
              <StepItem number="02" title="WE SEARCH" desc="AI scans 4 platforms simultaneously using Gemini 2.0" />
              <StepItem number="03" title="YOU SAVE" desc="Get the same product at the lowest price guaranteed" />
            </View>
          </View>

          {/* ── Recent Searches ───────────────────────── */}
          <View style={styles.recentSection}>
            <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
            {RECENT_SEARCHES_MOCK.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => {
                  setInputValue(item.query);
                  setMode('text');
                }}
                style={styles.recentItem}
                activeOpacity={0.7}
              >
                <Text style={styles.recentQuery}>{item.query}</Text>
                <Text style={styles.recentPlatform}>via {item.platform} →</Text>
              </TouchableOpacity>
            ))}
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

// Sub-components
const StatItem: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StepItem: React.FC<{ number: string; title: string; desc: string }> = ({
  number, title, desc,
}) => (
  <View style={styles.stepItem}>
    <View style={styles.stepNumber}>
      <Text style={styles.stepNumberText}>{number}</Text>
    </View>
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  scrollContent: {
    flexGrow: 1,
  },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  // ── Header ─────────────────────────────────────
  header: {
    width: '100%',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
    backgroundColor: Colors.ink,
  },
  headerLandscape: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  logoIcon: {
    width: scale(48),
    height: scale(48),
    backgroundColor: Colors.accentRed,
    borderWidth: Borders.width,
    borderColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.default,
  },
  logoIconText: {
    fontSize: Typography.h2,
    fontWeight: Typography.black,
    color: Colors.bgCard,
  },
  logoText: {
    fontSize: Typography.h2,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: Typography.letterSpacingLabel,
    lineHeight: Typography.h2 * 1.1,
  },
  logoSub: {
    fontSize: Typography.h4,
    fontWeight: Typography.black,
    color: Colors.accentRed,
    letterSpacing: Typography.letterSpacingLabel * 1.5,
  },
  tagline: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.accentGreen,
    letterSpacing: Typography.letterSpacingLabel,
    marginTop: Spacing.xs,
  },
  // ── Mode Tabs ──────────────────────────────────
  modeTabs: {
    flexDirection: 'row',
    width: '100%',
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
  },
  modeTab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRightWidth: Borders.width,
    borderRightColor: Colors.ink,
    backgroundColor: Colors.bgCard,
    justifyContent: 'center',
  },
  modeTabActive: {
    backgroundColor: Colors.accentCyan,
  },
  modeTabText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
    letterSpacing: 1,
    textAlign: 'center',
  },
  modeTabTextActive: {
    color: Colors.ink,
  },
  // ── Input ──────────────────────────────────────
  inputContainer: {
    width: '100%',
    padding: Spacing.base,
    gap: Spacing.md,
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
  },
  inputWrapper: {
    width: '100%',
    flexDirection: 'row',
    borderWidth: 3,
    borderColor: Colors.ink,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    ...Shadows.default,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: Typography.body,
    color: Colors.ink,
    fontWeight: Typography.medium,
    minHeight: 52,
    textAlignVertical: 'top',
  },
  inputAction: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderLeftWidth: Borders.width,
    borderLeftColor: Colors.ink,
    justifyContent: 'center',
    minHeight: 52,
    alignItems: 'center',
  },
  inputActionText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  searchButton: {
    width: '100%',
    marginTop: Spacing.xs,
  },
  // ── Stats Banner ───────────────────────────────
  statsBanner: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: Colors.ink,
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: Spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    gap: Spacing.xxs,
  },
  statValue: {
    fontSize: Typography.h2,
    fontWeight: Typography.black,
    color: Colors.accentGreen,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.bgCard,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  statsDivider: {
    width: Borders.width,
    height: '60%',
    backgroundColor: Colors.bgCard,
    opacity: 0.3,
  },
  // ── How It Works ───────────────────────────────
  howItWorks: {
    width: '100%',
    padding: Spacing.base,
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
  },
  sectionLabel: {
    fontSize: Typography.label,
    fontWeight: Typography.black,
    color: Colors.inkMuted,
    letterSpacing: Typography.letterSpacingLabel,
    marginBottom: Spacing.md,
  },
  steps: {
    gap: Spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.md,
    ...Shadows.default,
  },
  stepNumber: {
    backgroundColor: Colors.accentRed,
    width: 36,
    height: 36,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  stepNumberText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: 1,
  },
  stepContent: {
    flex: 1,
    flexShrink: 1,
  },
  stepTitle: {
    fontSize: Typography.small,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
    marginBottom: 2,
  },
  stepDesc: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
    lineHeight: Typography.xs * 1.5,
  },
  // ── Recent Searches ────────────────────────────
  recentSection: {
    width: '100%',
    padding: Spacing.base,
  },
  recentItem: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.default,
    minHeight: 48,
  },
  recentQuery: {
    fontSize: Typography.small,
    fontWeight: Typography.semibold,
    color: Colors.ink,
    flex: 1,
  },
  recentPlatform: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
    fontWeight: Typography.bold,
  },
});
