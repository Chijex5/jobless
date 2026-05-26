import type { ReactNode } from 'react';
import { SafeAreaView, ScrollView, Text, View } from 'react-native';

import { LivePulse } from '@/components/ui';
import type { AppTheme } from '@/theme/tokens';

export function ScreenShell({
  theme,
  title,
  subtitle,
  children,
}: {
  theme: AppTheme;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <View style={{ gap: theme.spacing.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
            <LivePulse theme={theme} />
            <Text style={{ ...theme.typography.monoMeta, color: theme.colors.accentBlue }}>
              LIVE SIGNAL MATRIX
            </Text>
          </View>
          <Text style={{ ...theme.typography.h1, color: theme.colors.textPrimary }}>{title}</Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{subtitle}</Text>
        </View>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

