import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { Colors, Typography, Spacing, Borders, Shadows } from '../../constants/theme';
import { PlatformBadge, TrustBadge, SavingsBadge } from '../ui/Badges';

interface ListingCardProps {
  listing: {
    id: string;
    platform: string;
    title?: string;
    price: number;
    shippingCost: number;
    totalCost: number;
    currency: string;
    rating?: number;
    reviewCount?: number;
    trustScore: number;
    imageUrl?: string;
    productUrl: string;
    inStock: boolean;
    similarityScore: number;
  };
  originalPrice?: number;    // For calculating savings
  rank?: number;             // 1 = cheapest
  isOriginal?: boolean;
  onPress?: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  listing,
  originalPrice,
  rank,
  isOriginal,
  onPress,
}) => {
  const { width } = useWindowDimensions();
  // Responsive image size: small phones get 60, tablets 88, default 76
  const imageSize = width < 360 ? 60 : width >= 600 ? 88 : 76;

  const savings = originalPrice ? originalPrice - listing.totalCost : 0;
  const savingsPercent = originalPrice && savings > 0
    ? Math.round((savings / originalPrice) * 100)
    : 0;

  const isCheapest = rank === 1 && !isOriginal;

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => Linking.openURL(listing.productUrl))}
      activeOpacity={0.9}
      style={[styles.card, isCheapest && styles.cardCheapest]}
    >
      {/* Header row: platform badge + rank label */}
      <View style={styles.header}>
        <PlatformBadge platform={listing.platform as any} />
        {isCheapest && (
          <View style={styles.cheapestLabel}>
            <Text style={styles.cheapestText}>LOWEST PRICE</Text>
          </View>
        )}
        {isOriginal && (
          <View style={styles.originalLabel}>
            <Text style={styles.originalText}>YOUR PRODUCT</Text>
          </View>
        )}
      </View>

      {/* Main content */}
      <View style={styles.content}>
        {/* Product image */}
        {listing.imageUrl ? (
          <Image
            source={{ uri: listing.imageUrl }}
            style={[styles.productImage, { width: imageSize, height: imageSize }]}
            resizeMode="contain"
          />
        ) : (
          <View style={[styles.imagePlaceholder, { width: imageSize, height: imageSize }]}>
            <Text style={styles.imagePlaceholderText}>NO IMG</Text>
          </View>
        )}

        {/* Product info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {listing.title}
          </Text>

          {/* Price row */}
          <View style={styles.priceRow}>
            <Text
              style={[styles.price, isCheapest && styles.priceCheapest]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              ${listing.price.toFixed(2)}
            </Text>
            {listing.shippingCost > 0 && (
              <Text style={styles.shipping} numberOfLines={1}>
                +${listing.shippingCost.toFixed(2)} ship
              </Text>
            )}
            {listing.shippingCost === 0 && (
              <Text style={styles.freeShip}>FREE SHIP</Text>
            )}
          </View>

          {/* Total cost */}
          <Text style={styles.totalCost}>
            Total: ${listing.totalCost.toFixed(2)}
          </Text>

          {/* Ratings */}
          {listing.rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.stars}>
                {'★'.repeat(Math.round(listing.rating))}{'☆'.repeat(5 - Math.round(listing.rating))}
              </Text>
              {listing.reviewCount && (
                <Text style={styles.reviewCount}>
                  ({listing.reviewCount.toLocaleString()})
                </Text>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Footer: trust + savings badges */}
      <View style={styles.footer}>
        <TrustBadge score={listing.trustScore} />
        {savings > 0 && (
          <SavingsBadge amount={savings} percent={savingsPercent} />
        )}
        {!listing.inStock && (
          <View style={styles.outOfStock}>
            <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
          </View>
        )}
      </View>

      {/* Similarity score indicator */}
      <View style={styles.matchBar}>
        <View
          style={[
            styles.matchFill,
            { width: `${Math.round(listing.similarityScore * 100)}%` },
          ]}
        />
        <Text style={styles.matchText}>
          {Math.round(listing.similarityScore * 100)}% MATCH
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.bgCard,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.default,
  },
  cardCheapest: {
    borderColor: Colors.accentGreen,
    borderWidth: 3,
    ...Shadows.cyan,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  cheapestLabel: {
    backgroundColor: Colors.accentGreen,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  cheapestText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  originalLabel: {
    backgroundColor: Colors.accentCyan,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  originalText: {
    fontSize: Typography.xs,
    fontWeight: Typography.black,
    color: Colors.ink,
    letterSpacing: 1,
  },
  content: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  productImage: {
    width: 76,   // overridden inline per device
    height: 76,
    aspectRatio: 1,
    borderWidth: Borders.width,
    borderColor: Colors.inkLight,
    flexShrink: 0,
  },
  imagePlaceholder: {
    width: 76,   // overridden inline per device
    height: 76,
    aspectRatio: 1,
    backgroundColor: Colors.overlayLight,
    borderWidth: Borders.width,
    borderColor: Colors.inkLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  imagePlaceholderText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
  },
  info: {
    flex: 1,
    flexShrink: 1,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.small,
    fontWeight: Typography.semibold,
    color: Colors.ink,
    lineHeight: Typography.small * Typography.lineHeightNormal,
  },
  priceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  price: {
    fontSize: Typography.h3,
    fontWeight: Typography.black,
    color: Colors.ink,
  },
  priceCheapest: {
    color: Colors.accentRed,
  },
  shipping: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
    fontWeight: Typography.medium,
  },
  freeShip: {
    fontSize: Typography.xs,
    color: Colors.success,
    fontWeight: Typography.bold,
    letterSpacing: 0.5,
  },
  totalCost: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
    fontWeight: Typography.medium,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  stars: {
    fontSize: Typography.small,
    color: Colors.amazon, // Gold color
  },
  reviewCount: {
    fontSize: Typography.xs,
    color: Colors.inkMuted,
  },
  footer: {
    flexDirection: 'row',
    padding: Spacing.md,
    paddingTop: 0,
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  outOfStock: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderWidth: Borders.width,
    borderColor: Colors.ink,
  },
  outOfStockText: {
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
    color: Colors.bgCard,
    letterSpacing: 1,
  },
  matchBar: {
    height: 4,
    backgroundColor: Colors.overlayLight,
    position: 'relative',
  },
  matchFill: {
    height: '100%',
    backgroundColor: Colors.accentCyan,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  matchText: {
    position: 'absolute',
    right: Spacing.sm,
    top: -14,
    fontSize: 9,
    fontWeight: Typography.bold,
    color: Colors.inkMuted,
    letterSpacing: 1,
  },
});
