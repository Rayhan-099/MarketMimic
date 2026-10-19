import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR } from '../../domain/money/money.js';
import type { Instrument, Quote } from '../../domain/orders/types.js';

interface KeyStatsGridProps {
  readonly instrument: Instrument;
  readonly quote: Quote;
}

export function KeyStatsGrid({ instrument, quote }: KeyStatsGridProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const stats = [
    { label: 'Prev. Close', value: formatINR(quote.closePricePaise) },
    { label: 'LTP', value: formatINR(quote.ltpPaise) },
    { label: 'Tick Size', value: `₹${(instrument.tickSizePaise / 100).toFixed(2)}` },
    { label: 'Lot Size', value: `${instrument.lotSize} Share` },
    { label: 'Exchange', value: instrument.exchange },
    { label: 'Type', value: instrument.instrumentType },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md }]}>
      <Text style={[styles.heading, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.sm }]}>
        KEY STATISTICS
      </Text>
      <View style={styles.grid}>
        {stats.map((stat, idx) => (
          <View key={idx} style={[styles.gridItem, { borderColor: colors.borderSubtle }]}>
            <Text style={[styles.label, { color: colors.textTertiary, ...typography.captionRegular }]}>
              {stat.label}
            </Text>
            <Text style={[styles.value, { color: colors.textPrimary, ...typography.bodyBold, marginTop: 2 }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  heading: {
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: '50%',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 12,
  },
  value: {
    letterSpacing: -0.2,
  },
});
