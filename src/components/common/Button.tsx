import React from 'react';
import {
  TouchableOpacity,
  type TouchableOpacityProps,
  type ViewStyle,
  type TextStyle,
  type StyleProp,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from './Text.js';

export type ButtonVariant =
  | 'primary'
  | 'buy'
  | 'sell'
  | 'secondary'
  | 'outline'
  | 'ghost';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends TouchableOpacityProps {
  readonly title: string;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly style?: StyleProp<ViewStyle>;
}


export function Button({
  title,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onPress,
  style,
  ...rest
}: ButtonProps): React.JSX.Element {
  const { colors, radius, spacing } = useTheme();

  const isInteractive = !disabled && !loading;

  const sizeStyles: ViewStyle = React.useMemo(() => {
    switch (size) {
      case 'sm':
        return { paddingVertical: spacing.xs, paddingHorizontal: spacing.md };
      case 'md':
        return { paddingVertical: spacing.sm + 2, paddingHorizontal: spacing.lg };
      case 'lg':
        return { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl };
    }
  }, [size, spacing]);

  const variantStyles: { container: ViewStyle; text: TextStyle } = React.useMemo(() => {
    switch (variant) {
      case 'primary':
        return {
          container: { backgroundColor: colors.brandPrimary },
          text: { color: '#FFFFFF' },
        };
      case 'buy':
        return {
          container: { backgroundColor: colors.positive },
          text: { color: '#090D16', fontWeight: '700' },
        };
      case 'sell':
        return {
          container: { backgroundColor: colors.negative },
          text: { color: '#FFFFFF', fontWeight: '700' },
        };
      case 'secondary':
        return {
          container: { backgroundColor: colors.bgSurfaceElevated },
          text: { color: colors.textPrimary },
        };
      case 'outline':
        return {
          container: {
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderColor: colors.borderSubtle,
          },
          text: { color: colors.textPrimary },
        };
      case 'ghost':
        return {
          container: { backgroundColor: 'transparent' },
          text: { color: colors.brandPrimary },
        };
    }
  }, [variant, colors]);

  return (
    <TouchableOpacity
      style={[
        styles.base,
        { borderRadius: radius.md },
        sizeStyles,
        variantStyles.container,
        disabled && styles.disabled,
        style,
      ]}
      onPress={isInteractive ? onPress : undefined}
      activeOpacity={0.7}
      disabled={!isInteractive}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={title}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variantStyles.text.color ?? colors.textPrimary}
        />
      ) : (
        <Text
          variant={size === 'sm' ? 'captionRegular' : 'bodyBold'}
          style={[styles.text, variantStyles.text]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
