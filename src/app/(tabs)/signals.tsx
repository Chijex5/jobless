import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { internshipOpportunities } from '@/data/mock';
import { useAppTheme } from '@/theme/use-app-theme';

const notificationVariant = {
  new: 'blue',
  watching: 'violet',
  resolved: 'success',
} as const;

export default function SignalsScreen() {
  const theme = useAppTheme();

  return (
    <ScreenShell
      theme={theme}
      title="Signals"
      subtitle="Live internship opportunity stream with AI confidence and readiness context.">
      <SectionHeader theme={theme} title="Opportunity Stream" subtitle="Latest detected opportunities" />
      {internshipOpportunities.map((item) => (
        <Card key={item.id} theme={theme}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{item.role}</Text>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{item.company}</Text>
            </View>
            <Chip theme={theme} label={`${item.aiMatchScore}%`} variant="violet" />
          </View>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            {item.location} · {item.sourceHandle} · {item.postedAt}
          </Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{item.aiSummary}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {item.tags.map((tag) => (
              <Chip key={`${item.id}-${tag}`} theme={theme} label={tag} />
            ))}
            <Chip theme={theme} label={item.notificationState} variant={notificationVariant[item.notificationState]} />
          </View>
        </Card>
      ))}
    </ScreenShell>
  );
}

