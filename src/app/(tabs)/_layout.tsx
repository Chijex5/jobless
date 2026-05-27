import { Tabs } from 'expo-router';
import { Lightbulb, Monitor, List, RadioTower, Settings } from 'lucide-react-native';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppTheme } from '@/theme/use-app-theme';
import { LivePulse } from '@/components/ui';

const tabIcons: Record<string, React.ElementType> = {
  index: Lightbulb,
  signals: RadioTower,
  queue: List,
  monitor: Monitor,
  settings: Settings,
};

const tabTitles: Record<string, string> = {
  index: 'Intel',
  signals: 'Signals',
  queue: 'Queue',
  monitor: 'Monitor',
  settings: 'Settings',
};

const screenHeaders: Record<string, (theme: any, insets: any) => React.ReactNode> = {
  index: (theme, insets) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 16,
        gap: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontSize: 26,
            fontWeight: '700',
            color: theme.colors.textPrimary,
            letterSpacing: -0.8,
          }}
        >
          Intelligence
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 5,
            backgroundColor: theme.colors.surfaceStrong,
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        >
          <LivePulse theme={theme} />
          <Text
            style={{
              fontSize: 10,
              fontWeight: '600',
              letterSpacing: 0.6,
              color: theme.colors.textMuted,
            }}
          >
            Live
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
        AI confidence continuously recalculated · Source fidelity ranked
      </Text>
    </View>
  ),

  signals: (theme, insets) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          letterSpacing: -0.8,
        }}
      >
        Signals
      </Text>
    </View>
  ),

  queue: (theme, insets) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          letterSpacing: -0.8,
        }}
      >
        Queue
      </Text>
    </View>
  ),

  monitor: (theme, insets) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          letterSpacing: -0.8,
        }}
      >
        Monitor
      </Text>
    </View>
  ),

  settings: (theme, insets) => (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        paddingTop: insets.top + 8,
        paddingBottom: 14,
        paddingHorizontal: 16,
      }}
    >
      <Text
        style={{
          fontSize: 26,
          fontWeight: '700',
          color: theme.colors.textPrimary,
          letterSpacing: -0.8,
        }}
      >
        Settings
      </Text>
    </View>
  ),
};

export default function TabLayout() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: true,
        header: () => {
          const builder = screenHeaders[route.name];
          return builder ? builder(theme, insets) : null;
        },
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
        tabBarActiveTintColor: theme.colors.textPrimary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
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
                backgroundColor: focused
                  ? theme.colors.surfaceElevated
                  : 'transparent',
              }}
            >
              <Icon
                color={color}
                size={18}
                strokeWidth={focused ? 2 : 1.6}
              />
            </View>
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: tabTitles.index }} />
      <Tabs.Screen name="signals" options={{ title: tabTitles.signals }} />
      <Tabs.Screen name="queue" options={{ title: tabTitles.queue }} />
      <Tabs.Screen name="monitor" options={{ title: tabTitles.monitor }} />
      <Tabs.Screen name="settings" options={{ title: tabTitles.settings }} />
    </Tabs>
  );
}