import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { useTheme } from '../../theme/ThemeContext.js';
import { formatINR } from '../../domain/money/money.js';
import type { EstimatedCharges } from '../../domain/charges/types.js';
import { Divider } from '../common/Divider.js';
import { Icon } from '../common/Icon.js';

interface ChargesBreakdownModalProps {
  readonly visible: boolean;
  readonly charges: EstimatedCharges | null;
  readonly onClose: () => void;
}

export function ChargesBreakdownModal({
  visible,
  charges,
  onClose,
}: ChargesBreakdownModalProps): React.JSX.Element {
  const { colors, spacing, radius, typography } = useTheme();

  if (!charges) return <></>;

  const rows = [
    { label: 'Brokerage (Zero for Paper Trading)', amount: charges.brokeragePaise },
    { label: 'Securities Transaction Tax (STT)', amount: charges.sttPaise },
    { label: 'Exchange Turnover Charges', amount: charges.exchangeTurnoverPaise },
    { label: 'SEBI Turnover Charges', amount: charges.sebiFeePaise },
    { label: 'Stamp Duty', amount: charges.stampDutyPaise },
    { label: 'GST (18%)', amount: charges.gstPaise },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.modalCard, { backgroundColor: colors.bgSurface, borderRadius: radius.lg, padding: spacing.lg }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline2 }]}>
              Estimated Charges
            </Text>
            <Pressable onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          <Text style={[styles.subtitle, { color: colors.textTertiary, ...typography.captionRegular, marginTop: 4, marginBottom: spacing.md }]}>
            Indian statutory fees calculated according to realistic regulatory rates.
          </Text>

          <Divider style={{ marginVertical: spacing.xs }} />

          {rows.map((r, i) => (
            <View key={i} style={styles.feeRow}>
              <Text style={[styles.feeLabel, { color: colors.textSecondary, ...typography.captionRegular }]}>
                {r.label}
              </Text>
              <Text style={[styles.feeValue, { color: colors.textPrimary, ...typography.captionMono }]}>
                {formatINR(r.amount)}
              </Text>
            </View>
          ))}

          <Divider style={{ marginVertical: spacing.sm }} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.textPrimary, ...typography.bodyBold }]}>
              Total Statutory Charges
            </Text>
            <Text style={[styles.totalValue, { color: colors.positive, ...typography.bodyBold }]}>
              {formatINR(charges.totalChargesPaise)}
            </Text>
          </View>

          <Pressable
            onPress={onClose}
            style={[styles.closeButton, { backgroundColor: colors.brandPrimary, borderRadius: radius.md, marginTop: spacing.lg }]}
          >
            <Text style={[styles.closeButtonText, { color: '#FFFFFF', ...typography.bodyBold }]}>
              Got It
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {},
  subtitle: {},
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  feeLabel: {
    flex: 1,
    paddingRight: 10,
  },
  feeValue: {},
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  totalLabel: {},
  totalValue: {
    fontSize: 16,
  },
  closeButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {},
});
