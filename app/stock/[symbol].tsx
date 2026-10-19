import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import {
  useMarketData,
  useWatchlist,
  usePortfolio,
  useApp,
} from '../../src/services/AppContext.js';
import { formatINR, toPaise } from '../../src/domain/money/money.js';
import { DirectionalPill } from '../../src/components/finance/DirectionalPill.js';
import {
  TimeframeSelector,
  type Timeframe,
} from '../../src/components/chart/TimeframeSelector.js';
import {
  SimplePriceChart,
  type PricePoint,
} from '../../src/components/chart/SimplePriceChart.js';
import { KeyStatsGrid } from '../../src/components/stock/KeyStatsGrid.js';
import { Icon } from '../../src/components/common/Icon.js';
import { EmptyState } from '../../src/components/common/EmptyState.js';

export default function StockDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { symbol } = useLocalSearchParams<{ symbol: string }>();
  const { colors, spacing, radius, typography } = useTheme();
  const { getInstrument, getQuote } = useMarketData();
  const { activeWatchlistItems, toggleWatchlistItem } = useWatchlist();
  const { holdings } = usePortfolio();
  const { dataMode } = useApp();

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>('1D');

  const instrument = useMemo(() => {
    return symbol ? getInstrument(symbol) : null;
  }, [symbol, getInstrument]);

  const quote = useMemo(() => {
    return instrument ? getQuote(instrument.id) : null;
  }, [instrument, getQuote]);

  const isBookmarked = useMemo(() => {
    if (!instrument) return false;
    return activeWatchlistItems.some((item) => item.instrument.id === instrument.id);
  }, [instrument, activeWatchlistItems]);

  const holding = useMemo(() => {
    if (!instrument) return null;
    return holdings.find((h) => h.instrumentId === instrument.id);
  }, [instrument, holdings]);

  // Synthetic price points simulating timeframe trends for chart rendering
  const chartPoints: PricePoint[] = useMemo(() => {
    if (!quote) return [];
    const base = quote.closePricePaise;
    const ltp = quote.ltpPaise;
    const diff = ltp - base;

    const pointsCount = 12;
    const points: PricePoint[] = [];

    for (let i = 0; i < pointsCount; i++) {
      const progress = i / (pointsCount - 1);
      // Introduce slight deterministic variation
      const wave = Math.sin(progress * Math.PI * 2) * (diff * 0.3);
      const price = toPaise(Math.round(base + diff * progress + wave));
      points.push({
        timestamp: `pt_${i}`,
        pricePaise: price,
      });
    }

    return points;
  }, [quote]);

  if (!instrument || !quote) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]}>
        <View style={styles.notFoundWrapper}>
          <EmptyState
            title="Instrument Not Found"
            message={`No equity with symbol "${symbol}" was found in the local master.`}
            actionLabel="Return to Watchlist"
            onAction={() => router.back()}
          />
        </View>
      </SafeAreaView>
    );
  }

  const changePaise = toPaise(quote.ltpPaise - quote.closePricePaise);
  const percentageBps =
    quote.closePricePaise > 0
      ? Math.round(((quote.ltpPaise - quote.closePricePaise) / quote.closePricePaise) * 10000)
      : 0;

  const dayHigh = toPaise(Math.max(quote.ltpPaise, quote.closePricePaise) + 1500);
  const dayLow = toPaise(Math.min(quote.ltpPaise, quote.closePricePaise) - 1500);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top', 'bottom']}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View style={styles.headerLeft}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Icon name="chevron-left" size={24} color={colors.textPrimary} />
          </Pressable>

          <View style={styles.titleColumn}>
            <View style={styles.symbolRow}>
              <Text style={[styles.symbolText, { color: colors.textPrimary, ...typography.headline2 }]}>
                {instrument.symbol}
              </Text>
              <View style={[styles.exchangeBadge, { backgroundColor: colors.bgSurface, borderRadius: radius.xs }]}>
                <Text style={[styles.exchangeText, { color: colors.textTertiary, ...typography.microBadge }]}>
                  {instrument.exchange}
                </Text>
              </View>
            </View>
            <Text
              numberOfLines={1}
              style={[styles.displayName, { color: colors.textSecondary, ...typography.captionRegular }]}
            >
              {instrument.displayName}
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => toggleWatchlistItem(instrument.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[
            styles.bookmarkBtn,
            {
              backgroundColor: isBookmarked ? colors.positiveBg : colors.bgSurface,
              borderColor: isBookmarked ? colors.positive : colors.borderSubtle,
              borderRadius: radius.sm,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove from watchlist' : 'Add to watchlist'}
        >
          <Icon
            name={isBookmarked ? 'bookmark-filled' : 'bookmark'}
            size={18}
            color={isBookmarked ? colors.positive : colors.textTertiary}
          />
        </Pressable>
      </View>

      {/* 2. Scrollable Content Area */}
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        {/* Price & Day Returns */}
        <View style={styles.priceSection}>
          <Text style={[styles.ltpHeading, { color: colors.textPrimary, ...typography.display }]}>
            {formatINR(quote.ltpPaise)}
          </Text>
          <View style={[styles.returnsRow, { marginTop: spacing.xs }]}>
            <DirectionalPill amountPaise={changePaise} percentageBps={percentageBps} />
            <View style={[styles.modeTag, { backgroundColor: colors.bgSurface, borderRadius: radius.xs, marginLeft: spacing.sm }]}>
              <Text style={[styles.modeTagText, { color: colors.textTertiary, ...typography.microBadge }]}>
                {dataMode}
              </Text>
            </View>
          </View>
        </View>

        {/* Existing Holding Callout Banner */}
        {holding && holding.quantity > 0 && (
          <View style={[styles.holdingBanner, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.lg }]}>
            <Text style={[styles.holdingHeading, { color: colors.brandPrimary, ...typography.captionRegular, fontWeight: '700' }]}>
              EXISTING HOLDING
            </Text>
            <Text style={[styles.holdingBody, { color: colors.textPrimary, ...typography.bodyRegular, marginTop: 4 }]}>
              You hold {holding.quantity} shares • Avg Price: {formatINR(holding.averageCostPaise)}
            </Text>
          </View>
        )}

        {/* Chart Section */}
        <View style={{ marginTop: spacing.xl }}>
          <View style={{ marginBottom: spacing.sm }}>
            <TimeframeSelector selected={selectedTimeframe} onSelect={setSelectedTimeframe} />
          </View>
          <SimplePriceChart
            points={chartPoints}
            basePricePaise={quote.closePricePaise}
            highPricePaise={dayHigh}
            lowPricePaise={dayLow}
          />
        </View>

        {/* Key Statistics Grid */}
        <View style={{ marginTop: spacing.xl }}>
          <KeyStatsGrid instrument={instrument} quote={quote} />
        </View>
      </ScrollView>

      {/* 3. Fixed Bottom Action Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.bgSurface, borderTopColor: colors.borderSubtle, padding: spacing.md }]}>
        <Pressable
          onPress={() => {
            router.push({
              pathname: '/order/ticket',
              params: { symbol: instrument.symbol, side: 'BUY' },
            });
          }}
          style={[styles.actionButton, { backgroundColor: colors.positive, borderRadius: radius.md, marginRight: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel={`Buy ${instrument.symbol}`}
        >
          <Text style={[styles.actionButtonText, { color: '#FFFFFF', ...typography.bodyBold }]}>
            BUY
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            router.push({
              pathname: '/order/ticket',
              params: { symbol: instrument.symbol, side: 'SELL' },
            });
          }}
          style={[styles.actionButton, { backgroundColor: colors.negative, borderRadius: radius.md, marginLeft: spacing.sm }]}
          accessibilityRole="button"
          accessibilityLabel={`Sell ${instrument.symbol}`}
        >
          <Text style={[styles.actionButtonText, { color: '#FFFFFF', ...typography.bodyBold }]}>
            SELL
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  notFoundWrapper: {
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  backButton: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleColumn: {
    flex: 1,
  },
  symbolRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symbolText: {
    letterSpacing: -0.2,
  },
  exchangeBadge: {
    marginLeft: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  exchangeText: {
    fontWeight: '700',
  },
  displayName: {
    marginTop: 2,
  },
  bookmarkBtn: {
    padding: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceSection: {},
  ltpHeading: {},
  returnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeTagText: {
    fontWeight: '700',
  },
  holdingBanner: {
    borderWidth: 1,
  },
  holdingHeading: {
    letterSpacing: 0.5,
  },
  holdingBody: {},
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  actionButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
