import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR, toPaise } from '../../domain/money/money.js';
import type { Order, Instrument, Quote } from '../../domain/orders/types.js';

export interface OrderListItemProps {
  readonly order: Order;
  readonly instrument: Instrument | null;
  readonly quote: Quote | null;
  readonly onCancel?: ((orderId: Order['id']) => void) | undefined;
  readonly onPress?: (() => void) | undefined;
}

export function OrderListItem({
  order,
  instrument,
  quote,
  onCancel,
  onPress,
}: OrderListItemProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const isBuy = order.side === 'BUY';
  const sideColor = isBuy ? colors.positive : colors.negative;
  const isFilled = order.status === 'FILLED';
  const isOpen = order.status === 'OPEN';

  const statusBg = React.useMemo(() => {
    switch (order.status) {
      case 'FILLED':
        return colors.positiveBg;
      case 'OPEN':
        return colors.badgeDelayedBg;
      case 'CANCELLED':
        return colors.neutralBg;
      case 'REJECTED':
      default:
        return colors.negativeBg;
    }
  }, [order.status, colors]);

  const statusText = React.useMemo(() => {
    switch (order.status) {
      case 'FILLED':
        return colors.positive;
      case 'OPEN':
        return colors.badgeDelayedText;
      case 'CANCELLED':
        return colors.textTertiary;
      case 'REJECTED':
      default:
        return colors.negative;
    }
  }, [order.status, colors]);

  const displayPricePaise = order.limitPricePaise ?? (quote ? quote.ltpPaise : toPaise(0));
  const orderDate = new Date(order.updatedAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: pressed ? colors.bgSurfaceElevated : colors.bgSurface,
          borderBottomColor: colors.borderSubtle,
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${order.side} ${order.quantity} shares of ${instrument?.symbol ?? order.instrumentId}, status ${order.status}`}
    >
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <View style={[styles.sideBadge, { backgroundColor: isBuy ? colors.positiveBg : colors.negativeBg, borderRadius: radius.xs }]}>
            <Text style={[styles.sideText, { color: sideColor, ...typography.microBadge }]}>
              {order.side}
            </Text>
          </View>
          <Text style={[styles.symbolText, { color: colors.textPrimary, ...typography.bodyBold, marginLeft: 8 }]}>
            {instrument?.symbol ?? order.instrumentId}
          </Text>
          <Text style={[styles.exchangeText, { color: colors.textTertiary, ...typography.microBadge, marginLeft: 6 }]}>
            {order.product === 'DELIVERY' ? 'CNC' : 'MIS'}
          </Text>
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusBg, borderRadius: radius.xs }]}>
          <Text style={[styles.statusText, { color: statusText, ...typography.microBadge }]}>
            {order.status}
          </Text>
        </View>
      </View>

      <View style={[styles.bottomRow, { marginTop: spacing.xs }]}>
        <View style={styles.qtyCol}>
          <Text style={[styles.qtyText, { color: colors.textSecondary, ...typography.captionRegular }]}>
            {order.quantity} Shares @ {formatINR(displayPricePaise)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textTertiary, ...typography.microBadge, marginTop: 2 }]}>
            {order.orderType} • {orderDate}
          </Text>
        </View>

        {isOpen && onCancel && (
          <Pressable
            onPress={() => onCancel(order.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={[styles.cancelBtn, { borderColor: colors.negative, borderRadius: radius.sm }]}
            accessibilityRole="button"
            accessibilityLabel={`Cancel order for ${instrument?.symbol ?? order.instrumentId}`}
          >
            <Text style={[styles.cancelBtnText, { color: colors.negative, ...typography.captionRegular, fontWeight: '700' }]}>
              Cancel
            </Text>
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    borderBottomWidth: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sideText: {
    fontWeight: '700',
  },
  symbolText: {
    letterSpacing: 0.2,
  },
  exchangeText: {
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  statusText: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyCol: {},
  qtyText: {},
  timeText: {},
  cancelBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  cancelBtnText: {},
});
