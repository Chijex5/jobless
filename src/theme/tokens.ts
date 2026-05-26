import type { Theme as NavigationTheme } from '@react-navigation/native';

export type Appearance = 'light' | 'dark';

type ThemePalette = {
  background: string;
  surface: string;
  surfaceStrong: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  shadow: string;
  accentBlue: string;
  accentViolet: string;
  accentSuccess: string;
  accentWarning: string;
};

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  pill: 999,
};

const typography = {
  h1: { fontSize: 30, lineHeight: 36, fontWeight: '800' as const },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const },
  h3: { fontSize: 17, lineHeight: 23, fontWeight: '700' as const },
  body: { fontSize: 15, lineHeight: 21, fontWeight: '500' as const },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },
  monoMeta: { fontSize: 11, lineHeight: 15, fontWeight: '700' as const, letterSpacing: 0.9 },
};

const darkPalette: ThemePalette = {
  background: '#0D111A',
  surface: '#121826',
  surfaceStrong: '#1A2233',
  surfaceElevated: '#222D42',
  textPrimary: '#EEF4FF',
  textSecondary: '#A8B5CC',
  textMuted: '#8292AD',
  border: '#2C3A52',
  shadow: '#05070C',
  accentBlue: '#4A7BFF',
  accentViolet: '#8B6CFF',
  accentSuccess: '#49C5A8',
  accentWarning: '#F5B94A',
};

const lightPalette: ThemePalette = {
  background: '#F4F7FC',
  surface: '#FCFDFF',
  surfaceStrong: '#EEF2FA',
  surfaceElevated: '#E8EEF9',
  textPrimary: '#111A2D',
  textSecondary: '#31415F',
  textMuted: '#6C7B95',
  border: '#D4DEEE',
  shadow: '#A8B7D4',
  accentBlue: '#3C69F2',
  accentViolet: '#7252F1',
  accentSuccess: '#2BAA8B',
  accentWarning: '#CC8E1E',
};

export type AppTheme = {
  appearance: Appearance;
  colors: ThemePalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
};

export const getTheme = (appearance: Appearance): AppTheme => ({
  appearance,
  colors: appearance === 'dark' ? darkPalette : lightPalette,
  spacing,
  radius,
  typography,
});

export const buildNavigationTheme = (theme: AppTheme): NavigationTheme => ({
  dark: theme.appearance === 'dark',
  colors: {
    primary: theme.colors.accentBlue,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    notification: theme.colors.accentViolet,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '500' },
    medium: { fontFamily: 'System', fontWeight: '600' },
    bold: { fontFamily: 'System', fontWeight: '700' },
    heavy: { fontFamily: 'System', fontWeight: '800' },
  },
});

