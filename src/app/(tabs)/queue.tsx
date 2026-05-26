import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, EmptyState, LoadingSkeleton, SectionHeader } from '@/components/ui';
import { internshipOpportunities, queueStats } from '@/data/mock';
import { useAppTheme } from '@/theme/use-app-theme';

export default function QueueScreen() {
  const theme = useAppTheme();
  const queued = internshipOpportunities.filter((item) => item.queueState !== 'applied');

  return (
    <ScreenShell
      theme={theme}
      title="Queue"
      subtitle="Prioritized action queue shaped by AI confidence and timing signals.">
      <Card theme={theme}>
        <SectionHeader theme={theme} title="Queue Balance" subtitle="Current processing state" />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          {queueStats.map((stat) => (
            <View
              key={stat.id}
              style={{
                flex: 1,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surfaceStrong,
                padding: theme.spacing.sm,
                gap: 6,
              }}>
              <Text style={{ ...theme.typography.h2, color: theme.colors.textPrimary }}>{stat.value}</Text>
              <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader theme={theme} title="Draft Preparation" subtitle="AI preparing application summaries" />
      <Card theme={theme}>
        <LoadingSkeleton theme={theme} height={16} />
        <LoadingSkeleton theme={theme} height={16} />
        <LoadingSkeleton theme={theme} height={16} />
      </Card>

      {queued.length === 0 ? (
        <EmptyState
          theme={theme}
          title="Queue is clear"
          body="No pending opportunities need action right now. New signals will auto-appear here."
        />
      ) : (
        queued.map((item) => (
          <Card key={item.id} theme={theme}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
              {item.company} · {item.role}
            </Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
              Queue status: {item.queueState}
            </Text>
            <Chip theme={theme} label={`AI score ${item.aiMatchScore}`} variant="blue" />
          </Card>
        ))
      )}
    </ScreenShell>
  );
}

