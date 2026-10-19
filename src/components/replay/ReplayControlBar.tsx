import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Icon } from '../common/Icon.js';

export interface ReplayControlBarProps {
  readonly isReplay: boolean;
  readonly replayTime: string;
  readonly onStep: (stepMs: number) => void;
  readonly onStop: () => void;
}

export function ReplayControlBar({
  isReplay,
  replayTime,
  onStep,
  onStop,
}: ReplayControlBarProps): React.JSX.Element | null {
  const { colors, spacing, radius, typography } = useTheme();

  if (!isReplay) return null;

  const formattedTime = new Date(replayTime).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bgSurfaceElevated,
          borderColor: colors.badgeReplayText,
          borderRadius: radius.md,
          padding: spacing.sm,
          marginHorizontal: spacing.lg,
          marginBottom: spacing.sm,
        },
      ]}
    >
      <View style={styles.infoRow}>
        <View style={[styles.badge, { backgroundColor: colors.badgeReplayBg, borderRadius: radius.xs }]}>
          <Text style={[styles.badgeText, { color: colors.badgeReplayText, ...typography.microBadge }]}>
            HISTORICAL REPLAY
          </Text>
        </View>

        <Text style={[styles.clockText, { color: colors.textPrimary, ...typography.captionMono, fontWeight: '700' }]}>
          {formattedTime}
        </Text>

        <Pressable
          onPress={onStop}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.stopBtn, { backgroundColor: colors.negativeBg, borderRadius: radius.xs }]}
          accessibilityRole="button"
          accessibilityLabel="Stop replay mode"
        >
          <Text style={[styles.stopBtnText, { color: colors.negative, ...typography.microBadge, fontWeight: '700' }]}>
            EXIT
          </Text>
        </Pressable>
      </View>

      <View style={[styles.controlsRow, { marginTop: spacing.xs }]}>
        <Pressable
          onPress={() => onStep(60000)}
          style={[styles.stepBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Advance 1 minute"
        >
          <Text style={[styles.stepText, { color: colors.textPrimary, ...typography.captionRegular, fontWeight: '600' }]}>
            +1 Min
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onStep(300000)}
          style={[styles.stepBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Advance 5 minutes"
        >
          <Text style={[styles.stepText, { color: colors.textPrimary, ...typography.captionRegular, fontWeight: '600' }]}>
            +5 Min
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onStep(900000)}
          style={[styles.stepBtn, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.sm }]}
          accessibilityRole="button"
          accessibilityLabel="Advance 15 minutes"
        >
          <Text style={[styles.stepText, { color: colors.textPrimary, ...typography.captionRegular, fontWeight: '600' }]}>
            +15 Min
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  clockText: {
    letterSpacing: 0.2,
  },
  stopBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  stopBtnText: {},
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepBtn: {
    flex: 1,
    height: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  stepText: {},
});
