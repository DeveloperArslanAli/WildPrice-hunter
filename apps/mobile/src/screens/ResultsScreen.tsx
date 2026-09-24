import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Borders, Shadows, CONTENT_BOTTOM_PADDING, scale } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { ListingCard } from '../components/features/ListingCard';
import { BrutalButton } from '../components/ui/BrutalButton';
import { searchApi, productsApi } from '../api/endpoints';
import { subscribeToSearchSession } from '../api/socket';
import { QUERY_KEYS, POLL_INTERVAL_MS, POLL_MAX_ATTEMPTS } from '../constants/app';
import { SortBy } from '@wildprice/shared-types';

type ResultsRoute = RouteProp<{ Results: { sessionId: string; query: string } }, 'Results'>;

const SORT_OPTIONS = [
  { key: SortBy.PRICE_ASC, label: 'LOWEST PRICE' },
  { key: SortBy.TRUST_DESC, label: 'MOST TRUSTED' },
  { key: SortBy.SAVINGS_DESC, label: 'BEST SAVINGS' },
  { key: SortBy.RATING_DESC, label: 'TOP RATED' },
];

// Responsive horizontal padding based on screen width
const getHorizontalPadding = (width: number, isLandscape: boolean): number => {
  if (width >= 600) return 32; // tablet
  if (isLandscape) return 24;  // landscape phone
  return 16;                    // portrait phone
};

export const ResultsScreen: React.FC = () => {
  const route = useRoute<ResultsRoute>();
  const { sessionId, query } = route.params;
  const layout = useResponsiveLayout();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const hPad = getHorizontalPadding(width, isLandscape);

  const [sortBy, setSortBy] = useState<SortBy>(SortBy.PRICE_ASC);
  const [pollCount, setPollCount] = useState(0);
  const [isDone, setIsDone] = useState(false);

  // Real-time WebSocket state
  const [liveListings, setLiveListings] = useState<any[]>([]);
  const [liveProgress, setLiveProgress] = useState<{ progress: number; message: string } | null>(
    null,
  );

  // Review Sentiment State
  const [sentimentReport, setSentimentReport] = useState<any>(null);
  const [loadingSentiment, setLoadingSentiment] = useState(false);
  const [showSentimentModal, setShowSentimentModal] = useState(false);

  // ── Immediate state cleanup on new search / sessionId change ──
  useEffect(() => {
    setLiveListings([]);
    setLiveProgress(null);
    setIsDone(false);
    setPollCount(0);
    setSentimentReport(null);
  }, [sessionId]);

  // ── WebSocket Real-Time Subscription (Phase 4 Task 2) ──
  useEffect(() => {
    if (isDone) return;

    const unsubscribe = subscribeToSearchSession(sessionId, {
      onProgress: (data) => {
        setLiveProgress({ progress: data.progress, message: data.message });
      },
      onListingFound: (data) => {
        if (data.listing) {
          setLiveListings((prev) => {
            if (prev.some((item) => item.id === data.listing.id)) return prev;
            return [...prev, data.listing];
          });
        }
      },
      onCompleted: () => {
        setIsDone(true);
      },
    });

    return unsubscribe;
  }, [sessionId, isDone]);

  // ── Poll session status ────────────────────────
  const statusQuery = useQuery({
    queryKey: [QUERY_KEYS.SEARCH_STATUS, sessionId],
    queryFn: () => searchApi.getStatus(sessionId),
    refetchInterval: isDone ? false : POLL_INTERVAL_MS,
    enabled: !isDone,
  });

  useEffect(() => {
    const status = statusQuery.data?.status;
    if (status === 'done' || status === 'failed') {
      setIsDone(true);
    } else {
      setPollCount((c) => c + 1);
      if (pollCount >= POLL_MAX_ATTEMPTS) {
        setIsDone(true);
      }
    }
  }, [statusQuery.data]);

  // ── Fetch results once done ────────────────────
  const resultsQuery = useQuery({
    queryKey: [QUERY_KEYS.SEARCH_RESULTS, sessionId, sortBy],
    queryFn: () => searchApi.getResults(sessionId, { sortBy }),
    enabled: isDone,
  });

  const data = resultsQuery.data;
  const fetchedResults = data?.results ?? [];
  // Merge live listings if results query hasn't resolved yet
  const results = fetchedResults.length > 0 ? fetchedResults : liveListings;
  const originalListing = data?.originalListing;
  const maxSavings = data?.maxSavings;
  const maxSavingsPercent = data?.maxSavingsPercent;

  const isLoading = !isDone && results.length === 0;

  // ── Fetch AI Sentiment (Phase 4 Task 4) ────────
  const handleOpenSentiment = async () => {
    const targetId = originalListing?.productId ?? results[0]?.productId;
    if (!targetId) return;

    setLoadingSentiment(true);
    setShowSentimentModal(true);
    try {
      const rep = await productsApi.getSentiment(targetId);
      setSentimentReport(rep);
    } catch {
      // fallback
    } finally {
      setLoadingSentiment(false);
    }
  };

  // ── Build FlatList header (header + sort bar + original listing) ──
  const ListHeader = (
    <>
      {/* ── Header ──────────────────────────────── */}
      <View style={[styles.header, { paddingHorizontal: hPad }]}>
        <View style={styles.headerTopRow}>
          <Text style={styles.headerQuery} numberOfLines={1}>
            {query}
          </Text>
          {/* AI Sentiment Trigger */}
          {results.length > 0 && (
            <TouchableOpacity style={styles.sentimentTrigger} onPress={handleOpenSentiment}>
              <Text style={styles.sentimentTriggerText}>🤖 AI AUDIT</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.headerSub}>
          {isLoading
            ? (liveProgress?.message ?? 'HUNTING PRICES ACROSS THE WEB...')
            : `${results.length} STORES COMPARED`}
        </Text>

        {/* Real-time progress bar */}
        {!isDone && liveProgress && (
          <View style={styles.progressBarWrapper}>
            <View style={[styles.progressBarFill, { width: `${liveProgress.progress}%` }]} />
          </View>
        )}

        {/* Max savings banner */}
        {maxSavings && maxSavings > 0 && (
          <View style={styles.savingsBanner}>
            <Text style={styles.savingsBannerText}>
              💰 SAVE UP TO ${maxSavings.toFixed(2)} ({maxSavingsPercent}%) vs WHERE YOU FOUND IT
            </Text>
          </View>
        )}
      </View>

      {/* ── Loading State ───────────────────────── */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={Colors.accentRed} />
            <Text style={styles.loadingTitle}>HUNTING DEALS LIVE</Text>
            <Text style={styles.loadingDesc}>
              {liveProgress?.message ??
                'Scanning Amazon, eBay, AliExpress, and Walmart in parallel...'}
            </Text>

            {/* Platform scanning indicators */}
            <View style={styles.scanningPlatforms}>
              {['AMAZON', 'EBAY', 'ALIEXPRESS', 'WALMART'].map((p) => (
                <View key={p} style={styles.scanningItem}>
                  <View style={styles.scanningDot} />
                  <Text style={styles.scanningText}>{p}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* ── Sort Bar ────────────────────────────── */}
      {!isLoading && results.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.sortBar}
          contentContainerStyle={styles.sortBarContent}
        >
          {SORT_OPTIONS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setSortBy(key)}
              style={[styles.sortChip, sortBy === key && styles.sortChipActive]}
            >
              <Text style={[styles.sortChipText, sortBy === key && styles.sortChipTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ── Original Product Card ───────────────── */}
      {!isLoading && originalListing && (
        <View style={[styles.originalSection, { paddingHorizontal: hPad }]}>
          <Text style={styles.sectionLabel}>WHERE YOU FOUND IT</Text>
          <ListingCard listing={originalListing} isOriginal={true} />
        </View>
      )}

      {/* ── Results header row ──────────────────── */}
      {!isLoading && results.length > 0 && (
        <View style={[styles.resultsHeader, { paddingHorizontal: hPad }]}>
          <Text style={styles.sectionLabel}>CHEAPER ALTERNATIVES FOUND</Text>
          {!isDone && (
            <View style={styles.liveIndicator}>
              <View style={styles.livePulse} />
              <Text style={styles.liveText}>LIVE UPDATING</Text>
            </View>
          )}
        </View>
      )}

      {/* ── Empty State ─────────────────────────── */}
      {!isLoading && results.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>NO RELEVANT PRODUCTS FOUND</Text>
          <Text style={styles.emptyDesc}>
            No relevant matching products were found on Walmart, eBay, or other platforms for this query. We never display unrelated or generic fallback items.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Single FlatList that owns all scrolling — no nested scroll issues */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <ListingCard
            listing={item}
            originalPrice={originalListing?.totalCost}
            rank={index + 1}
          />
        )}
        ListHeaderComponent={ListHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: layout.contentBottomPadding, paddingHorizontal: 0 },
        ]}
        ListFooterComponent={<View style={{ height: layout.tabBarHeight }} />}
        style={[styles.mainWrapper, { maxWidth: layout.maxContentWidth }]}
      />

      {/* ── AI Review Sentiment Modal ── */}
      <Modal visible={showSentimentModal} transparent animationType="slide">
        <View style={[styles.modalOverlay, layout.isTablet && styles.modalOverlayTablet]}>
          <View style={[styles.sentimentCard, layout.isTablet && styles.sentimentCardTablet]}>
            <View style={styles.modalHeader}>
              <View style={styles.sentimentTitleRow}>
                <Text style={styles.sentimentEmoji}>🤖</Text>
                <Text style={styles.sentimentTitle}>AI REVIEW SENTIMENT AUDIT</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSentimentModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingSentiment ? (
              <View style={styles.modalLoading}>
                <ActivityIndicator size="large" color={Colors.accentRed} />
                <Text style={styles.modalLoadingText}>Auditing buyer reviews & fake risks...</Text>
              </View>
            ) : sentimentReport ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Score & Verdict Row */}
                <View style={styles.scoreRow}>
                  <View style={styles.sentimentScoreBox}>
                    <Text style={styles.sentimentScoreNum}>{sentimentReport.sentimentScore}%</Text>
                    <Text style={styles.sentimentScoreLabel}>POSITIVE SENTIMENT</Text>
                  </View>
                  <View style={styles.verdictBox}>
                    <Text style={styles.verdictBadge}>{sentimentReport.verdict}</Text>
                    <Text
                      style={[
                        styles.fakeRiskBadge,
                        sentimentReport.fakeReviewRisk === 'LOW'
                          ? { backgroundColor: Colors.accentGreen }
                          : sentimentReport.fakeReviewRisk === 'MEDIUM'
                            ? { backgroundColor: Colors.warning }
                            : { backgroundColor: Colors.accentRed },
                      ]}
                    >
                      🛡️ {sentimentReport.fakeReviewRisk} FAKE RISK
                    </Text>
                  </View>
                </View>

                {/* Summary Quote */}
                <View style={styles.summaryQuote}>
                  <Text style={styles.summaryQuoteText}>"{sentimentReport.summary}"</Text>
                </View>

                {/* Positive Highlights */}
                <Text style={styles.highlightHeader}>✓ PROS FROM VERIFIED BUYERS</Text>
                {sentimentReport.positiveHighlights?.map((item: string, idx: number) => (
                  <View key={idx} style={styles.proItem}>
                    <Text style={styles.proBullet}>+</Text>
                    <Text style={styles.proText}>{item}</Text>
                  </View>
                ))}

                {/* Negative Highlights */}
                <Text style={styles.highlightHeader}>⚠ CONS & ISSUES TO NOTE</Text>
                {sentimentReport.negativeHighlights?.map((item: string, idx: number) => (
                  <View key={idx} style={styles.conItem}>
                    <Text style={styles.conBullet}>-</Text>
                    <Text style={styles.conText}>{item}</Text>
                  </View>
                ))}

                <View style={{ marginTop: Spacing.lg }}>
                  <BrutalButton
                    label="CLOSE AUDIT"
                    onPress={() => setShowSentimentModal(false)}
                    variant="primary"
                    fullWidth
                  />
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  header: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: Borders.widthThick,
    borderBottomColor: Colors.ink,
    // paddingHorizontal is set dynamically via hPad
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerQuery: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.ink,
    flex: 1,
  },
  sentimentTrigger: {
    backgroundColor: Colors.accentCyan,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    ...Shadows.default,
  },
  sentimentTriggerText: {
    fontSize: 10,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  headerSub: {
    fontSize: Typography.xs,
    fontFamily: 'Courier',
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  progressBarWrapper: {
    height: 4,
    backgroundColor: '#E5E5E5',
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.accentRed,
  },
  savingsBanner: {
    backgroundColor: Colors.accentGreen,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    marginTop: Spacing.sm,
  },
  savingsBannerText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loadingContainer: {
    padding: Spacing.lg,
  },
  loadingCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.widthThick,
    borderColor: Colors.ink,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.default,
  },
  loadingTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.ink,
    marginTop: Spacing.md,
    letterSpacing: 1,
  },
  loadingDesc: {
    fontSize: Typography.small,
    color: Colors.inkMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
    lineHeight: 20,
  },
  scanningPlatforms: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
    justifyContent: 'center',
  },
  scanningItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgPrimary,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    gap: 6,
  },
  scanningDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accentRed,
  },
  scanningText: {
    fontSize: 10,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  sortBar: {
    backgroundColor: Colors.bgCard,
    borderBottomWidth: Borders.width,
    borderBottomColor: Colors.ink,
  },
  sortBarContent: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.xs,
  },
  sortChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    backgroundColor: Colors.bgPrimary,
  },
  sortChipActive: {
    backgroundColor: Colors.ink,
  },
  sortChipText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  sortChipTextActive: {
    color: Colors.bgCard,
  },
  originalSection: {
    // paddingHorizontal is set dynamically via hPad
    paddingTop: Spacing.md,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: Typography.black,
    color: Colors.inkMuted,
    letterSpacing: 1.5,
    marginBottom: Spacing.xs,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal is set dynamically via hPad
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xs,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.ink,
  },
  livePulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.accentRed,
  },
  liveText: {
    fontSize: 8,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  listContent: {
    // paddingHorizontal: 0 — cards have their own margins
    paddingBottom: CONTENT_BOTTOM_PADDING,
  },
  emptyState: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.ink,
  },
  emptyDesc: {
    fontSize: Typography.small,
    color: Colors.inkMuted,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalOverlayTablet: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  sentimentCard: {
    backgroundColor: Colors.bgCard,
    borderTopWidth: Borders.widthThick,
    borderColor: Colors.ink,
    padding: Spacing.lg,
    maxHeight: '85%',
    ...Shadows.default,
  },
  sentimentCardTablet: {
    width: '75%',
    maxWidth: 580,
    borderWidth: Borders.widthThick,
    borderColor: Colors.ink,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: Borders.width,
    borderColor: Colors.ink,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sentimentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sentimentEmoji: {
    fontSize: 20,
  },
  sentimentTitle: {
    fontSize: Typography.small,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  modalClose: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.ink,
    paddingHorizontal: Spacing.sm,
  },
  modalLoading: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalLoadingText: {
    fontSize: Typography.small,
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  sentimentScoreBox: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.md,
    alignItems: 'center',
  },
  sentimentScoreNum: {
    fontSize: Typography.h1,
    fontWeight: Typography.black,
    color: Colors.accentGreen,
  },
  sentimentScoreLabel: {
    fontSize: 8,
    fontWeight: Typography.black,
    color: Colors.inkMuted,
    letterSpacing: 1,
    marginTop: 2,
  },
  verdictBox: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  verdictBadge: {
    backgroundColor: Colors.ink,
    color: Colors.bgCard,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: Typography.black,
    letterSpacing: 1,
  },
  fakeRiskBadge: {
    paddingVertical: 4,
    paddingHorizontal: Spacing.sm,
    textAlign: 'center',
    fontSize: 9,
    fontWeight: Typography.black,
    borderWidth: 1,
    borderColor: Colors.ink,
    letterSpacing: 0.5,
  },
  summaryQuote: {
    backgroundColor: '#F7F4EB',
    borderLeftWidth: 4,
    borderLeftColor: Colors.accentCyan,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryQuoteText: {
    fontSize: Typography.xs,
    fontStyle: 'italic',
    color: Colors.ink,
    lineHeight: 18,
  },
  highlightHeader: {
    fontSize: 10,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
    marginTop: Spacing.sm,
    marginBottom: 6,
  },
  proItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  proBullet: {
    color: Colors.accentGreen,
    fontWeight: Typography.black,
    fontSize: Typography.body,
    lineHeight: 16,
  },
  proText: {
    fontSize: Typography.xs,
    color: Colors.ink,
    flex: 1,
  },
  conItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  conBullet: {
    color: Colors.accentRed,
    fontWeight: Typography.black,
    fontSize: Typography.body,
    lineHeight: 16,
  },
  conText: {
    fontSize: Typography.xs,
    color: Colors.ink,
    flex: 1,
  },
});
