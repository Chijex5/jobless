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
  background:      '#080C14',  // deep navy-black — not pure black, has depth
  surface:         '#0E1420',  // card surface — clearly distinct from bg
  surfaceStrong:   '#141C2E',  // elevated input / tag backgrounds
  surfaceElevated: '#1A2235',  // borders double as elevated surfaces

  textPrimary:   '#E2E8F0',  // warm white — easier on eyes than #FFF
  textSecondary: '#64748B',  // slate — readable muted text
  textMuted:     '#4A5568',  // placeholder / timestamps

  border: '#1A2235',  // tight, matches surfaceElevated
  shadow: '#000000',

  accentBlue:    '#38BDF8',  // sky-400 — electric, modern, your primary CTA
  accentViolet:  '#818CF8',  // indigo-400 — strong scores, saved state
  accentSuccess: '#34D399',  // emerald-400 — remote badge, good scores
  accentWarning: '#FBBF24',  // amber-400 — kept
  accentError:   '#F87171',  // red-400 — kept
  accentRose:    '#F472B6',  // pink-400 — excellent scores, replaces dull #d15c5c
};

const lightPalette: ThemePalette = {
  background:      '#F0F4FA',  // cool-tinted white — not flat grey
  surface:         '#FFFFFF',
  surfaceStrong:   '#EBF0F8',
  surfaceElevated: '#DDE5F2',

  textPrimary:   '#0D1117',
  textSecondary: '#3D4E6B',
  textMuted:     '#7A8CA8',

  border: '#D8E3F0',
  shadow: '#00000010',

  accentBlue:    '#0EA5E9',  // sky-500 — same family as dark mode, slightly deeper
  accentViolet:  '#6366F1',  // indigo-500
  accentSuccess: '#10B981',  // emerald-500
  accentWarning: '#F59E0B',
  accentError:   '#EF4444',
  accentRose:    '#EC4899',  // pink-500
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
    primary:      theme.colors.accentBlue,
    background:   theme.colors.background,
    card:         theme.colors.surface,
    text:         theme.colors.textPrimary,
    border:       theme.colors.border,
    notification: theme.colors.accentViolet,
  },
  fonts: {
    regular: { fontFamily: 'System', fontWeight: '400' },
    medium:  { fontFamily: 'System', fontWeight: '500' },
    bold:    { fontFamily: 'System', fontWeight: '600' },
    heavy:   { fontFamily: 'System', fontWeight: '700' },
  },
});