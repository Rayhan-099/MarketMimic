import React from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from './Text.js';

export interface SegmentOption<T extends string> {
  readonly label: string;
  readonly value: T;
  readonly badge?: string;
}

export interface SegmentedControlProps<T extends string> {
  readonly options: readonly SegmentOption<T>[];
  readonly selectedValue: T;
  readonly onValueChange: (value: T) => void;
  readonly style?: ViewStyle | readonly ViewStyle[];
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onValueChange,
  style,
}: SegmentedControlProps<T>): React.JSX.Element {
  const { colors, radius, spacing } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSurfaceElevated,
          borderRadius: radius.md,
          padding: 3,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="tablist"
    >
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.segment,
              {
                borderRadius: radius.sm,
                paddingVertical: spacing.xs + 2,
                paddingHorizontal: spacing.sm,
              },
              isSelected && {
                backgroundColor: colors.bgSurface,
                shadowColor: '#000000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.15,
                shadowRadius: 2,
                elevation: 2,
              },
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
            accessible={true}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
          >
            <Text
              variant={isSelected ? 'bodyBold' : 'bodyRegular'}
              style={{
                color: isSelected ? colors.textPrimary : colors.textSecondary,
                textAlign: 'center',
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
