import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';

export interface DividerProps {
  readonly vertical?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}

export function Divider({ vertical = false, style }: DividerProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View
      style={[
        vertical ? styles.vertical : styles.horizontal,
        { backgroundColor: colors.borderSubtle },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  horizontal: {
    height: 1,
    width: '100%',
  },
  vertical: {
    width: 1,
    height: '100%',
  },
});
