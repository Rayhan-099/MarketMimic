export interface ThemeColors {
  readonly bgCanvas: string;
  readonly bgSurface: string;
  readonly bgSurfaceElevated: string;
  readonly borderSubtle: string;
  readonly borderFocus: string;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textTertiary: string;
  readonly brandPrimary: string;
  readonly brandPrimaryLight: string;
  readonly positive: string;
  readonly positiveBg: string;
  readonly negative: string;
  readonly negativeBg: string;
  readonly neutral: string;
  readonly neutralBg: string;

  // Freshness & Data Badges
  readonly badgeLiveText: string;
  readonly badgeLiveBg: string;
  readonly badgeDelayedText: string;
  readonly badgeDelayedBg: string;
  readonly badgeReplayText: string;
  readonly badgeReplayBg: string;
  readonly badgeCachedText: string;
  readonly badgeCachedBg: string;
  readonly badgeDemoText: string;
  readonly badgeDemoBg: string;
  readonly badgeUnavailableText: string;
  readonly badgeUnavailableBg: string;
}

export const darkColors: ThemeColors = {
  bgCanvas: '#090D16',
  bgSurface: '#111827',
  bgSurfaceElevated: '#1F2937',
  borderSubtle: '#1F2937',
  borderFocus: '#4F46E5',
  textPrimary: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  brandPrimary: '#6366F1',
  brandPrimaryLight: '#EEF2FF',
  positive: '#00D09C',
  positiveBg: 'rgba(0, 208, 156, 0.12)',
  negative: '#EB5B3C',
  negativeBg: 'rgba(235, 91, 60, 0.12)',
  neutral: '#9CA3AF',
  neutralBg: 'rgba(156, 163, 175, 0.12)',

  badgeLiveText: '#00D09C',
  badgeLiveBg: 'rgba(0, 208, 156, 0.14)',
  badgeDelayedText: '#F59E0B',
  badgeDelayedBg: 'rgba(245, 158, 11, 0.14)',
  badgeReplayText: '#A855F7',
  badgeReplayBg: 'rgba(168, 85, 247, 0.14)',
  badgeCachedText: '#9CA3AF',
  badgeCachedBg: 'rgba(156, 163, 175, 0.14)',
  badgeDemoText: '#38BDF8',
  badgeDemoBg: 'rgba(56, 189, 248, 0.14)',
  badgeUnavailableText: '#EF4444',
  badgeUnavailableBg: 'rgba(239, 68, 68, 0.14)',
};

export const lightColors: ThemeColors = {
  bgCanvas: '#F8FAFC',
  bgSurface: '#FFFFFF',
  bgSurfaceElevated: '#F1F5F9',
  borderSubtle: '#E2E8F0',
  borderFocus: '#4F46E5',
  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  brandPrimary: '#4F46E5',
  brandPrimaryLight: '#EEF2FF',
  positive: '#059669',
  positiveBg: 'rgba(5, 150, 105, 0.12)',
  negative: '#DC2626',
  negativeBg: 'rgba(220, 38, 38, 0.12)',
  neutral: '#64748B',
  neutralBg: 'rgba(100, 116, 139, 0.12)',

  badgeLiveText: '#059669',
  badgeLiveBg: 'rgba(5, 150, 105, 0.12)',
  badgeDelayedText: '#D97706',
  badgeDelayedBg: 'rgba(217, 119, 6, 0.12)',
  badgeReplayText: '#9333EA',
  badgeReplayBg: 'rgba(147, 51, 234, 0.12)',
  badgeCachedText: '#64748B',
  badgeCachedBg: 'rgba(100, 116, 139, 0.12)',
  badgeDemoText: '#0284C7',
  badgeDemoBg: 'rgba(2, 132, 199, 0.12)',
  badgeUnavailableText: '#DC2626',
  badgeUnavailableBg: 'rgba(220, 38, 38, 0.12)',
};
