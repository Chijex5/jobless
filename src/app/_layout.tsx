import { ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { buildNavigationTheme, getTheme } from '@/theme/tokens';

export default function RootLayout() {
  const appearance = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = getTheme(appearance);
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={appearance === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </ThemeProvider>
  );
}
