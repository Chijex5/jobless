import { Tabs } from 'expo-router';
import { useAppTheme } from '@/theme/tokens';

export default function TabsLayout() {
  const theme = useAppTheme();
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, borderTopWidth: 1, height: 68, paddingTop: 8 },
        tabBarActiveTintColor: theme.colors.accent,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color }) => null,
      })}>
      <Tabs.Screen name="intelligence" options={{ title: 'Intelligence' }} />
      <Tabs.Screen name="signals" options={{ title: 'Signals' }} />
      <Tabs.Screen name="queue" options={{ title: 'Queue' }} />
      <Tabs.Screen name="monitor" options={{ title: 'Monitor' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
