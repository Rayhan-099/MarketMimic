import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import {
  usePortfolio,
  useMarketData,
  useApp,
} from '../../src/services/AppContext.js';
import { PortfolioSummaryCard } from '../../src/components/portfolio/PortfolioSummaryCard.js';
import { HoldingRow } from '../../src/components/portfolio/HoldingRow.js';
import { PositionRow } from '../../src/components/portfolio/PositionRow.js';
import { EmptyState } from '../../src/components/common/EmptyState.js';

type PortfolioTab = 'HOLDINGS' | 'POSITIONS';

export default function PortfolioScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const {
    portfolioSummary,
    holdings,
    openPositions,
    squareOffPosition,
    squareOffAllPositions,
  } = usePortfolio();
  const { getInstrument, getQuote } = useMarketData();
  const { refreshAll } = useApp();

  const [activeTab, setActiveTab] = useState<PortfolioTab>('HOLDINGS');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refreshAll();
    setTimeout(() => setIsRefreshing(false), 300);
  }, [refreshAll]);

  const activeHoldings = holdings.filter((h) => h.quantity > 0);
  const hasActiveOpenPositions = openPositions.some((p) => p.status === 'OPEN' && p.quantity > 0);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline1 }]}>
          Portfolio
        </Text>
      </View>

      {/* 2. FlatList containing Summary card, tabs, and rows */}
      <FlatList
        data={activeTab === 'HOLDINGS' ? activeHoldings : (openPositions as any[])}
        keyExtractor={(item) => ('id' in item ? item.id : item.instrumentId)}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
        ListHeaderComponent={
          <View style={{ padding: spacing.lg, paddingBottom: spacing.sm }}>
            {/* Portfolio Summary Card */}
            <PortfolioSummaryCard summary={portfolioSummary} />

            {/* Segmented Tabs */}
            <View style={[styles.segmentContainer, { backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: 3, marginTop: spacing.lg }]}>
              <Pressable
                onPress={() => setActiveTab('HOLDINGS')}
                style={[
                  styles.tabBtn,
                  activeTab === 'HOLDINGS' && { backgroundColor: colors.bgSurfaceElevated, borderRadius: radius.sm },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === 'HOLDINGS' ? colors.textPrimary : colors.textTertiary,
                      ...typography.captionRegular,
                      fontWeight: activeTab === 'HOLDINGS' ? '700' : '500',
                    },
                  ]}
                >
                  Holdings ({activeHoldings.length})
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab('POSITIONS')}
                style={[
                  styles.tabBtn,
                  activeTab === 'POSITIONS' && { backgroundColor: colors.bgSurfaceElevated, borderRadius: radius.sm },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === 'POSITIONS' ? colors.textPrimary : colors.textTertiary,
                      ...typography.captionRegular,
                      fontWeight: activeTab === 'POSITIONS' ? '700' : '500',
                    },
                  ]}
                >
                  Positions ({openPositions.length})
                </Text>
              </Pressable>
            </View>
          </View>
        }
        renderItem={({ item }) => {
          if (activeTab === 'HOLDINGS') {
            const holding = item;
            const instrument = getInstrument(holding.instrumentId);
            const quote = getQuote(holding.instrumentId);

            return (
              <HoldingRow
                holding={holding}
                instrument={instrument}
                quote={quote}
                onPress={() => {
                  if (instrument) {
                    router.push({
                      pathname: '/stock/[symbol]',
                      params: { symbol: instrument.symbol },
                    });
                  }
                }}
              />
            );
          } else {
            const position = item;
            const instrument = getInstrument(position.instrumentId);
            const quote = getQuote(position.instrumentId);

            return (
              <PositionRow
                position={position}
                instrument={instrument}
                quote={quote}
                onSquareOff={squareOffPosition}
                onPress={() => {
                  if (instrument) {
                    router.push({
                      pathname: '/stock/[symbol]',
                      params: { symbol: instrument.symbol },
                    });
                  }
                }}
              />
            );
          }
        }}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.xxl }}>
            {activeTab === 'HOLDINGS' ? (
              <EmptyState
                title="Your Portfolio is Empty"
                message="Start paper trading with your ₹1,00,000 virtual balance. Explore equities from the Watchlist."
                actionLabel="Explore Watchlist"
                onAction={() => router.push('/')}
              />
            ) : (
              <EmptyState
                title="No Open Intraday Positions"
                message="Intraday (MIS) trades taken today will appear here with live mark-to-market P&L."
                actionLabel="Explore Watchlist"
                onAction={() => router.push('/')}
              />
            )}
          </View>
        }
        ListFooterComponent={
          activeTab === 'POSITIONS' && hasActiveOpenPositions ? (
            <View style={{ padding: spacing.lg, paddingBottom: spacing.xxl }}>
              <Pressable
                onPress={squareOffAllPositions}
                style={[
                  styles.squareOffAllBtn,
                  {
                    backgroundColor: colors.negative,
                    borderRadius: radius.md,
                    padding: spacing.md,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Square off all intraday positions"
              >
                <Text style={[styles.squareOffAllText, { color: '#FFFFFF', ...typography.bodyBold }]}>
                  Square Off All Positions
                </Text>
              </Pressable>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  title: {
    letterSpacing: -0.3,
  },
  segmentContainer: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {},
  squareOffAllBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  squareOffAllText: {
    letterSpacing: 0.5,
  },
});
