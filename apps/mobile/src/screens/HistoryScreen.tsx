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
import { useNavigation } from '@react-navigation/native';
import { Colors, Typography, Spacing, Borders, Shadows, TAB_BAR_HEIGHT } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { historyApi } from '../api/endpoints';
import { QUERY_KEYS } from '../constants/app';

export const HistoryScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<any>();
  const layout = useResponsiveLayout();

  const { data: items = [], isLoading } = useQuery({
    queryKey: [QUERY_KEYS.HISTORY],
    queryFn: historyApi.getAll,
  });

  const clearMutation = useMutation({
    mutationFn: historyApi.clearAll,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.HISTORY] }),
  });

  const handleClear = () => {
    Alert.alert('Clear History', 'Delete all search history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: () => clearMutation.mutate() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      {/* Header outside the FlatList so it stays fixed at top */}
      <View style={[styles.header, { maxWidth: layout.maxContentWidth, width: '100%', alignSelf: 'center' }]}>
        <Text style={[styles.title, { fontSize: layout.fontSize(24) }]}>SEARCH HISTORY</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearBtn}>
            <Text style={styles.clearBtnText}>CLEAR ALL</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Loading...</Text>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>NO HISTORY YET</Text>
          <Text style={styles.emptyDesc}>Your past searches will appear here.</Text>
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
          renderItem={({ item }: { item: any }) => {
            const session = item.session;
            const date = new Date(item.createdAt);
            return (
              <TouchableOpacity
                onPress={() =>
                  navigation.navigate('Results', {
                    sessionId: session?.id,
                    query: session?.inputValue ?? '',
                  })
                }
                style={styles.historyCard}
              >
                <View style={styles.historyMeta}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {session?.inputType?.toUpperCase() ?? 'SEARCH'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {date.toLocaleDateString()} {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>

                <Text style={styles.queryText} numberOfLines={2}>
                  {session?.inputValue ?? 'Unknown search'}
                </Text>

                <View style={styles.resultsBadge}>
                  <Text style={styles.resultsBadgeText}>
                    {session?.resultCount ?? 0} RESULTS →
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: {
    fontSize: Typography.h2,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: Typography.letterSpacingLabel,
  },
  clearBtn: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderWidth: Borders.width,
    borderColor: Colors.bgCard,
  },
  clearBtnText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: 1,
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
  },
  list: { padding: Spacing.base, gap: Spacing.sm },
  historyCard: {
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.default,
  },
  historyMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: Colors.accentCyan,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1.5,
  },
  dateText: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
    fontWeight: Typography.medium,
  },
  queryText: {
    fontSize: Typography.small,
    fontWeight: Typography.semibold,
    color: Colors.ink,
    lineHeight: Typography.small * 1.4,
  },
  resultsBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.ink,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
  },
  resultsBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: 1,
  },
});
