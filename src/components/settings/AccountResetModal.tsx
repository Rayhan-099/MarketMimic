import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { Icon } from '../common/Icon.js';

interface AccountResetModalProps {
  readonly visible: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

export function AccountResetModal({
  visible,
  onConfirm,
  onCancel,
}: AccountResetModalProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={[styles.card, { backgroundColor: colors.bgSurface, borderRadius: radius.lg, padding: spacing.xl }]}>
          <View style={[styles.iconWrapper, { backgroundColor: colors.negativeBg, borderRadius: radius.full }]}>
            <Icon name="alert" size={28} color={colors.negative} />
          </View>

          <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline2, marginTop: spacing.md }]}>
            Reset Virtual Account?
          </Text>

          <Text style={[styles.message, { color: colors.textSecondary, ...typography.captionRegular, marginTop: spacing.xs }]}>
            This will reset your available cash back to ₹1,00,000 and clear all active holdings, open intraday positions, and order history.
          </Text>

          <View style={[styles.actionsRow, { marginTop: spacing.xl }]}>
            <Pressable
              onPress={onCancel}
              style={[styles.cancelBtn, { backgroundColor: colors.bgCanvas, borderColor: colors.borderSubtle, borderRadius: radius.md, marginRight: spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Cancel account reset"
            >
              <Text style={[styles.cancelBtnText, { color: colors.textPrimary, ...typography.bodyBold }]}>
                Cancel
              </Text>
            </Pressable>

            <Pressable
              onPress={onConfirm}
              style={[styles.confirmBtn, { backgroundColor: colors.negative, borderRadius: radius.md, marginLeft: spacing.sm }]}
              accessibilityRole="button"
              accessibilityLabel="Confirm account reset"
            >
              <Text style={[styles.confirmBtnText, { color: '#FFFFFF', ...typography.bodyBold }]}>
                Reset to ₹1,00,000
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconWrapper: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cancelBtnText: {},
  confirmBtn: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {},
});
