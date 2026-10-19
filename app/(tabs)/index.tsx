import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  RefreshControl,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import { useApp, useAccount, useWatchlist } from '../../src/services/AppContext.js';
import { formatINR, toPaise } from '../../src/domain/money/money.js';
import { IndexCard } from '../../src/components/watchlist/IndexCard.js';
import { WatchlistRow } from '../../src/components/watchlist/WatchlistRow.js';
import { EmptyState } from '../../src/components/common/EmptyState.js';
import { ReplayControlBar } from '../../src/components/replay/ReplayControlBar.js';

export default function WatchlistScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const { dataMode, isReplay, replayTime, refreshAll, stepReplay, stopReplay } = useApp();
  const { availableCash } = useAccount();
  const {
    watchlists,
    activeWatchlistId,
    activeWatchlistItems,
    setActiveWatchlistId,
  } = useWatchlist();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refreshAll();
    setTimeout(() => setIsRefreshing(false), 400);
  }, [refreshAll]);

  // Benchmark indices data
  const niftyLtp = toPaise(2485425);
  const niftyChange = toPaise(12540);
  const niftyChangePct = 0.51;

  const sensexLtp = toPaise(8138130);
  const sensexChange = toPaise(39010);
  const sensexChangePct = 0.48;

  const dataModeBadge = React.useMemo(() => {
    switch (dataMode) {
      case 'LIVE':
        return { text: 'LIVE', bg: colors.badgeLiveBg, color: colors.badgeLiveText };
      case 'DELAYED':
        return { text: 'DELAYED', bg: colors.badgeDelayedBg, color: colors.badgeDelayedText };
      case 'REPLAY':
        return { text: 'REPLAY', bg: colors.badgeReplayBg, color: colors.badgeReplayText };
      case 'CACHED':
        return { text: 'CACHED', bg: colors.badgeCachedBg, color: colors.badgeCachedText };
      case 'DEMO':
      default:
        return { text: 'DEMO', bg: colors.badgeDemoBg, color: colors.badgeDemoText };
    }
  }, [dataMode, colors]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <View style={styles.brandRow}>
          <Text style={[styles.brandTitle, { color: colors.textPrimary, ...typography.headline1 }]}>
            MarketMimic
          </Text>
          <View style={[styles.modeBadge, { backgroundColor: dataModeBadge.bg, borderRadius: radius.xs }]}>
            <Text style={[styles.modeText, { color: dataModeBadge.color, ...typography.microBadge }]}>
              {dataModeBadge.text}
            </Text>
          </View>
        </View>

        <View style={[styles.balancePill, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.full }]}>
          <Text style={[styles.balanceLabel, { color: colors.textTertiary, ...typography.microBadge }]}>
            CASH
          </Text>
          <Text style={[styles.balanceValue, { color: colors.positive, ...typography.captionMono }]}>
            {formatINR(availableCash)}
          </Text>
        </View>
      </View>

      {/* Replay Control Strip (when active) */}
      <ReplayControlBar
        isReplay={isReplay}
        replayTime={replayTime}
        onStep={stepReplay}
        onStop={stopReplay}
      />

      {/* 2. FlatList containing Indices header + Watchlist tabs + Stock rows */}
      <FlatList
        data={activeWatchlistItems}
        keyExtractor={(item) => item.instrument.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
        ListHeaderComponent={
          <View style={{ paddingTop: spacing.md }}>
            {/* Benchmark Indices Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.md }}
            >
              <IndexCard
                title="NIFTY 50"
                ltpPaise={niftyLtp}
                changePaise={niftyChange}
                changePercent={niftyChangePct}
                onPress={() => {}}
              />
              <IndexCard
                title="SENSEX"
                ltpPaise={sensexLtp}
                changePaise={sensexChange}
                changePercent={sensexChangePct}
                onPress={() => {}}
              />
            </ScrollView>

            {/* Watchlist Tabs */}
            <View style={[styles.tabPickerContainer, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {watchlists.map((wl) => {
                  const isActive = wl.id === activeWatchlistId;
                  return (
                    <Pressable
                      key={wl.id}
                      onPress={() => setActiveWatchlistId(wl.id)}
                      style={[
                        styles.wlTab,
                        isActive && { borderBottomColor: colors.brandPrimary, borderBottomWidth: 2 },
                      ]}
                    >
                      <Text
                        style={[
                          styles.wlTabText,
                          {
                            color: isActive ? colors.textPrimary : colors.textTertiary,
                            fontWeight: isActive ? '700' : '500',
                          },
                        ]}
                      >
                        {wl.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        }
        renderItem={({ item }) => (
          <WatchlistRow
            instrument={item.instrument}
            quote={item.quote}
            onPress={() => {
              router.push({
                pathname: '/stock/[symbol]',
                params: { symbol: item.instrument.symbol },
              });
            }}
          />
        )}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.xxl }}>
            <EmptyState
              title="Watchlist is Empty"
              message="Explore Indian equities from the Search tab and add them to this watchlist."
              actionLabel="Search Equities"
              onAction={() => router.push('/search')}
            />
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    letterSpacing: -0.3,
  },
  modeBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  balanceLabel: {
    marginRight: 6,
    fontWeight: '700',
  },
  balanceValue: {
    fontWeight: '700',
  },
  replayBanner: {
    alignItems: 'center',
  },
  replayText: {
    fontWeight: '600',
  },
  tabPickerContainer: {
    borderBottomWidth: 1,
  },
  wlTab: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  wlTabText: {
    fontSize: 14,
  },
});
