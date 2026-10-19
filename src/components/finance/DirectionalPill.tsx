import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from '../common/Text.js';
import { formatINR } from '../../domain/money/money.js';
import type { Paise } from '../../domain/types.js';

export interface DirectionalPillProps {
  readonly amountPaise?: Paise;
  readonly percentageBps?: number; // e.g. 135 bps = +1.35%
  readonly customLabel?: string;
  readonly showGlyph?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

export function DirectionalPill({
  amountPaise,
  percentageBps,
  customLabel,
  showGlyph = true,
  style,
}: DirectionalPillProps): React.JSX.Element {
  const { colors, radius, spacing } = useTheme();

  const isPositive = (amountPaise !== undefined && amountPaise > 0) || (percentageBps !== undefined && percentageBps > 0);
  const isNegative = (amountPaise !== undefined && amountPaise < 0) || (percentageBps !== undefined && percentageBps < 0);

  const themeStyle = React.useMemo(() => {
    if (isPositive) {
      return {
        bg: colors.positiveBg,
        text: colors.positive,
        glyph: '▲ ',
        sign: '+',
      };
    }
    if (isNegative) {
      return {
        bg: colors.negativeBg,
        text: colors.negative,
        glyph: '▼ ',
        sign: '',
      };
    }
    return {
      bg: colors.neutralBg,
      text: colors.neutral,
      glyph: '',
      sign: '',
    };
  }, [isPositive, isNegative, colors]);

  const label = React.useMemo(() => {
    if (customLabel) return customLabel;

    let text = '';
    if (amountPaise !== undefined) {
      text += `${themeStyle.sign}${formatINR(amountPaise)}`;
    }

    if (percentageBps !== undefined) {
      const pct = (percentageBps / 100).toFixed(2);
      const pctStr = `${themeStyle.sign}${pct}%`;
      text = text ? `${text} (${pctStr})` : pctStr;
    }

    return text || '0.00%';
  }, [amountPaise, percentageBps, customLabel, themeStyle.sign]);

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: themeStyle.bg,
          borderRadius: radius.sm,
          paddingVertical: 3,
          paddingHorizontal: spacing.xs + 3,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Change: ${label}`}
    >
      <Text
        variant="captionMono"
        style={[styles.tabular, { color: themeStyle.text, fontWeight: '600' }]}
      >
        {showGlyph ? themeStyle.glyph : ''}{label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
