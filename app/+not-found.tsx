import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, Stack } from 'expo-router';
import { useTheme } from '../src/theme/ThemeContext.js';

export default function NotFoundScreen(): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <>
      <Stack.Screen options={{ title: 'Screen Not Found' }} />
      <View style={[styles.container, { backgroundColor: colors.bgCanvas, padding: spacing.lg }]}>
        <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline1 }]}>
          This screen doesn't exist.
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary, ...typography.bodyRegular, marginTop: spacing.xs }]}>
          The route you requested could not be found.
        </Text>

        <Link href="/" asChild>
          <Pressable
            style={[
              styles.button,
              {
                backgroundColor: colors.brandPrimary,
                borderRadius: radius.md,
                marginTop: spacing.xl,
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.lg,
              },
            ]}
          >
            <Text style={[styles.buttonText, { color: '#FFFFFF', ...typography.bodyBold }]}>
              Go to Watchlist
            </Text>
          </Pressable>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    minWidth: 160,
  },
  buttonText: {
    textAlign: 'center',
  },
});
