import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme/ThemeContext.js';
import { useMarketData, useWatchlist } from '../../src/services/AppContext.js';
import { SearchResultRow } from '../../src/components/search/SearchResultRow.js';
import { EmptyState } from '../../src/components/common/EmptyState.js';
import { Icon } from '../../src/components/common/Icon.js';

type ExchangeFilter = 'ALL' | 'NSE' | 'BSE';

export default function SearchScreen(): React.JSX.Element {
  const router = useRouter();
  const { colors, spacing, radius, typography } = useTheme();
  const { searchInstruments, getQuote } = useMarketData();
  const { activeWatchlistItems, toggleWatchlistItem } = useWatchlist();

  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeFilter, setExchangeFilter] = useState<ExchangeFilter>('ALL');

  // Set of instrument IDs currently bookmarked
  const bookmarkedIds = useMemo(() => {
    return new Set(activeWatchlistItems.map((item) => item.instrument.id));
  }, [activeWatchlistItems]);

  const searchResults = useMemo(() => {
    const exchange = exchangeFilter === 'ALL' ? undefined : exchangeFilter;
    return searchInstruments(searchQuery, exchange);
  }, [searchInstruments, searchQuery, exchangeFilter]);

  const filterChips: { id: ExchangeFilter; label: string }[] = [
    { id: 'ALL', label: 'All Exchanges' },
    { id: 'NSE', label: 'NSE' },
    { id: 'BSE', label: 'BSE' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* 1. Search Bar */}
      <View style={[styles.searchContainer, { borderBottomColor: colors.borderSubtle, padding: spacing.md }]}>
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.bgSurface,
              borderColor: colors.borderSubtle,
              borderRadius: radius.md,
              paddingHorizontal: spacing.md,
            },
          ]}
        >
          <Icon name="search" size={16} color={colors.textTertiary} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search equities by symbol or company..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={[styles.input, { color: colors.textPrimary, ...typography.bodyRegular }]}
          />
          {searchQuery.length > 0 && (
            <Pressable
              onPress={() => setSearchQuery('')}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.clearButton}
            >
              <Icon name="close" size={14} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* 2. Exchange Filter Chips */}
        <View style={[styles.filterRow, { marginTop: spacing.sm }]}>
          {filterChips.map((chip) => {
            const isSelected = exchangeFilter === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setExchangeFilter(chip.id)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? colors.brandPrimary : colors.bgSurface,
                    borderColor: isSelected ? colors.brandPrimary : colors.borderSubtle,
                    borderRadius: radius.full,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. Section Title */}
      <View style={[styles.sectionHeader, { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }]}>
        <Text style={[styles.sectionTitle, { color: colors.textTertiary, ...typography.microBadge }]}>
          {searchQuery.trim().length > 0 ? `SEARCH RESULTS (${searchResults.length})` : 'POPULAR EQUITIES'}
        </Text>
      </View>

      {/* 4. Results List */}
      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const quote = getQuote(item.id);
          const isBookmarked = bookmarkedIds.has(item.id);

          return (
            <SearchResultRow
              instrument={item}
              quote={quote}
              isBookmarked={isBookmarked}
              onToggleBookmark={() => toggleWatchlistItem(item.id)}
              onPress={() => {
                router.push({
                  pathname: '/stock/[symbol]',
                  params: { symbol: item.symbol },
                });
              }}
            />
          );
        }}
        ListEmptyComponent={
          <View style={{ paddingVertical: spacing.xxl }}>
            <EmptyState
              title="No Equities Found"
              message={`We couldn't find any instruments matching "${searchQuery}". Verify the ticker symbol or exchange.`}
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
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
  searchContainer: {
    borderBottomWidth: 1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    height: 48,
  },
  input: {
    flex: 1,
    marginLeft: 8,
    marginRight: 8,
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: {
    fontSize: 12,
  },
  sectionHeader: {
    justifyContent: 'center',
  },
  sectionTitle: {
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
