import React from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Text } from './Text.js';
import { Button } from './Button.js';

export interface EmptyStateProps {
  readonly title: string;
  readonly message: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
  readonly icon?: React.ReactNode;
  readonly style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon,
  style,
}: EmptyStateProps): React.JSX.Element {
  const { spacing } = useTheme();

  return (
    <View
      style={[styles.container, { padding: spacing.xl }, style]}
      accessible={true}
      accessibilityRole="summary"
      accessibilityLabel={`${title}. ${message}`}
    >
      {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
      <Text variant="headline2" style={styles.title}>
        {title}
      </Text>
      <Text
        variant="bodyRegular"
        color="secondary"
        style={[styles.message, { marginTop: spacing.xs }]}
      >
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View style={[styles.actionContainer, { marginTop: spacing.lg }]}>
          <Button
            title={actionLabel}
            onPress={onAction}
            variant="primary"
            size="md"
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
  actionContainer: {
    width: '100%',
    maxWidth: 240,
  },
});
