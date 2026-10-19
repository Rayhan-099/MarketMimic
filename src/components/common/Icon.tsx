import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';

export type IconName =
  | 'watchlist'
  | 'search'
  | 'orders'
  | 'portfolio'
  | 'settings'
  | 'arrow-up'
  | 'arrow-down'
  | 'chevron-right'
  | 'chevron-left'
  | 'check'
  | 'close'
  | 'bookmark'
  | 'bookmark-filled'
  | 'refresh'
  | 'trash'
  | 'info'
  | 'alert'
  | 'plus'
  | 'minus';

interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly style?: TextStyle;
}

const GLYPH_MAP: Record<IconName, string> = {
  watchlist: '📈',
  search: '🔍',
  orders: '📋',
  portfolio: '💼',
  settings: '⚙️',
  'arrow-up': '▲',
  'arrow-down': '▼',
  'chevron-right': '›',
  'chevron-left': '‹',
  check: '✓',
  close: '✕',
  bookmark: '☆',
  'bookmark-filled': '★',
  refresh: '⟳',
  trash: '🗑',
  info: 'ℹ',
  alert: '⚠',
  plus: '+',
  minus: '−',
};

export function Icon({
  name,
  size = 18,
  color,
  style,
}: IconProps): React.JSX.Element {
  const glyph = GLYPH_MAP[name] ?? '•';

  return (
    <Text
      accessible={false}
      style={[
        styles.base,
        {
          fontSize: size,
          lineHeight: size * 1.15,
          color,
        },
        style,
      ]}
    >
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'center',
    includeFontPadding: false,
  },
});
