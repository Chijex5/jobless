import { ThemeProvider } from '@react-navigation/native';
import { Stack, usePathname, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ArrowLeft } from 'lucide-react-native';
import { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { buildNavigationTheme, getTheme } from '@/theme/tokens';
import { useAppTheme } from '@/theme/use-app-theme';

// ─── Opportunity Header ───────────────────────────────────────────────────────

function OpportunityHeader({
  title,
  onBack,
}: {
  title?: string;
  onBack: () => void;
}) {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        gap: 4,
      }}
    >
      {/* Breadcrumb */}
      <Pressable onPress={onBack}>
        {({ pressed }) => (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, opacity: pressed ? 0.5 : 1 }}>
            <ArrowLeft size={16} color={theme.colors.textMuted} />
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: theme.colors.textMuted,
                letterSpacing: 0.1,
              }}
            >
              Intelligence
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.border, marginHorizontal: 2 }}>/</Text>
            <Text
              style={{
                fontSize: 12,
                fontWeight: '500',
                color: theme.colors.textSecondary,
              }}
              numberOfLines={1}
            >
              Opportunity
            </Text>
          </View>
        )}
      </Pressable>

      {/* Title */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          letterSpacing: -0.4,
          lineHeight: 26,
        }}
        numberOfLines={1}
      >
        {title ?? 'Opportunity'}
      </Text>
    </View>
  );
}

// ─── Root Layout ──────────────────────────────────────────────────────────────

export default function RootLayout() {
  const appearance = useColorScheme() === 'dark' ? 'dark' : 'light';
  const theme = getTheme(appearance);
  const navigationTheme = useMemo(() => buildNavigationTheme(theme), [theme]);

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={appearance === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="opportunity/[id]"
          options={({ route, navigation }) => ({
            headerShown: true,
            header: () => (
              <OpportunityHeader
                title={(route.params as any)?.title}
                onBack={() => navigation.goBack()}
              />
            ),
            animation: 'slide_from_right',
          })}
        />
      </Stack>
    </ThemeProvider>
  );
}