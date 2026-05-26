import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { monitorFeed } from '@/data/mock';
import { useAppTheme } from '@/theme/use-app-theme';

const severityChip = {
  high: 'warning',
  medium: 'violet',
  low: 'success',
} as const;

export default function MonitorScreen() {
  const theme = useAppTheme();

  return (
    <ScreenShell
      theme={theme}
      title="Monitor"
      subtitle="Continuous AI market watch for internship velocity, trend shifts, and timing alerts.">
      <SectionHeader theme={theme} title="System Watch Feed" subtitle="Signal intelligence events" />
      {monitorFeed.map((event) => (
        <Card key={event.id} theme={theme}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary, flex: 1 }}>{event.title}</Text>
            <Chip theme={theme} label={event.severity} variant={severityChip[event.severity]} />
          </View>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{event.detail}</Text>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{event.timestamp}</Text>
        </Card>
      ))}
    </ScreenShell>
  );
}

