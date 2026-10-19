import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR } from '../../domain/money/money.js';
import type { PortfolioSummary } from '../../domain/portfolio/types.js';
import { DirectionalPill } from '../finance/DirectionalPill.js';
import { Divider } from '../common/Divider.js';

interface PortfolioSummaryCardProps {
  readonly summary: PortfolioSummary;
}

export function PortfolioSummaryCard({ summary }: PortfolioSummaryCardProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const totalReturnBps =
    summary.totalInvestedPaise > 0
      ? Math.round((summary.totalUnrealisedPnlPaise / summary.totalInvestedPaise) * 10000)
      : 0;

  return (
    <View style={[styles.card, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.lg, padding: spacing.lg }]}>
      {/* 1. Main Net Worth / Portfolio Value */}
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.textTertiary, ...typography.captionRegular }]}>
          TOTAL PORTFOLIO VALUE
        </Text>
        <Text style={[styles.mainValue, { color: colors.textPrimary, ...typography.display, marginVertical: 4 }]}>
          {formatINR(summary.totalPortfolioValuePaise)}
        </Text>
        <View style={styles.returnsRow}>
          <Text style={[styles.subLabel, { color: colors.textSecondary, ...typography.captionRegular, marginRight: 6 }]}>
            Total Unrealized:
          </Text>
          <DirectionalPill amountPaise={summary.totalUnrealisedPnlPaise} percentageBps={totalReturnBps} />
        </View>
      </View>

      <Divider style={{ marginVertical: spacing.md }} />

      {/* 2. Sub-metrics Grid */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
            Invested
          </Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary, ...typography.bodyBold, marginTop: 2 }]}>
            {formatINR(summary.totalInvestedPaise)}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
            Current Value
          </Text>
          <Text style={[styles.metricValue, { color: colors.textPrimary, ...typography.bodyBold, marginTop: 2 }]}>
            {formatINR(summary.currentHoldingsValuePaise)}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
            Available Cash
          </Text>
          <Text style={[styles.metricValue, { color: colors.positive, ...typography.captionMono, fontWeight: '700', marginTop: 2 }]}>
            {formatINR(summary.availableCashPaise)}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textTertiary, ...typography.captionRegular }]}>
            Realized P&L
          </Text>
          <Text
            style={[
              styles.metricValue,
              {
                color: summary.totalRealisedPnlPaise >= 0 ? colors.positive : colors.negative,
                ...typography.captionMono,
                fontWeight: '700',
                marginTop: 2,
              },
            ]}
          >
            {formatINR(summary.totalRealisedPnlPaise)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
  },
  header: {},
  label: {
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  mainValue: {
    letterSpacing: -0.5,
  },
  returnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subLabel: {},
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metricItem: {
    width: '50%',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  metricLabel: {
    fontSize: 12,
  },
  metricValue: {
    letterSpacing: -0.2,
  },
});
