import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR, toPaise } from '../../domain/money/money.js';
import type { Instrument, Quote } from '../../domain/orders/types.js';
import { DirectionalPill } from '../finance/DirectionalPill.js';
import { Icon } from '../common/Icon.js';

export interface SearchResultRowProps {
  readonly instrument: Instrument;
  readonly quote: Quote;
  readonly isBookmarked: boolean;
  readonly onToggleBookmark: () => void;
  readonly onPress: () => void;
}

export function SearchResultRow({
  instrument,
  quote,
  isBookmarked,
  onToggleBookmark,
  onPress,
}: SearchResultRowProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const changePaise = toPaise(quote.ltpPaise - quote.closePricePaise);
  const percentageBps =
    quote.closePricePaise > 0
      ? Math.round(((quote.ltpPaise - quote.closePricePaise) / quote.closePricePaise) * 10000)
      : 0;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.bgSurface,
          borderBottomColor: colors.borderSubtle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        style={styles.mainPressable}
        accessibilityRole="button"
        accessibilityLabel={`${instrument.symbol}, ${instrument.displayName}, ${formatINR(quote.ltpPaise)}`}
      >
        <View style={styles.leftCol}>
          <View style={styles.symbolRow}>
            <Text style={[styles.symbolText, { color: colors.textPrimary, ...typography.bodyBold }]}>
              {instrument.symbol}
            </Text>
            <View style={[styles.exchangeBadge, { backgroundColor: colors.bgCanvas, borderRadius: radius.xs }]}>
              <Text style={[styles.exchangeText, { color: colors.textTertiary, ...typography.microBadge }]}>
                {instrument.exchange}
              </Text>
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[styles.nameText, { color: colors.textSecondary, ...typography.captionRegular, marginTop: 2 }]}
          >
            {instrument.displayName}
          </Text>
        </View>

        <View style={styles.priceCol}>
          <Text style={[styles.ltpText, { color: colors.textPrimary, ...typography.bodyBold }]}>
            {formatINR(quote.ltpPaise)}
          </Text>
          <View style={{ marginTop: 4 }}>
            <DirectionalPill amountPaise={changePaise} percentageBps={percentageBps} />
          </View>
        </View>
      </Pressable>

      <Pressable
        onPress={onToggleBookmark}
        accessibilityRole="button"
        accessibilityLabel={isBookmarked ? `Remove ${instrument.symbol} from watchlist` : `Add ${instrument.symbol} to watchlist`}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        style={[
          styles.bookmarkButton,
          {
            backgroundColor: isBookmarked ? colors.positiveBg : colors.bgCanvas,
            borderColor: isBookmarked ? colors.positive : colors.borderSubtle,
            borderRadius: radius.sm,
          },
        ]}
      >
        <Icon
          name={isBookmarked ? 'bookmark-filled' : 'bookmark'}
          size={16}
          color={isBookmarked ? colors.positive : colors.textTertiary}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 64,
    borderBottomWidth: 1,
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginRight: 12,
  },
  leftCol: {
    flex: 1,
    marginRight: 8,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    letterSpacing: 0.2,
  },
  exchangeBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  exchangeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  nameText: {
    maxWidth: '90%',
  },
  priceCol: {
    alignItems: 'flex-end',
  },
  ltpText: {
    letterSpacing: -0.2,
  },
  bookmarkButton: {
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
