import { Platform, type TextStyle } from 'react-native';

export const fontFamilies = {
  sans: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

export type TypographyVariant =
  | 'display'
  | 'headline1'
  | 'headline2'
  | 'bodyBold'
  | 'bodyRegular'
  | 'captionMono'
  | 'captionRegular'
  | 'microBadge';

export type TypographySystem = Record<TypographyVariant, TextStyle>;

export const typography: TypographySystem = {

  display: {
    fontFamily: fontFamilies.mono,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  headline1: {
    fontFamily: fontFamilies.sans,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  headline2: {
    fontFamily: fontFamilies.sans,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  bodyBold: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  },
  bodyRegular: {
    fontFamily: fontFamilies.sans,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400',
  },
  captionMono: {
    fontFamily: fontFamilies.mono,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  captionRegular: {
    fontFamily: fontFamilies.sans,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '400',
  },
  microBadge: {
    fontFamily: fontFamilies.mono,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
};
