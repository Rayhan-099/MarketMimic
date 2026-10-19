import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext.js';
import { useAccount, useApp } from '../../src/services/AppContext.js';
import { formatINR, toPaise } from '../../src/domain/money/money.js';
import { AccountResetModal } from '../../src/components/settings/AccountResetModal.js';
import { Divider } from '../../src/components/common/Divider.js';
import { Icon } from '../../src/components/common/Icon.js';
import type { Candle } from '../../src/domain/market/types.js';

export default function SettingsScreen(): React.JSX.Element {
  const { colors, spacing, radius, typography, themeMode, toggleTheme, isDark } = useTheme();
  const { availableCash, resetAccount } = useAccount();
  const { dataMode, isReplay, replayTime, service, stepReplay, stopReplay, refreshAll } = useApp();

  const [showResetModal, setShowResetModal] = useState<boolean>(false);

  const handleStartDemoReplay = (): void => {
    // Generate 15 sample 1-minute candles for Reliance to demonstrate historical replay
    const startTimeIso = '2026-10-17T09:15:00.000Z';
    const sampleCandles: Candle[] = [];
    const basePrice = 295000;

    for (let i = 0; i < 20; i++) {
      const timeMs = new Date(startTimeIso).getTime() + i * 60000;
      const wave = Math.round(Math.sin(i * 0.5) * 600);
      const close = toPaise(basePrice + wave);

      sampleCandles.push({
        instrumentId: 'NSE_RELIANCE' as any,
        interval: '1m',
        timestamp: new Date(timeMs).toISOString(),
        openPaise: toPaise(close - 100),
        highPaise: toPaise(close + 200),
        lowPaise: toPaise(close - 200),
        closePaise: close,
        volume: 25000,
      });
    }

    service.startReplay(startTimeIso, sampleCandles);
    refreshAll();
  };

  const handleConfirmReset = (): void => {
    resetAccount();
    setShowResetModal(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bgCanvas }]} edges={['top']}>
      {/* 1. Header Bar */}
      <View style={[styles.header, { borderBottomColor: colors.borderSubtle, paddingHorizontal: spacing.lg, paddingVertical: spacing.md }]}>
        <Text style={[styles.title, { color: colors.textPrimary, ...typography.headline1 }]}>
          Settings & Simulation
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 100 }}>
        {/* 2. Virtual Account Card */}
        <View style={[styles.accountCard, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.lg, padding: spacing.lg }]}>
          <Text style={[styles.cardTag, { color: colors.textTertiary, ...typography.microBadge }]}>
            VIRTUAL PAPER ACCOUNT
          </Text>
          <Text style={[styles.accountName, { color: colors.textPrimary, ...typography.headline2, marginTop: 4 }]}>
            Personal Paper Account
          </Text>
          <Text style={[styles.accountCash, { color: colors.positive, ...typography.display, marginVertical: spacing.xs }]}>
            {formatINR(availableCash)}
          </Text>

          <View style={styles.statusRow}>
            <View style={[styles.modeBadge, { backgroundColor: colors.badgeDemoBg, borderRadius: radius.xs }]}>
              <Text style={[styles.modeText, { color: colors.badgeDemoText, ...typography.microBadge }]}>
                {dataMode} MODE
              </Text>
            </View>
            <Text style={[styles.dbText, { color: colors.textTertiary, ...typography.captionRegular, marginLeft: 8 }]}>
              Local SQLite • Zero Cloud Dependencies
            </Text>
          </View>
        </View>

        {/* 3. Appearance & Theme */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.sm }]}>
            APPEARANCE & THEME
          </Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
            <Pressable
              onPress={toggleTheme}
              style={[styles.settingRow, { padding: spacing.md }]}
              accessibilityRole="button"
              accessibilityLabel={`Switch theme, current theme is ${isDark ? 'Dark' : 'Light'}`}
            >
              <View style={styles.settingLabelCol}>
                <Text style={[styles.settingTitle, { color: colors.textPrimary, ...typography.bodyRegular }]}>
                  Dark Theme
                </Text>
                <Text style={[styles.settingSub, { color: colors.textTertiary, ...typography.captionRegular }]}>
                  Fintech high-contrast palette (#090D16)
                </Text>
              </View>

              <View style={[styles.themePill, { backgroundColor: isDark ? colors.brandPrimary : colors.bgSurfaceElevated, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 }]}>
                <Text style={[styles.themePillText, { color: isDark ? '#FFFFFF' : colors.textPrimary, ...typography.captionMono, fontWeight: '700' }]}>
                  {isDark ? 'ON' : 'OFF'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* 4. Simulation Engine Parameters */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.sm }]}>
            SIMULATOR ENGINE CONFIGURATION
          </Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1, padding: spacing.md }]}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary, ...typography.bodyRegular }]}>
                Fee Schedule
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary, ...typography.captionRegular }]}>
                Realistic Indian Statutory
              </Text>
            </View>

            <View style={[styles.settingRow, { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1, padding: spacing.md }]}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary, ...typography.bodyRegular }]}>
                Execution Model
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary, ...typography.captionRegular }]}>
                Deterministic V1 Matcher
              </Text>
            </View>

            <View style={[styles.settingRow, { padding: spacing.md }]}>
              <Text style={[styles.settingTitle, { color: colors.textPrimary, ...typography.bodyRegular }]}>
                Intraday Square-off
              </Text>
              <Text style={[styles.settingValue, { color: colors.textSecondary, ...typography.captionRegular }]}>
                15:20 IST Scheduled
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Historical Replay Simulator */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.sm }]}>
            HISTORICAL MARKET REPLAY
          </Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md, padding: spacing.md }]}>
            <Text style={[styles.replayDescription, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.md }]}>
              Step historical time candle-by-candle and simulate trades against historical price ticks.
            </Text>

            {isReplay ? (
              <Pressable
                onPress={() => {
                  stopReplay();
                  refreshAll();
                }}
                style={[styles.replayActionBtn, { backgroundColor: colors.negative, borderRadius: radius.md }]}
                accessibilityRole="button"
                accessibilityLabel="Stop replay simulation"
              >
                <Text style={[styles.replayActionText, { color: '#FFFFFF', ...typography.bodyBold }]}>
                  Stop Replay Session
                </Text>
              </Pressable>
            ) : (
              <Pressable
                onPress={handleStartDemoReplay}
                style={[styles.replayActionBtn, { backgroundColor: colors.badgeReplayText, borderRadius: radius.md }]}
                accessibilityRole="button"
                accessibilityLabel="Launch historical replay demo"
              >
                <Text style={[styles.replayActionText, { color: '#FFFFFF', ...typography.bodyBold }]}>
                  Launch Replay Session
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* 6. Account Reset */}
        <View style={{ marginTop: spacing.xl }}>
          <Text style={[styles.sectionHeading, { color: colors.textSecondary, ...typography.captionRegular, marginBottom: spacing.sm }]}>
            ACCOUNT MANAGEMENT
          </Text>
          <View style={[styles.settingsGroup, { backgroundColor: colors.bgSurface, borderColor: colors.borderSubtle, borderRadius: radius.md }]}>
            <Pressable
              onPress={() => setShowResetModal(true)}
              style={[styles.settingRow, { padding: spacing.md }]}
              accessibilityRole="button"
              accessibilityLabel="Reset virtual account to initial state"
            >
              <View style={styles.settingLabelCol}>
                <Text style={[styles.settingTitle, { color: colors.negative, ...typography.bodyBold }]}>
                  Reset Virtual Account
                </Text>
                <Text style={[styles.settingSub, { color: colors.textTertiary, ...typography.captionRegular }]}>
                  Restore cash to ₹1,00,000 and clear trades
                </Text>
              </View>

              <Icon name="chevron-right" size={18} color={colors.negative} />
            </Pressable>
          </View>
        </View>

        {/* 7. Educational & Architecture Disclaimer */}
        <View style={[styles.disclaimerContainer, { marginTop: spacing.xxl }]}>
          <Text style={[styles.disclaimerText, { color: colors.textTertiary, ...typography.captionRegular, textAlign: 'center' }]}>
            MarketMimic is an educational paper-trading simulator for personal study. It is not affiliated with or endorsed by Groww, NSE, or BSE.
          </Text>
          <Text style={[styles.versionText, { color: colors.textTertiary, ...typography.microBadge, textAlign: 'center', marginTop: 8 }]}>
            VERSION 1.0.0 (PHASE D ANDROID) • NO PAID CLOUD DEPENDENCIES
          </Text>
        </View>
      </ScrollView>

      {/* Account Reset Modal */}
      <AccountResetModal
        visible={showResetModal}
        onConfirm={handleConfirmReset}
        onCancel={() => setShowResetModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
  },
  title: {
    letterSpacing: -0.3,
  },
  accountCard: {
    borderWidth: 1,
  },
  cardTag: {
    letterSpacing: 0.5,
    fontWeight: '700',
  },
  accountName: {},
  accountCash: {},
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  modeText: {
    fontWeight: '700',
  },
  dbText: {},
  sectionHeading: {
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  settingsGroup: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabelCol: {
    flex: 1,
  },
  settingTitle: {},
  settingSub: {
    marginTop: 2,
  },
  settingValue: {},
  themePill: {},
  themePillText: {},
  replayDescription: {
    lineHeight: 18,
  },
  replayActionBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  replayActionText: {},
  disclaimerContainer: {},
  disclaimerText: {
    lineHeight: 18,
  },
  versionText: {
    letterSpacing: 0.5,
  },
});
