import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../constants/theme';
import { PlatformMeta } from '../../constants/theme';

interface PlatformBadgeProps {
  platform: keyof typeof PlatformMeta;
  size?: 'sm' | 'md';
}

export const PlatformBadge: React.FC<PlatformBadgeProps> = ({ platform, size = 'md' }) => {
  const meta = PlatformMeta[platform] ?? PlatformMeta.unknown;
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: meta.bgColor,
          paddingHorizontal: isSmall ? Spacing.sm : Spacing.md,
          paddingVertical: isSmall ? 3 : Spacing.xs,
        },
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: meta.color,
            fontSize: isSmall ? Typography.xs : Typography.label,
          },
        ]}
      >
        {meta.label.toUpperCase()}
      </Text>
    </View>
  );
};

// Trust score display with color-coded label
interface TrustBadgeProps {
  score: number;
}

export const TrustBadge: React.FC<TrustBadgeProps> = ({ score }) => {
  const getConfig = () => {
    if (score >= 80) return { label: 'HIGH TRUST', color: Colors.accentGreen, textColor: Colors.ink };
    if (score >= 60) return { label: 'TRUSTED', color: Colors.success, textColor: Colors.bgCard };
    if (score >= 40) return { label: 'MODERATE', color: Colors.warning, textColor: Colors.ink };
    if (score >= 20) return { label: 'LOW TRUST', color: Colors.accentRed, textColor: Colors.bgCard };
    return { label: 'RISKY', color: Colors.error, textColor: Colors.bgCard };
  };

  const { label, color, textColor } = getConfig();

  return (
    <View style={[styles.trustBadge, { backgroundColor: color }]}>
      <Text style={[styles.trustScore, { color: textColor }]}>{score}</Text>
      <Text style={[styles.trustLabel, { color: textColor }]}>{label}</Text>
    </View>
  );
};

// Savings badge (green, shows $ saved)
interface SavingsBadgeProps {
  amount: number;
  percent?: number;
}

export const SavingsBadge: React.FC<SavingsBadgeProps> = ({ amount, percent }) => {
  if (amount <= 0) return null;

  return (
    <View style={styles.savingsBadge}>
      <Text style={styles.savingsText}>
        SAVE ${amount.toFixed(2)}{percent ? ` (${percent}%)` : ''}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: Typography.bold,
    letterSpacing: Typography.letterSpacingLabel,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    gap: Spacing.xs,
  },
  trustScore: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    letterSpacing: 0,
  },
  trustLabel: {
    fontSize: 9,
    fontWeight: Typography.bold,
    letterSpacing: 1.5,
  },
  savingsBadge: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  savingsText: {
    color: Colors.ink,
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    letterSpacing: 1,
  },
});
