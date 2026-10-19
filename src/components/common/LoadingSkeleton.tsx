import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';

export interface LoadingSkeletonProps {
  readonly width?: number | string;
  readonly height?: number;
  readonly borderRadius?: number;
  readonly style?: StyleProp<ViewStyle>;
}

export function LoadingSkeleton({
  width = '100%',
  height = 20,
  borderRadius,
  style,
}: LoadingSkeletonProps): React.JSX.Element {
  const { colors, radius } = useTheme();
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();

    return () => pulse.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius: borderRadius ?? radius.sm,
          backgroundColor: colors.bgSurfaceElevated,
          opacity: opacityAnim,
        },
        style,
      ]}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading content"
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
