import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, EmptyState, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

export default function SettingsScreen() {
  const theme = useAppTheme();

  return (
    <ScreenShell
      theme={theme}
      title="Settings"
      subtitle="Tune intelligence behavior, notification sensitivity, and dashboard surface detail.">
      <SectionHeader theme={theme} title="System Preferences" subtitle="Operational controls" />
      <Card theme={theme}>
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Chip theme={theme} label="Theme: Auto" variant="blue" />
          <Chip theme={theme} label="Alert Level: Balanced" variant="violet" />
          <Chip theme={theme} label="Digest: Every 6h" variant="success" />
        </View>
        <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
          Signal is configured for calm monitoring with moderate alert density.
        </Text>
      </Card>

      <EmptyState
        theme={theme}
        title="Integrations pending"
        body="Linked data sources and exports will appear here once backend pipelines are enabled."
      />
    </ScreenShell>
  );
}

