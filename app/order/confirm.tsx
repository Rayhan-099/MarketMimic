import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import { formatINR, toPaise } from '../../src/domain/money/money.js';
import { Icon } from '../../src/components/common/Icon.js';
import { Divider } from '../../src/components/common/Divider.js';

export default function OrderConfirmScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const {
    orderId,
    symbol,
    displayName,
    exchange,
    side,
    product,
    orderType,
    quantity,
    status,
    price,
  } = useLocalSearchParams<{
    orderId: string;
    symbol: string;
    displayName: string;
    exchange: string;
    side: string;
    product: string;
    orderType: string;
    quantity: string;
    status: string;
    price: string;
  }>();

  const isFilled = status === 'FILLED';
  const pricePaise = price ? toPaise(parseInt(price, 10)) : toPaise(0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top', 'bottom']}>
      <View style={[styles.content, { padding: spacing.xl }]}>
        {/* 1. Status Icon */}
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isFilled ? colors.positiveBg : colors.badgeDelayedBg,
              borderColor: isFilled ? colors.positive : colors.badgeDelayedText,
              borderRadius: radius.full,
            },
          ]}
        >
          <Icon
            name={isFilled ? 'check' : 'orders'}
            size={40}
            color={isFilled ? colors.positive : colors.badgeDelayedText}
          />
        </View>

        {/* 2. Headline */}
        <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline1, marginTop: spacing.lg }]}>
          {isFilled ? 'Order Executed Successfully!' : 'Limit Order Placed!'}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.bodyRegular, marginTop: spacing.xs }]}>
          {isFilled
            ? 'Your simulated trade has been filled against prevailing quotes.'
            : 'Your limit order is open on the virtual order book awaiting match.'}
        </Text>

        {/* 3. Detail Receipt Card */}
        <View style={[styles.receiptCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.lg, padding: spacing.lg, marginTop: spacing.xl }]}>
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
              Order ID
            </Text>
            <Text style={[styles.receiptValue, { color: colors.textPrimary, ...typography.captionMono }]}>
              {orderId}
            </Text>
          </View>

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
              Instrument
            </Text>
            <Text style={[styles.receiptValue, { color: colors.textPrimary, ...typography.bodyBold }]}>
              {symbol} ({exchange})
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
              Trade Details
            </Text>
            <Text style={[styles.receiptValue, { color: side === 'BUY' ? colors.positive : colors.negative, ...typography.bodyBold }]}>
              {side} • {product} • {orderType}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
              Quantity & Price
            </Text>
            <Text style={[styles.receiptValue, { color: colors.textPrimary, ...typography.bodyBold }]}>
              {quantity} Shares @ {formatINR(pricePaise)}
            </Text>
          </View>

          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
              Execution Status
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: isFilled ? colors.positiveBg : colors.badgeDelayedBg, borderRadius: radius.xs }]}>
              <Text style={[styles.statusBadgeText, { color: isFilled ? colors.positive : colors.badgeDelayedText, ...typography.microBadge }]}>
                {status}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. Educational Disclaimer */}
        <View style={[styles.disclaimerBox, { backgroundColor: colors.bgSurfaceElevated, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
          <Text style={[styles.disclaimerText, { color: colors.textTertiary, ...typography.captionRegular }]}>
            ℹ Simulated Paper Trade. Executed with virtual capital for educational practice. No real money or exchange settlement occurred.
          </Text>
        </View>

        {/* 5. Navigation Action Buttons */}
        <View style={[styles.actionsRow, { marginTop: spacing.xl }]}>
          <Pressable
            onPress={() => router.replace('/')}
            style={[styles.actionBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md, marginRight: spacing.sm }]}
            accessibilityRole="button"
            accessibilityLabel="Done"
          >
            <Text style={[styles.actionBtnText, { color: colors.textPrimary, ...typography.bodyBold }]}>
              Done
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.replace('/orders')}
            style={[styles.actionBtn, { backgroundColor: colors.brandPrimary, borderRadius: radius.md, marginLeft: spacing.sm }]}
            accessibilityRole="button"
            accessibilityLabel="View orders"
          >
            <Text style={[styles.actionBtnText, { color: '#FFFFFF', ...typography.bodyBold }]}>
              View Orders
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
  receiptCard: {
    width: '100%',
    borderWidth: 1,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  receiptLabel: {},
  receiptValue: {},
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  statusBadgeText: {
    fontWeight: '700',
  },
  disclaimerBox: {
    width: '100%',
  },
  disclaimerText: {
    lineHeight: 18,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  actionBtnText: {
    letterSpacing: 0.3,
  },
});
