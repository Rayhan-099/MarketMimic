import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR, toPaise } from '../../domain/money/money.js';
import type { DeliveryHolding } from '../../domain/portfolio/types.js';
import type { Instrument, Quote } from '../../domain/orders/types.js';
import { DirectionalPill } from '../finance/DirectionalPill.js';

export interface HoldingRowProps {
  readonly holding: DeliveryHolding;
  readonly instrument: Instrument | null;
  readonly quote: Quote | null;
  readonly onPress: () => void;
}

export function HoldingRow({
  holding,
  instrument,
  quote,
  onPress,
}: HoldingRowProps): React.JSX.Element {
  const { colors, spacing, typography } = useTheme();

  const ltp = quote ? quote.ltpPaise : holding.averageCostPaise;
  const currentValuePaise = toPaise(holding.quantity * ltp);
  const unrealisedPnlPaise = toPaise(currentValuePaise - holding.totalInvestedPaise);

  const returnBps =
    holding.totalInvestedPaise > 0
      ? Math.round((unrealisedPnlPaise / holding.totalInvestedPaise) * 10000)
      : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? colors.bgSurfaceElevated : colors.bgSurface,
          borderBottomColor: colors.borderSubtle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${instrument?.symbol ?? holding.instrumentId}, ${holding.quantity} shares, Current value ${formatINR(currentValuePaise)}`}
    >
      <View style={styles.leftCol}>
        <Text style={[styles.symbolText, { color: colors.textPrimary, ...typography.bodyBold }]}>
          {instrument?.symbol ?? holding.instrumentId}
        </Text>
        <Text style={[styles.sharesText, { color: colors.textSecondary, ...typography.captionRegular, marginTop: 2 }]}>
          {holding.quantity} Shares • Avg: {formatINR(holding.averageCostPaise)}
        </Text>
      </View>

      <View style={styles.rightCol}>
        <Text style={[styles.currentValText, { color: colors.textPrimary, ...typography.bodyBold }]}>
          {formatINR(currentValuePaise)}
        </Text>
        <View style={{ marginTop: 4 }}>
          <DirectionalPill amountPaise={unrealisedPnlPaise} percentageBps={returnBps} />
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
    minHeight: 68,
    borderBottomWidth: 1,
  },
  leftCol: {
    flex: 1,
    marginRight: 12,
  },
  symbolText: {
    letterSpacing: 0.2,
  },
  sharesText: {},
  rightCol: {
    alignItems: 'flex-end',
  },
  currentValText: {
    letterSpacing: -0.2,
  },
});
