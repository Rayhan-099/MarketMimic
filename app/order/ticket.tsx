import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import {
  useMarketData,
  useAccount,
  useOrders,
} from '../../src/services/AppContext.js';
import { formatINR, toPaise, toShares } from '../../src/domain/money/money.js';
import type { OrderSide, OrderProduct, OrderType } from '../../src/domain/orders/types.js';
import type { OrderRequest } from '../../src/services/app-service.js';
import { ChargesBreakdownModal } from '../../src/components/order/ChargesBreakdownModal.js';
import { Icon } from '../../src/components/common/Icon.js';

export default function OrderTicketScreen(): React.JSX.Element {
  const router = useRouter();
  const { symbol, side: initialSide } = useLocalSearchParams<{
    symbol: string;
    side?: string;
  }>();
  const { colors, spacing, radius, typography } = useTheme();
  const { getInstrument, getQuote } = useMarketData();
  const { accountId, availableCash } = useAccount();
  const { validateOrder: runValidation, placeOrder } = useOrders();

  const instrument = useMemo(() => {
    return symbol ? getInstrument(symbol) : null;
  }, [symbol, getInstrument]);

  const quote = useMemo(() => {
    return instrument ? getQuote(instrument.id) : null;
  }, [instrument, getQuote]);

  const [side, setSide] = useState<OrderSide>(
    initialSide === 'SELL' ? 'SELL' : 'BUY',
  );
  const [product, setProduct] = useState<OrderProduct>('DELIVERY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState<number>(1);
  const [limitPriceText, setLimitPriceText] = useState<string>(
    quote ? (quote.ltpPaise / 100).toFixed(2) : '100.00',
  );
  const [showChargesModal, setShowChargesModal] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Parse limit price
  const parsedLimitPricePaise = useMemo(() => {
    const parsed = parseFloat(limitPriceText);
    if (isNaN(parsed) || parsed <= 0) return undefined;
    return toPaise(Math.round(parsed * 100));
  }, [limitPriceText]);

  // Pre-trade validation evaluation
  const validation = useMemo(() => {
    if (!instrument || !quote || quantity <= 0) return null;

    const request: OrderRequest = {
      accountId,
      instrumentId: instrument.id,
      side,
      product,
      orderType,
      quantity: toShares(Math.max(quantity, 1)),
      limitPricePaise: orderType === 'LIMIT' ? parsedLimitPricePaise : undefined,
      idempotencyKey: 'validation_check',
    };

    return runValidation(request);
  }, [
    instrument,
    quote,
    accountId,
    side,
    product,
    orderType,
    quantity,
    parsedLimitPricePaise,
    runValidation,
  ]);

  if (!instrument || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.textPrimary, ...typography.headline2 }}>
            Invalid instrument request
          </Text>
          <Pressable onPress={() => router.back()} style={{ marginTop: 12 }}>
            <Text style={{ color: colors.brandPrimary, ...typography.bodyBold }}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isBuy = side === 'BUY';
  const sideColor = isBuy ? colors.positive : colors.negative;

  const handleStepQuantity = (delta: number): void => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSubmitOrder = (): void => {
    if (!validation || !validation.valid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const idempotencyKey = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const request: OrderRequest = {
        accountId,
        instrumentId: instrument.id,
        side,
        product,
        orderType,
        quantity: toShares(quantity),
        limitPricePaise: orderType === 'LIMIT' ? parsedLimitPricePaise : undefined,
        idempotencyKey,
      };

      const result = placeOrder(request);

      router.replace({
        pathname: '/order/confirm',
        params: {
          orderId: result.order.id,
          symbol: instrument.symbol,
          displayName: instrument.displayName,
          exchange: instrument.exchange,
          side,
          product,
          orderType,
          quantity: quantity.toString(),
          status: result.order.status,
          price: (orderType === 'MARKET' ? quote.ltpPaise : (parsedLimitPricePaise ?? quote.ltpPaise)).toString(),
        },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top', 'bottom']}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View>
          <Text style={[styles.title, { color: sideColor, ...typography.headline1 }]}>
            {side} {instrument.symbol}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.captionRegular }]}>
            {instrument.exchange} • LTP: {formatINR(quote.ltpPaise)}
          </Text>
        </View>

        <Pressable
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.closeBtn}
          accessibilityRole="button"
          accessibilityLabel="Close ticket"
        >
          <Icon name="close" size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 110 }}>
        {/* 2. Side Toggle Pill */}
        <View style={[styles.segmentContainer, { backgroundColor: colors.bgSurface, borderRadius: radius.full, padding: 3 }]}>
          <Pressable
            onPress={() => setSide('BUY')}
            style={[styles.segmentBtn, side === 'BUY' && { backgroundColor: colors.positive, borderRadius: radius.full }]}
          >
            <Text style={[styles.segmentText, { color: side === 'BUY' ? '#FFFFFF' : colors.textSecondary, ...typography.captionMono, fontWeight: '700' }]}>
              BUY
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSide('SELL')}
            style={[styles.segmentBtn, side === 'SELL' && { backgroundColor: colors.negative, borderRadius: radius.full }]}
          >
            <Text style={[styles.segmentText, { color: side === 'SELL' ? '#FFFFFF' : colors.textSecondary, ...typography.captionMono, fontWeight: '700' }]}>
              SELL
            </Text>
          </Pressable>
        </View>

        {/* 3. Product Type (Delivery CNC vs Intraday MIS) */}
        <View style={{ marginTop: spacing.md }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.xs }]}>
            PRODUCT TYPE
          </Text>
          <View style={[styles.segmentContainer, { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: 4 }]}>
            <Pressable
              onPress={() => setProduct('DELIVERY')}
              style={[styles.segmentBtn, product === 'DELIVERY' && { backgroundColor: colors.brandPrimary, borderRadius: radius.sm }]}
            >
              <Text style={[styles.segmentText, { color: product === 'DELIVERY' ? '#FFFFFF' : colors.textSecondary, ...typography.captionRegular, fontWeight: '600' }]}>
                Delivery (CNC)
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setProduct('INTRADAY')}
              style={[styles.segmentBtn, product === 'INTRADAY' && { backgroundColor: colors.brandPrimary, borderRadius: radius.sm }]}
            >
              <Text style={[styles.segmentText, { color: product === 'INTRADAY' ? '#FFFFFF' : colors.textSecondary, ...typography.captionRegular, fontWeight: '600' }]}>
                Intraday (MIS)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 4. Order Type (Market vs Limit) */}
        <View style={{ marginTop: spacing.md }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.xs }]}>
            ORDER TYPE
          </Text>
          <View style={[styles.segmentContainer, { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: 4 }]}>
            <Pressable
              onPress={() => setOrderType('MARKET')}
              style={[styles.segmentBtn, orderType === 'MARKET' && { backgroundColor: colors.brandPrimary, borderRadius: radius.sm }]}
            >
              <Text style={[styles.segmentText, { color: orderType === 'MARKET' ? '#FFFFFF' : colors.textSecondary, ...typography.captionRegular, fontWeight: '600' }]}>
                Market
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setOrderType('LIMIT')}
              style={[styles.segmentBtn, orderType === 'LIMIT' && { backgroundColor: colors.brandPrimary, borderRadius: radius.sm }]}
            >
              <Text style={[styles.segmentText, { color: orderType === 'LIMIT' ? '#FFFFFF' : colors.textSecondary, ...typography.captionRegular, fontWeight: '600' }]}>
                Limit
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 5. Quantity Stepper */}
        <View style={{ marginTop: spacing.lg }}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.xs }]}>
            QUANTITY (SHARES)
          </Text>
          <View style={[styles.inputRow, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
            <Pressable
              onPress={() => handleStepQuantity(-1)}
              style={styles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Decrease quantity"
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>−</Text>
            </Pressable>

            <TextInput
              value={quantity.toString()}
              onChangeText={(txt) => {
                const num = parseInt(txt, 10);
                setQuantity(isNaN(num) ? 0 : Math.max(0, num));
              }}
              keyboardType="number-pad"
              style={[styles.qtyInput, { color: colors.textPrimary, ...typography.headline1 }]}
            />

            <Pressable
              onPress={() => handleStepQuantity(1)}
              style={styles.stepBtn}
              accessibilityRole="button"
              accessibilityLabel="Increase quantity"
            >
              <Text style={[styles.stepBtnText, { color: colors.textPrimary }]}>+</Text>
            </Pressable>
          </View>

          {/* Quick Quantity Chips */}
          <View style={[styles.chipsRow, { marginTop: spacing.xs }]}>
            {[10, 25, 50, 100].map((inc) => (
              <Pressable
                key={inc}
                onPress={() => setQuantity(inc)}
                style={[styles.chip, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.full }]}
              >
                <Text style={[styles.chipText, { color: colors.textSecondary, ...typography.captionMono }]}>
                  {inc}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 6. Limit Price Input (only when orderType === 'LIMIT') */}
        {orderType === 'LIMIT' && (
          <View style={{ marginTop: spacing.lg }}>
            <Text style={[styles.sectionLabel, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.xs }]}>
              LIMIT PRICE (₹)
            </Text>
            <View style={[styles.inputRow, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md, paddingHorizontal: spacing.md }]}>
              <Text style={[styles.currencyPrefix, { color: colors.textSecondary, ...typography.headline2 }]}>
                ₹
              </Text>
              <TextInput
                value={limitPriceText}
                onChangeText={setLimitPriceText}
                keyboardType="decimal-pad"
                style={[styles.priceInput, { color: colors.textPrimary, ...typography.headline2 }]}
              />
            </View>
          </View>
        )}

        {/* 7. Summary & Validation Box */}
        <View style={[styles.summaryCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary, ...typography.captionRegular }]}>
              Approx. Order Value
            </Text>
            <Text style={[styles.summaryVal, { color: colors.textPrimary, ...typography.bodyBold }]}>
              {validation?.valid ? formatINR(validation.grossValuePaise) : '—'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Pressable
              onPress={() => setShowChargesModal(true)}
              style={styles.chargesTrigger}
              accessibilityRole="button"
              accessibilityLabel="View statutory charges details"
            >
              <Text style={[styles.chargesLabel, { color: colors.brandPrimary, ...typography.captionRegular, textDecorationLine: 'underline' }]}>
                Estimated Charges (i)
              </Text>
            </Pressable>
            <Text style={[styles.summaryVal, { color: colors.textSecondary, ...typography.captionMono }]}>
              {validation?.valid ? formatINR(validation.estimatedCosts.totalChargesPaise) : '—'}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textPrimary, ...typography.bodyBold }]}>
              Total Margin Required
            </Text>
            <Text style={[styles.summaryVal, { color: colors.textPrimary, ...typography.bodyBold }]}>
              {validation?.valid ? formatINR(validation.requiredMarginPaise) : '—'}
            </Text>
          </View>

          <View style={[styles.summaryRow, { borderTopColor: colors.borderSubtle, borderTopWidth: 1, paddingTop: 8, marginTop: 4 }]}>
            <Text style={[styles.summaryLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
              Available Virtual Cash
            </Text>
            <Text style={[styles.summaryVal, { color: colors.positive, ...typography.captionMono, fontWeight: '700' }]}>
              {formatINR(availableCash)}
            </Text>
          </View>
        </View>

        {/* Validation Failure Warning Banner */}
        {validation && !validation.valid && (
          <View style={[styles.alertBanner, { backgroundColor: colors.negativeBg, borderColor: colors.negative, borderRadius: radius.sm, padding: spacing.md, marginTop: spacing.md }]}>
            <Text style={[styles.alertText, { color: colors.negative, ...typography.captionRegular, fontWeight: '600' }]}>
              ⚠ {validation.message}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 8. Fixed Submit Button */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bgSurface, borderTopColor: colors.borderSubtle, padding: spacing.md }]}>
        <Pressable
          onPress={handleSubmitOrder}
          disabled={!validation?.valid || isSubmitting}
          style={[
            styles.submitBtn,
            {
              backgroundColor: sideColor,
              borderRadius: radius.md,
              opacity: validation?.valid && !isSubmitting ? 1 : 0.45,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Confirm ${side} order`}
        >
          <Text style={[styles.submitText, { color: '#FFFFFF', ...typography.bodyBold }]}>
            CONFIRM {side} ORDER
          </Text>
        </Pressable>
      </View>

      {/* Charges Breakdown Modal */}
      <ChargesBreakdownModal
        visible={showChargesModal}
        charges={validation?.valid ? validation.estimatedCosts : null}
        onClose={() => setShowChargesModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  title: {},
  subtitle: {
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  segmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {},
  sectionLabel: {
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 52,
  },
  stepBtn: {
    width: 52,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtnText: {
    fontSize: 22,
    fontWeight: '600',
  },
  qtyInput: {
    flex: 1,
    textAlign: 'center',
    height: '100%',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {},
  currencyPrefix: {
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    height: '100%',
  },
  summaryCard: {
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {},
  summaryVal: {},
  chargesTrigger: {},
  chargesLabel: {},
  alertBanner: {
    borderWidth: 1,
  },
  alertText: {},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  submitBtn: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    letterSpacing: 0.5,
  },
});
