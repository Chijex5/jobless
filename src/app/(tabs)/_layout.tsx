import { Tabs } from 'expo-router';
import { Text } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

const tabIcons: Record<string, string> = {
  index: '◎',
  signals: '◉',
  queue: '▣',
  monitor: '◈',
  settings: '⌁',
};

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          height: 74,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarActiveTintColor: theme.colors.accentBlue,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          ...theme.typography.meta,
        },
        tabBarIcon: ({ focused, color }) => (
          <Text style={{ color, fontSize: focused ? 17 : 15 }}>{tabIcons[route.name] ?? '·'}</Text>
        ),
      })}>
      <Tabs.Screen name="index" options={{ title: 'Intelligence' }} />
      <Tabs.Screen name="signals" options={{ title: 'Signals' }} />
      <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
      <Tabs.Screen name="monitor" options={{ title: 'Monitor' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

