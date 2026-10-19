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
import { useOrders, useMarketData, useApp } from '../../src/services/AppContext.js';
import { OrderListItem } from '../../src/components/order/OrderListItem.js';
import { EmptyState } from '../../src/components/common/EmptyState.js';

type OrderTab = 'OPEN' | 'EXECUTED';

export default function OrdersScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const { openOrders, executedOrders, cancelOrder } = useOrders();
  const { getInstrument, getQuote } = useMarketData();
  const { refreshAll } = useApp();

  const [activeTab, setActiveTab] = useState<OrderTab>('OPEN');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    refreshAll();
    setTimeout(() => setIsRefreshing(false), 300);
  }, [refreshAll]);

  const activeList = activeTab === 'OPEN' ? openOrders : executedOrders;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline1 }]}>
          Order Book
        </Text>
      </View>

      {/* 2. Segmented Navigation Tabs */}
      <View style={[styles.segmentContainer, { backgroundColor: colors.bgSurface, borderBottomColor: colors.borderSubtle, padding: spacing.sm }]}>
        <View style={[styles.segmentWrapper, { backgroundColor: colors.bgCanvas, borderRadius: radius.md, padding: 3 }]}>
          <Pressable
            onPress={() => setActiveTab('OPEN')}
            style={[
              styles.tabBtn,
              activeTab === 'OPEN' && { backgroundColor: colors.bgSurfaceElevated, borderRadius: radius.sm },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'OPEN' ? colors.textPrimary : colors.textTertiary,
                  ...typography.captionRegular,
                  fontWeight: activeTab === 'OPEN' ? '700' : '500',
                },
              ]}
            >
              Open Orders ({openOrders.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('EXECUTED')}
            style={[
              styles.tabBtn,
              activeTab === 'EXECUTED' && { backgroundColor: colors.bgSurfaceElevated, borderRadius: radius.sm },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === 'EXECUTED' ? colors.textPrimary : colors.textTertiary,
                  ...typography.captionRegular,
                  fontWeight: activeTab === 'EXECUTED' ? '700' : '500',
                },
              ]}
            >
              Executed & Past ({executedOrders.length})
            </Text>
          </Pressable>
        </View>
      </View>

      {/* 3. Orders List */}
      <FlatList
        data={activeList}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brandPrimary}
            colors={[colors.brandPrimary]}
          />
        }
        renderItem={({ item }) => {
          const instrument = getInstrument(item.instrumentId);
          const quote = getQuote(item.instrumentId);

          return (
            <OrderListItem
              order={item}
              instrument={instrument}
              quote={quote}
              onCancel={activeTab === 'OPEN' ? cancelOrder : undefined}
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
        }}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.xxl }}>
            {activeTab === 'OPEN' ? (
              <EmptyState
                title="No Open Orders"
                message="Limit orders waiting for prevailing market price triggers will appear here."
                actionLabel="Explore Watchlist"
                onAction={() => router.push('/')}
              />
            ) : (
              <EmptyState
                title="No Executed Orders Yet"
                message="You haven't placed any trades in this session. Start by selecting a stock from the Watchlist."
                actionLabel="View Watchlist"
                onAction={() => router.push('/')}
              />
            )}
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
    borderBottomWidth: 1,
  },
  title: {
    letterSpacing: -0.3,
  },
  segmentContainer: {
    borderBottomWidth: 1,
  },
  segmentWrapper: {
    flexDirection: 'row',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {},
});
