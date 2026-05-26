import { useColorScheme } from 'react-native';

const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const },
  title: { fontSize: 20, lineHeight: 26, fontWeight: '700' as const },
  section: { fontSize: 16, lineHeight: 22, fontWeight: '600' as const },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '500' as const },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const },
};

const radius = { sm: 10, md: 14, lg: 18, xl: 24 };

const palette = {
  dark: {
    bg: '#11161f',
    surface: '#171e2b',
    elevated: '#1d2533',
    text: '#e8edf7',
    textMuted: '#9da9bf',
    border: '#2a3448',
    accent: '#4d7dff',
    accent2: '#7a5cff',
    success: '#45d39c',
    warning: '#f7b96a',
  },
  light: {
    bg: '#f3f7ff',
    surface: '#fbfdff',
    elevated: '#f8fbff',
    text: '#152038',
    textMuted: '#63708c',
    border: '#dde4f1',
    accent: '#4d7dff',
    accent2: '#7a5cff',
    success: '#24b386',
    warning: '#e9a24b',
  },
};

export type AppTheme = {
  isDark: boolean;
  colors: (typeof palette)['dark'];
  spacing: typeof spacing;
  typography: typeof typography;
  radius: typeof radius;
};

export function useAppTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme !== 'light';
  return { isDark, colors: isDark ? palette.dark : palette.light, spacing, typography, radius };
}
