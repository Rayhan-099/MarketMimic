import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR } from '../../domain/money/money.js';
import type { Paise } from '../../domain/types.js';

export interface PricePoint {
  readonly timestamp: string;
  readonly pricePaise: Paise;
}

interface SimplePriceChartProps {
  readonly points: readonly PricePoint[];
  readonly basePricePaise: Paise;
  readonly highPricePaise: Paise;
  readonly lowPricePaise: Paise;
  readonly height?: number;
}

export function SimplePriceChart({
  points,
  basePricePaise,
  highPricePaise,
  lowPricePaise,
  height = 180,
}: SimplePriceChartProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const minPrice = Math.min(lowPricePaise, basePricePaise);
  const maxPrice = Math.max(highPricePaise, basePricePaise);
  const range = Math.max(maxPrice - minPrice, 1);

  const lastPoint = points.length > 0 ? points[points.length - 1] : undefined;
  const isPositive = (lastPoint?.pricePaise ?? basePricePaise) >= basePricePaise;
  const strokeColor = isPositive ? colors.positive : colors.negative;
  const barBg = isPositive ? colors.positiveBg : colors.negativeBg;

  return (
    <View style={[styles.container, { height, backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md }]}>
      {/* High reference */}
      <View style={styles.boundRow}>
        <Text style={[styles.boundText, { color: colors.textTertiary, ...typography.captionMono }]}>
          High: {formatINR(highPricePaise)}
        </Text>
      </View>

      {/* Chart visualization bars */}
      <View style={styles.chartArea}>
        {points.map((pt, idx) => {
          const normalized = Math.min(Math.max((pt.pricePaise - minPrice) / range, 0.05), 1);
          const barHeight = Math.round(normalized * (height - 60));

          return (
            <View key={idx} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: Math.max(barHeight, 3),
                    backgroundColor: strokeColor,
                    borderRadius: 2,
                  },
                ]}
              />
            </View>
          );
        })}
      </View>

      {/* Low & Base reference */}
      <View style={styles.boundRow}>
        <Text style={[styles.boundText, { color: colors.textTertiary, ...typography.captionMono }]}>
          Low: {formatINR(lowPricePaise)}
        </Text>
        <Text style={[styles.boundText, { color: colors.textTertiary, ...typography.captionMono }]}>
          Base: {formatINR(basePricePaise)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  boundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  boundText: {
    fontSize: 11,
  },
  chartArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: {
    width: '100%',
    maxWidth: 8,
  },
});
