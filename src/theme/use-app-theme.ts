import { useColorScheme } from 'react-native';

import { getTheme } from '@/theme/tokens';

export function useAppTheme() {
  const appearance = useColorScheme() === 'dark' ? 'dark' : 'light';
  return getTheme(appearance);
}

