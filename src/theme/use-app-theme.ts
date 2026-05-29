import { useColorScheme } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import { getTheme } from '@/theme/tokens';

export function useAppTheme() {
  const system = useColorScheme();

  const {
    overrideSystemTheme,
    themeMode,
  } = useThemeStore();

  const appearance =
    overrideSystemTheme
      ? themeMode
      : system === 'dark'
        ? 'dark'
        : 'light';

  return getTheme(appearance);
}