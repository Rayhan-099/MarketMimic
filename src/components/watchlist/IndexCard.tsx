import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR } from '../../domain/money/money.js';
import type { Paise } from '../../domain/types.js';

function formatPercent(pct: number): string {
  return `${pct.toFixed(2)}%`;
}

export interface IndexCardProps {
  readonly title: string;
  readonly ltpPaise: Paise;
  readonly changePaise: Paise;
  readonly changePercent: number;
  readonly onPress?: () => void;
}

export function IndexCard({
  title,
  ltpPaise,
  changePaise,
  changePercent,
  onPress,
}: IndexCardProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  const isPositive = changePaise >= 0;
  const changeColor = isPositive ? colors.positive : colors.negative;
  const changeBg = isPositive ? colors.positiveBg : colors.negativeBg;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatINR(ltpPaise)}, ${isPositive ? 'up' : 'down'} ${formatPercent(changePercent)}`}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: colors.bgSurface,
          borderColor: colors.borderSubtle,
          borderRadius: radius.md,
          padding: spacing.md,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: colors.textSecondary, ...typography.captionRegular }]}
        >
          {title}
        </Text>
      </View>

      <Text style={[styles.ltp, { color: colors.textPrimary, ...typography.headline2, marginVertical: spacing.xs }]}>
        {formatINR(ltpPaise)}
      </Text>

      <View style={[styles.changePill, { backgroundColor: changeBg, borderRadius: radius.xs }]}>
        <Text style={[styles.changeText, { color: changeColor, ...typography.captionMono }]}>
          {isPositive ? '+' : ''}
          {formatINR(changePaise)} ({isPositive ? '+' : ''}
          {formatPercent(changePercent)})
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    minWidth: 150,
    borderWidth: 1,
    marginRight: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  ltp: {
    letterSpacing: -0.2,
  },
  changePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  changeText: {
    fontWeight: '600',
  },
});
