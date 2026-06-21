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

const fontFamily = {
  sans: 'HankenGrotesk_500Medium',
  sansMedium: 'HankenGrotesk_500Medium',
  sansSemiBold: 'HankenGrotesk_600SemiBold',
  sansBold: 'HankenGrotesk_700Bold',
  sansExtraBold: 'HankenGrotesk_800ExtraBold',
  mono: 'JetBrainsMono_500Medium',
  monoRegular: 'JetBrainsMono_400Regular',
};

const typography = {
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '800' as const, fontFamily: fontFamily.sansExtraBold },
  h2: { fontSize: 20, lineHeight: 26, fontWeight: '800' as const, fontFamily: fontFamily.sansExtraBold },
  h3: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, fontFamily: fontFamily.sansBold },
  body: { fontSize: 14, lineHeight: 21, fontWeight: '500' as const, fontFamily: fontFamily.sansMedium },
  meta: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, fontFamily: fontFamily.sansSemiBold },
  monoMeta: { fontSize: 11, lineHeight: 15, fontWeight: '500' as const, letterSpacing: 0.6, fontFamily: fontFamily.monoRegular },
};

const darkPalette: ThemePalette = {
  background:      '#15151A',  // near-black, slightly warm
  surface:         '#1C1C22',  // card surface
  surfaceStrong:   '#23232B',  // elevated input / tag backgrounds
  surfaceElevated: '#2A2A33',  // borders double as elevated surfaces

  textPrimary:   '#F2F2EF',
  textSecondary: '#9A9AA2',
  textMuted:     '#6B6B73',

  border: '#2A2A33',
  shadow: '#000000',

  accentBlue:    '#4F46E5',  // indigo — primary accent across the app
  accentViolet:  '#4F46E5',
  accentSuccess: '#34D399',
  accentWarning: '#FBBF24',
  accentError:   '#F87171',
  accentRose:    '#F472B6',
};

const lightPalette: ThemePalette = {
  background:      '#E7E7E3',  // warm off-white
  surface:         '#FFFFFF',
  surfaceStrong:   '#F1F1EC',
  surfaceElevated: '#EEEDFB',  // tinted indigo surface for selected chips

  textPrimary:   '#18181B',
  textSecondary: '#6B6B62',
  textMuted:     '#8A8A82',

  border: '#E4E4DD',
  shadow: '#00000010',

  accentBlue:    '#4F46E5',  // indigo — primary accent across the app
  accentViolet:  '#4F46E5',
  accentSuccess: '#10B981',
  accentWarning: '#F59E0B',
  accentError:   '#EF4444',
  accentRose:    '#EC4899',
};

export type AppTheme = {
  appearance: Appearance;
  colors: ThemePalette;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
  fontFamily: typeof fontFamily;
};

export const getTheme = (appearance: Appearance): AppTheme => ({
  appearance,
  colors: appearance === 'dark' ? darkPalette : lightPalette,
  spacing,
  radius,
  typography,
  fontFamily,
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
    regular: { fontFamily: theme.fontFamily.sansMedium, fontWeight: '500' },
    medium:  { fontFamily: theme.fontFamily.sansSemiBold, fontWeight: '600' },
    bold:    { fontFamily: theme.fontFamily.sansBold, fontWeight: '700' },
    heavy:   { fontFamily: theme.fontFamily.sansExtraBold, fontWeight: '800' },
  },
});