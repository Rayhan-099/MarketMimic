import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from './Text.js';
import type { DataMode } from '../../domain/orders/types.js';

export type BadgeVariant =
  | DataMode
  | 'DEFAULT'
  | 'NSE'
  | 'BSE'
  | 'CNC'
  | 'MIS'
  | 'OPEN'
  | 'FILLED'
  | 'CANCELLED'
  | 'REJECTED';

export interface BadgeProps {
  readonly label: string;
  readonly variant?: BadgeVariant;
  readonly style?: ViewStyle | readonly ViewStyle[];
}

export function Badge({
  label,
  variant = 'DEFAULT',
  style,
}: BadgeProps): React.JSX.Element {
  const { colors, radius, spacing } = useTheme();

  const badgeStyle = React.useMemo(() => {
    switch (variant) {
      case 'LIVE':
        return { bg: colors.badgeLiveBg, text: colors.badgeLiveText };
      case 'DELAYED':
        return { bg: colors.badgeDelayedBg, text: colors.badgeDelayedText };
      case 'REPLAY':
        return { bg: colors.badgeReplayBg, text: colors.badgeReplayText };
      case 'CACHED':
        return { bg: colors.badgeCachedBg, text: colors.badgeCachedText };
      case 'DEMO':
        return { bg: colors.badgeDemoBg, text: colors.badgeDemoText };
      case 'UNAVAILABLE':
      case 'REJECTED':
        return { bg: colors.badgeUnavailableBg, text: colors.badgeUnavailableText };
      case 'FILLED':
        return { bg: colors.positiveBg, text: colors.positive };
      case 'OPEN':
        return { bg: colors.badgeDemoBg, text: colors.badgeDemoText };
      case 'CANCELLED':
        return { bg: colors.neutralBg, text: colors.neutral };
      case 'NSE':
      case 'BSE':
      case 'CNC':
      case 'MIS':
      case 'DEFAULT':
      default:
        return { bg: colors.bgSurfaceElevated, text: colors.textSecondary };
    }
  }, [variant, colors]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: badgeStyle.bg,
          borderRadius: radius.xs,
          paddingHorizontal: spacing.xs + 2,
          paddingVertical: 2,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel={`Badge: ${label}`}
    >
      <Text
        variant="microBadge"
        style={{ color: badgeStyle.text, textTransform: 'uppercase' }}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
