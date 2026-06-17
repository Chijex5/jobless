import { Tabs } from 'expo-router';
import { Bookmark, ClipboardList, Sparkle, SlidersHorizontal } from 'lucide-react-native';
import { Platform, StyleSheet, View } from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';

const tabIcons: Record<string, React.ElementType> = {
  index: Sparkle,
  saved: Bookmark,
  queue: ClipboardList,
  settings: SlidersHorizontal,
};

const tabTitles: Record<string, string> = {
  index: 'Discover',
  saved: 'Saved',
  queue: 'Track',
  settings: 'Settings',
};

export default function TabLayout() {
  const theme = useAppTheme();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: theme.colors.border,
          height: Platform.OS === 'ios' ? 82 : 68,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingHorizontal: 4,
          elevation: 0,
        },
        tabBarActiveTintColor: theme.colors.accentBlue,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          fontFamily: theme.fontFamily.sansBold,
          letterSpacing: 0.2,
          marginTop: 3,
        },
        tabBarItemStyle: {
          paddingTop: 0,
        },
        tabBarIcon: ({ focused, color }) => {
          const Icon = tabIcons[route.name];
          if (!Icon) return null;
          return (
            <View
              style={{
                width: 44,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 999,
              }}
            >
              <Icon
                color={color}
                size={22}
                fill={focused && route.name === 'saved' ? color : 'none'}
                strokeWidth={1.7}
              />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: tabTitles.index }} />
      <Tabs.Screen name="saved" options={{ title: tabTitles.saved }} />
      <Tabs.Screen name="queue" options={{ title: tabTitles.queue }} />
      <Tabs.Screen name="settings" options={{ title: tabTitles.settings }} />
    </Tabs>
  );
}
