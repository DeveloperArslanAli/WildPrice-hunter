import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Borders, Shadows, CONTENT_BOTTOM_PADDING } from '../constants/theme';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { BrutalButton } from '../components/ui/BrutalButton';
import { useAuthStore } from '../store/auth.store';
import { authApi, usersApi } from '../api/endpoints';

export const ProfileScreen: React.FC = () => {
  const { user, clearAuth, toggleDropshippingMode, isAuthenticated } = useAuthStore();
  const layout = useResponsiveLayout();
  // Responsive avatar: 48 small phone, 56 standard, 72 tablet
  const avatarSize = layout.isSmallPhone ? 48 : layout.isTablet ? 72 : 56;

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await authApi.logout();
          } finally {
            await clearAuth();
          }
        },
      },
    ]);
  };

  const handleToggleDropshipping = async (value: boolean) => {
    toggleDropshippingMode();
    if (isAuthenticated) {
      await usersApi.updateProfile({ dropshippingMode: value }).catch(() => {});
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: layout.contentBottomPadding },
        ]}
      >
        <View style={[styles.mainWrapper, { maxWidth: layout.maxContentWidth }]}>
          {/* ── Header ────────────────────────────── */}
          <View style={styles.header}>
          <View style={[styles.avatar, { width: avatarSize, height: avatarSize }]}>
            <Text style={[styles.avatarText, { fontSize: layout.fontSize(avatarSize * 0.4) }]}>
              {user?.displayName?.[0]?.toUpperCase() ?? 'G'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.displayName, { fontSize: layout.fontSize(17) }]}>
              {user?.displayName ?? 'Guest User'}
            </Text>
            <Text style={[styles.email, { fontSize: layout.fontSize(12) }]}>
              {user?.email ?? 'guest@wildprice.app'}
            </Text>
          </View>

          {/* Plan badge — use flex to push to right */}
          <View style={styles.planBadgeWrapper}>
            <View style={[styles.planBadge, user?.plan === 'pro' && styles.planBadgePro]}>
              <Text style={styles.planText}>
                {user?.plan?.toUpperCase() ?? 'GUEST'} PLAN
              </Text>
            </View>
          </View>
        </View>

        {/* ── Settings ──────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SETTINGS</Text>

          {/* Dropshipping Mode */}
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>DROPSHIPPING MODE</Text>
              <Text style={styles.settingDesc}>
                Shows profit margin & sourcing costs for resellers
              </Text>
            </View>
            <Switch
              value={user?.dropshippingMode ?? false}
              onValueChange={handleToggleDropshipping}
              trackColor={{ false: Colors.inkLight, true: Colors.accentGreen }}
              thumbColor={Colors.bgCard}
              ios_backgroundColor={Colors.inkLight}
            />
          </View>
        </View>

        {/* ── Upgrade Section (for free users) ──── */}
        {user?.plan !== 'pro' && (
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeTitle}>UPGRADE TO PRO</Text>
            <Text style={styles.upgradeDesc}>
              Unlimited daily searches, price history charts, priority scraping
            </Text>
            <View style={styles.featureList}>
              {['∞ Unlimited searches', '📊 Price history', '🔔 Unlimited alerts', '⚡ Priority speed'].map((f) => (
                <Text key={f} style={styles.featureItem}>{f}</Text>
              ))}
            </View>
            <BrutalButton
              label="Upgrade — $9.99/mo"
              onPress={() => Alert.alert('Coming Soon', 'Pro plan launching soon!')}
              fullWidth
            />
          </View>
        )}

        {/* ── Account Actions ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          {isAuthenticated ? (
            <TouchableOpacity onPress={handleLogout} style={styles.dangerRow}>
              <Text style={styles.dangerText}>SIGN OUT</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.guestActions}>
              <Text style={styles.guestNote}>
                You&apos;re in guest mode. Sign in to save history and set unlimited alerts.
              </Text>
            </View>
          )}
        </View>

        {/* ── App Info ──────────────────────────── */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>WILDPRICE HUNTER v0.8</Text>
          <Text style={styles.appInfoText}>Built to help you save real money.</Text>
          <Text style={styles.appInfoText}>© 2026 WildPrice Hunter. All rights reserved.</Text>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bgPrimary },
  mainWrapper: {
    width: '100%',
    alignSelf: 'center',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.ink,
    padding: Spacing.base,
    paddingBottom: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flexWrap: 'wrap',
  },
  avatar: {
    width: 56,
    height: 56,
    backgroundColor: Colors.accentRed,
    borderWidth: Borders.width,
    borderColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.accent,
  },
  avatarText: { fontSize: Typography.h2, fontWeight: Typography.black, color: Colors.bgCard },
  displayName: { fontSize: Typography.h4, fontWeight: Typography.black, color: Colors.bgCard },
  email: { fontSize: Typography.xs, color: Colors.inkLight, fontWeight: Typography.medium },
  planBadgeWrapper: {
    flexGrow: 1,
    alignItems: 'flex-end',
  },
  planBadge: {
    backgroundColor: Colors.bgCard,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: Borders.width,
    borderColor: Colors.bgCard,
  },
  planBadgePro: { backgroundColor: Colors.accentGreen },
  planText: { fontSize: Typography.xs, fontWeight: Typography.black, color: Colors.ink, letterSpacing: 1 },
  section: {
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
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.md,
    ...Shadows.default,
  },
  settingInfo: { flex: 1, gap: Spacing.xs },
  settingTitle: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  settingDesc: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
    lineHeight: Typography.xs * 1.5,
  },
  upgradeCard: {
    margin: Spacing.base,
    backgroundColor: Colors.ink,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.base,
    gap: Spacing.md,
    ...Shadows.accent,
  },
  upgradeTitle: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.accentGreen,
    letterSpacing: 2,
  },
  upgradeDesc: { fontSize: Typography.small, color: Colors.bgCard, lineHeight: Typography.small * 1.5 },
  featureList: { gap: Spacing.xs },
  featureItem: { fontSize: Typography.small, color: Colors.bgCard, fontWeight: Typography.medium },
  dangerRow: {
    backgroundColor: Colors.error,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    padding: Spacing.md,
    alignItems: 'center',
    ...Shadows.accent,
  },
  dangerText: {
    fontSize: Typography.small,
    fontWeight: Typography.black,
    color: Colors.bgCard,
    letterSpacing: 2,
  },
  guestActions: { gap: Spacing.md },
  guestNote: { fontSize: Typography.small, color: Colors.inkMuted, lineHeight: Typography.small * 1.5 },
  appInfo: {
    padding: Spacing.base,
    paddingTop: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  appInfoText: { fontSize: Typography.xs, color: Colors.inkMuted, fontWeight: Typography.medium, letterSpacing: 0.5 },
});
