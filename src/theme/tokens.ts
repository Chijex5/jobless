import type { Theme as NavigationTheme } from '@react-navigation/native';

export type Appearance = 'light' | 'dark';

export type ThemePalette = {
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
  accentError: string;
  accentRose: string;
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
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  h3: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '400' as const },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
  monoMeta: { fontSize: 11, lineHeight: 15, fontWeight: '600' as const, letterSpacing: 0.6 },
};

const darkPalette: ThemePalette = {
  background: '#0F1115',
  surface: '#17191E',
  surfaceStrong: '#1D2128',
  surfaceElevated: '#252A33',
  textPrimary: '#F3F4F6',
  textSecondary: '#B2B8C2',
  textMuted: '#7A808A',
  border: '#2A303A',
  shadow: '#000000',
  accentBlue: '#6EA8FE',
  accentViolet: '#A78BFA',
  accentSuccess: '#4ADE80',
  accentWarning: '#FBBF24',
  accentError: '#EF4444',
  accentRose: '#d15c5c',
};

const lightPalette: ThemePalette = {
  background: '#F7F8FA',
  surface: '#FFFFFF',
  surfaceStrong: '#F1F3F5',
  surfaceElevated: '#E8EBEF',

  textPrimary: '#121417',
  textSecondary: '#4E5662',
  textMuted: '#8A9099',

  border: '#E3E7EC',
  shadow: '#00000010',

  accentBlue: '#4F7DF3',
  accentViolet: '#8B7CF6',

  accentSuccess: '#22C55E',
  accentWarning: '#EAA21B',

  accentError: '#DC2626',

  // your favorite color
  accentRose: '#d15c5c',
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
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium: { fontFamily: 'System', fontWeight: '500' },
    bold: { fontFamily: 'System', fontWeight: '600' },
    heavy: { fontFamily: 'System', fontWeight: '700' },
  },
});