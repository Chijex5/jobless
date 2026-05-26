import { Text, View } from 'react-native';

import type { AppTheme } from '@/theme/tokens';

export function SectionHeader({
  theme,
  title,
  subtitle,
  actionLabel,
}: {
  theme: AppTheme;
  title: string;
  subtitle?: string;
  actionLabel?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{title}</Text>
        {subtitle ? (
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>{subtitle}</Text>
        ) : null}
      </View>
      {actionLabel ? (
        <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>{actionLabel}</Text>
      ) : null}
    </View>
  );
}

