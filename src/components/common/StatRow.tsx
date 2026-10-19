import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from './Text.js';

export interface StatRowProps {
  readonly label: string;
  readonly value: string | React.ReactNode;
  readonly valueColor?: 'primary' | 'secondary' | 'positive' | 'negative' | 'brand';
  readonly isMonospace?: boolean;
  readonly isBold?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

export function StatRow({
  label,
  value,
  valueColor = 'primary',
  isMonospace = false,
  isBold = false,
  style,
}: StatRowProps): React.JSX.Element {
  const { spacing } = useTheme();

  return (
    <View
      style={[
        styles.row,
        { paddingVertical: spacing.xs + 2 },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`${label}: ${typeof value === 'string' ? value : ''}`}
    >
      <Text variant="captionRegular" color="secondary" style={styles.label}>
        {label}
      </Text>
      {typeof value === 'string' ? (
        <Text
          variant={isBold ? 'bodyBold' : isMonospace ? 'captionMono' : 'bodyRegular'}
          color={valueColor}
          style={[isMonospace && styles.tabular, styles.value]}
        >
          {value}
        </Text>
      ) : (
        <View style={styles.valueNode}>{value}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    flex: 1,
    marginRight: 8,
  },
  value: {
    textAlign: 'right',
  },
  valueNode: {
    alignItems: 'flex-end',
  },
  tabular: {
    fontVariant: ['tabular-nums'],
  },
});
