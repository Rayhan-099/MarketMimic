import React from 'react';
import {
  View,
  type ViewProps,
  type ViewStyle,
  type StyleProp,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';

export interface CardProps extends ViewProps {
  readonly elevated?: boolean;
  readonly onPress?: () => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly children?: React.ReactNode;
}


export function Card({
  elevated = false,
  onPress,
  style,
  children,
  ...rest
}: CardProps): React.JSX.Element {
  const { colors, radius, spacing, shadows } = useTheme();

  const containerStyle: ViewStyle = {
    backgroundColor: elevated ? colors.bgSurfaceElevated : colors.bgSurface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    ...(elevated ? shadows.card : shadows.subtle),
  };

  if (onPress) {
    return (
      <TouchableOpacity
        style={[containerStyle, style]}
        onPress={onPress}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        {...rest}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={[containerStyle, style]} {...rest}>
      {children}
    </View>
  );
}
