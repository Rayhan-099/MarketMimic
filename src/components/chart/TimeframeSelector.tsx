import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';

export type Timeframe = '1D' | '1W' | '1M' | '1Y' | 'ALL';

interface TimeframeSelectorProps {
  readonly selected: Timeframe;
  readonly onSelect: (tf: Timeframe) => void;
}

const TIMEFRAMES: readonly Timeframe[] = ['1D', '1W', '1M', '1Y', 'ALL'];

export function TimeframeSelector({
  selected,
  onSelect,
}: TimeframeSelectorProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bgSurface, borderRadius: radius.full, padding: 3 }]}>
      {TIMEFRAMES.map((tf) => {
        const isSelected = selected === tf;
        return (
          <Pressable
            key={tf}
            onPress={() => onSelect(tf)}
            accessibilityRole="button"
            accessibilityLabel={`Select timeframe ${tf}`}
            accessibilityState={{ selected: isSelected }}
            style={[
              styles.button,
              {
                backgroundColor: isSelected ? colors.brandPrimary : 'transparent',
                borderRadius: radius.full,
                paddingVertical: spacing.xs,
                paddingHorizontal: spacing.sm,
              },
            ]}
          >
            <Text
              style={[
                styles.text,
                {
                  color: isSelected ? '#FFFFFF' : colors.textSecondary,
                  ...typography.captionMono,
                  fontWeight: isSelected ? '700' : '500',
                },
              ]}
            >
              {tf}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 32,
  },
  text: {
    textAlign: 'center',
  },
});
