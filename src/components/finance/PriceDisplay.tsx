import React from 'react';
import { View, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from '../common/Text.js';
import { formatINR } from '../../domain/money/money.js';
import type { Paise } from '../../domain/types.js';

export interface PriceDisplayProps {
  readonly pricePaise: Paise;
  readonly changePaise?: Paise | undefined;
  readonly changePctBps?: number | undefined; // Basis points (1 bp = 0.01%)
  readonly size?: 'sm' | 'md' | 'lg' | 'display';
  readonly showChange?: boolean;
  readonly align?: 'left' | 'right' | 'center';
  readonly style?: ViewStyle | readonly ViewStyle[];
}

export function PriceDisplay({
  pricePaise,
  changePaise,
  changePctBps,
  size = 'md',
  showChange = true,
  align = 'left',
  style,
}: PriceDisplayProps): React.JSX.Element {
  const { colors } = useTheme();

  const isPositive = (changePaise ?? 0) > 0;
  const isNegative = (changePaise ?? 0) < 0;

  const directionColor = React.useMemo(() => {
    if (isPositive) return colors.positive;
    if (isNegative) return colors.negative;
    return colors.neutral;
  }, [isPositive, isNegative, colors]);

  const glyph = isPositive ? '▲ ' : isNegative ? '▼ ' : '';
  const sign = isPositive ? '+' : '';

  const formattedPrice = formatINR(pricePaise);

  const priceVariant = React.useMemo(() => {
    switch (size) {
      case 'display':
        return 'display';
      case 'lg':
        return 'headline1';
      case 'md':
        return 'headline2';
      case 'sm':
        return 'bodyBold';
    }
  }, [size]);

  const changeText = React.useMemo(() => {
    if (changePaise === undefined) return null;

    const absChangeStr = formatINR(Math.abs(changePaise) as Paise);
    let pctStr = '';

    if (changePctBps !== undefined) {
      const pct = (changePctBps / 100).toFixed(2);
      pctStr = ` (${sign}${pct}%)`;
    }

    return `${glyph}${sign}${absChangeStr}${pctStr}`;
  }, [changePaise, changePctBps, glyph, sign]);

  return (
    <View
      style={[
        styles.container,
        align === 'right' && styles.alignRight,
        align === 'center' && styles.alignCenter,
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Price: ${formattedPrice} rupees${
        changeText ? `, Change: ${changeText}` : ''
      }`}
    >
      <Text variant={priceVariant} style={styles.tabular}>
        {formattedPrice}
      </Text>

      {showChange && changeText && (
        <Text
          variant={size === 'display' || size === 'lg' ? 'bodyBold' : 'captionMono'}
          style={[styles.tabular, { color: directionColor, marginTop: 2 }]}
        >
          {changeText}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  alignCenter: {
    alignItems: 'center',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
