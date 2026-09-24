import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Colors, Typography, Spacing, Borders, Shadows } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { watchlistApi } from '../api/endpoints';
import { QUERY_KEYS } from '../constants/app';

export const WatchlistScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const layout = useResponsiveLayout();

  const { data: items = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.WATCHLIST],
    queryFn: watchlistApi.getAll,
  });

  const removeMutation = useMutation({
    mutationFn: watchlistApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.WATCHLIST] }),
  });

  const handleRemove = (id: string) => {
    Alert.alert('Remove Alert', 'Remove this price alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeMutation.mutate(id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      {/* Fixed header */}
      <View style={[styles.header, { maxWidth: layout.maxContentWidth, width: '100%', alignSelf: 'center' }]}>
        <Text style={[styles.title, { fontSize: layout.fontSize(24) }]}>PRICE ALERTS</Text>
        <Text style={styles.subtitle}>We notify you when prices drop</Text>
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔔</Text>
          <Text style={styles.emptyTitle}>NO ALERTS SET</Text>
          <Text style={styles.emptyDesc}>
            Search for a product and tap &quot;Set Alert&quot; to get notified when prices drop.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: layout.contentBottomPadding, maxWidth: layout.maxContentWidth, width: '100%', alignSelf: 'center' },
          ]}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View style={{ height: layout.tabBarHeight }} />}
          renderItem={({ item }: { item: any }) => (
            <View style={styles.alertCard}>
              <View style={styles.alertInfo}>
                <Text style={styles.alertProduct} numberOfLines={2}>
                  {item.product?.title ?? 'Product'}
                </Text>
                <View style={styles.priceRow}>
                  <View style={styles.targetPriceBox}>
                    <Text style={styles.targetLabel}>TARGET</Text>
                    <Text style={styles.targetPrice}>${Number(item.targetPrice).toFixed(2)}</Text>
                  </View>
                  <View style={[styles.targetPriceBox, { backgroundColor: Colors.accentCyan }]}>
                    <Text style={styles.targetLabel}>STATUS</Text>
                    <Text style={styles.targetPrice}>
                      {item.isActive ? '🟢 ACTIVE' : '⛕ PAUSED'}
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleRemove(item.id)}
                style={styles.removeBtn}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  header: {
    backgroundColor: Colors.ink,
    padding: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: Typography.letterSpacingLabel,
  },
  subtitle: {
    fontSize: Typography.xs,
    color: Colors.inkLight,
    fontWeight: Typography.bold,
    letterSpacing: 1,
    marginTop: Spacing.xs,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xxl,
    gap: Spacing.md,
  },
  emptyIcon: { fontSize: 64 },
  emptyTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: Typography.letterSpacingLabel,
  },
  emptyText: { fontSize: Typography.body, color: Colors.inkMuted },
  emptyDesc: {
    fontSize: Typography.small,
    color: Colors.inkMuted,
    textAlign: 'center',
    lineHeight: Typography.small * 1.6,
  },
  list: { padding: Spacing.base, gap: Spacing.md },
  alertCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    flexDirection: 'row',
    alignItems: 'flex-start',
    ...Shadows.default,
  },
  alertInfo: { flex: 1, padding: Spacing.md, gap: Spacing.md },
  alertProduct: {
    fontSize: Typography.small,
    fontWeight: Typography.semibold,
    color: Colors.ink,
    lineHeight: Typography.small * 1.4,
  },
  priceRow: { flexDirection: 'row', gap: Spacing.sm },
  targetPriceBox: {
    backgroundColor: Colors.accentGreen,
    padding: Spacing.sm,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    flex: 1,
    alignItems: 'center',
  },
  targetLabel: {
    fontSize: 9,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 2,
  },
  targetPrice: {
    fontSize: Typography.small,
    fontWeight: Typography.black,
    color: Colors.ink,
    marginTop: 2,
  },
  removeBtn: {
    padding: Spacing.md,
    borderLeftWidth: Borders.width,
    borderLeftColor: Colors.ink,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 48,
  },
  removeBtnText: {
    fontSize: Typography.body,
    fontWeight: Typography.black,
    color: Colors.error,
  },
});
