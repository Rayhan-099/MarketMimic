import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, type ThemeColors } from './colors.js';
import { spacing, type Spacing } from './spacing.js';
import { typography } from './typography.js';
import { radius, type Radius } from './radius.js';
import { shadows } from './shadows.js';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface ThemeContextValue {
  readonly colors: ThemeColors;
  readonly isDark: boolean;
  readonly themeMode: ThemeMode;
  readonly setThemeMode: (mode: ThemeMode) => void;
  readonly toggleTheme: () => void;
  readonly spacing: Spacing;
  readonly typography: typeof typography;
  readonly radius: Radius;
  readonly shadows: typeof shadows;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface ThemeProviderProps {
  readonly children: ReactNode;
  readonly initialMode?: ThemeMode;
}

export function ThemeProvider({
  children,
  initialMode = 'dark',
}: ThemeProviderProps): React.JSX.Element {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>(initialMode);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemColorScheme !== 'light';
    }
    return themeMode === 'dark';
  }, [themeMode, systemColorScheme]);

  const colors = useMemo(() => (isDark ? darkColors : lightColors), [isDark]);

  const toggleTheme = (): void => {
    setThemeMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const value = useMemo(
    () => ({
      colors,
      isDark,
      themeMode,
      setThemeMode,
      toggleTheme,
      spacing,
      typography,
      radius,
      shadows,
    }),
    [colors, isDark, themeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
