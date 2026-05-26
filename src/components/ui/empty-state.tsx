import { StyleSheet, Text, View } from 'react-native';

import type { AppTheme } from '@/theme/tokens';

export function EmptyState({
  theme,
  title,
  body,
}: {
  theme: AppTheme;
  title: string;
  body: string;
}) {
  return (
    <View
      style={{
        borderColor: theme.colors.border,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.lg,
        gap: theme.spacing.xs,
      }}>
      <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{title}</Text>
      <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>{body}</Text>
    </View>
  );
}
