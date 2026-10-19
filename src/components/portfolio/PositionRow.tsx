import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR, toPaise } from '../../domain/money/money.js';
import type { IntradayPosition } from '../../domain/portfolio/types.js';
import type { Instrument, Quote } from '../../domain/orders/types.js';
import { DirectionalPill } from '../finance/DirectionalPill.js';

export interface PositionRowProps {
  readonly position: IntradayPosition;
  readonly instrument: Instrument | null;
  readonly quote: Quote | null;
  readonly onSquareOff?: ((positionId: string) => void) | undefined;
  readonly onPress?: (() => void) | undefined;
}

export function PositionRow({
  position,
  instrument,
  quote,
  onSquareOff,
  onPress,
}: PositionRowProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const isOpen = position.status === 'OPEN' && position.quantity > 0;
  const ltp = quote ? quote.ltpPaise : position.averageEntryPricePaise;
  const currentValPaise = toPaise(position.quantity * ltp);
  const pnlPaise = isOpen
    ? toPaise(currentValPaise - position.totalEntryCostPaise)
    : position.realisedPnlPaise;

  const returnBps =
    position.totalEntryCostPaise > 0
      ? Math.round((pnlPaise / position.totalEntryCostPaise) * 10000)
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
      accessibilityLabel={`Intraday position for ${instrument?.symbol ?? position.instrumentId}, status ${position.status}`}
    >
      <View style={styles.topRow}>
        <View style={styles.leftCol}>
          <View style={styles.symbolRow}>
            <Text style={[styles.symbolText, { color: colors.textPrimary, ...typography.bodyBold }]}>
              {instrument?.symbol ?? position.instrumentId}
            </Text>
            <View style={[styles.productBadge, { backgroundColor: colors.bgCanvas, borderRadius: radius.xs }]}>
              <Text style={[styles.productText, { color: colors.textTertiary, ...typography.microBadge }]}>
                MIS
              </Text>
            </View>
          </View>
          <Text style={[styles.entryText, { color: colors.textSecondary, ...typography.captionRegular, marginTop: 2 }]}>
            {position.quantity} Qty • Entry: {formatINR(position.averageEntryPricePaise)}
          </Text>
        </View>

        <View style={styles.rightCol}>
          <DirectionalPill amountPaise={pnlPaise} percentageBps={returnBps} />
          {isOpen && onSquareOff && (
            <Pressable
              onPress={() => onSquareOff(position.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={[styles.squareOffBtn, { borderColor: colors.negative, borderRadius: radius.sm, marginTop: 6 }]}
              accessibilityRole="button"
              accessibilityLabel={`Square off ${instrument?.symbol ?? position.instrumentId}`}
            >
              <Text style={[styles.squareOffText, { color: colors.negative, ...typography.captionRegular, fontWeight: '700' }]}>
                Square Off
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 74,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  productBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  productText: {
    fontWeight: '700',
  },
  entryText: {},
  rightCol: {
    alignItems: 'flex-end',
  },
  squareOffBtn: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  squareOffText: {
    fontSize: 11,
  },
});
