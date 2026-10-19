import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR, toPaise } from '../../domain/money/money.js';
import type { Instrument, Quote } from '../../domain/orders/types.js';
import { DirectionalPill } from '../finance/DirectionalPill.js';

export interface WatchlistRowProps {
  readonly instrument: Instrument;
  readonly quote: Quote;
  readonly onPress: () => void;
}

export function WatchlistRow({
  instrument,
  quote,
  onPress,
}: WatchlistRowProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const changePaise = toPaise(quote.ltpPaise - quote.closePricePaise);
  const percentageBps =
    quote.closePricePaise > 0
      ? Math.round(((quote.ltpPaise - quote.closePricePaise) / quote.closePricePaise) * 10000)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${instrument.symbol}, ${instrument.displayName}, ${formatINR(quote.ltpPaise)}`}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.bgSurfaceElevated : colors.bgSurface,
          borderBottomColor: colors.borderSubtle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
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

      <View style={styles.rightCol}>
        <Text style={[styles.ltpText, { color: colors.textPrimary, ...typography.bodyBold }]}>
          {formatINR(quote.ltpPaise)}
        </Text>
        <View style={{ marginTop: 4 }}>
          <DirectionalPill amountPaise={changePaise} percentageBps={percentageBps} />
        </View>
      </View>
    </Pressable>
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
  leftCol: {
    flex: 1,
    marginRight: 12,
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
  rightCol: {
    alignItems: 'flex-end',
  },
  ltpText: {
    letterSpacing: -0.2,
  },
});
