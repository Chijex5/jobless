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
  background: '#111110',
  surface: '#1C1C1A',
  surfaceStrong: '#242422',
  surfaceElevated: '#2E2E2B',
  textPrimary: '#EEEDE9',
  textSecondary: '#A09F9B',
  textMuted: '#6F6E6A',
  border: '#2E2E2B',
  shadow: '#000000',
  accentBlue: '#5B8AF0',
  accentViolet: '#9B7FEA',
  accentSuccess: '#3EBD8A',
  accentWarning: '#E8A838',
  accentError: '#E85C5C',
};

const lightPalette: ThemePalette = {
  background: '#F8F7F4',
  surface: '#FFFFFF',
  surfaceStrong: '#F2F1EE',
  surfaceElevated: '#ECEAE5',
  textPrimary: '#1A1917',
  textSecondary: '#4A4845',
  textMuted: '#8A8884',
  border: '#E4E2DC',
  shadow: '#C4C2BC',
  accentBlue: '#3D6FE8',
  accentViolet: '#7B5DD6',
  accentSuccess: '#28A372',
  accentWarning: '#C4831A',
  accentError: '#C43B3B',
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