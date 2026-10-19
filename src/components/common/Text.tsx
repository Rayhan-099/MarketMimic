import React from 'react';
import {
  Text as RNText,
  type TextProps as RNTextProps,
  type TextStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';

export type TextVariant =
  | 'display'
  | 'headline1'
  | 'headline2'
  | 'bodyBold'
  | 'bodyRegular'
  | 'captionMono'
  | 'captionRegular'
  | 'microBadge';

export type TextColor =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'positive'
  | 'negative'
  | 'brand'
  | 'inverse';

export interface TextProps extends RNTextProps {
  readonly variant?: TextVariant;
  readonly color?: TextColor;
  readonly style?: StyleProp<TextStyle>;
  readonly children?: React.ReactNode;
}


export function Text({
  variant = 'bodyRegular',
  color = 'primary',
  style,
  children,
  ...rest
}: TextProps): React.JSX.Element {
  const { colors, typography } = useTheme();

  const colorStyle = React.useMemo(() => {
    switch (color) {
      case 'primary':
        return { color: colors.textPrimary };
      case 'secondary':
        return { color: colors.textSecondary };
      case 'tertiary':
        return { color: colors.textTertiary };
      case 'positive':
        return { color: colors.positive };
      case 'negative':
        return { color: colors.negative };
      case 'brand':
        return { color: colors.brandPrimary };
      case 'inverse':
        return { color: colors.bgCanvas };
    }
  }, [color, colors]);

  const variantStyle = typography[variant] ?? typography.bodyRegular;

  return (
    <RNText
      style={[styles.base, variantStyle, colorStyle, style]}
      maxFontSizeMultiplier={1.5}
      {...rest}
    >
      {children}
    </RNText>
  );
}

const styles = StyleSheet.create({
  base: {
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
