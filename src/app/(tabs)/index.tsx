import { Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { AIInsightBlock, Card, Chip, SectionHeader } from '@/components/ui';
import { internshipOpportunities } from '@/data/mock';
import { useAppTheme } from '@/theme/use-app-theme';

export default function IntelligenceScreen() {
  const theme = useAppTheme();
  const topSignals = internshipOpportunities.slice(0, 2);

  return (
    <ScreenShell
      theme={theme}
      title="Intelligence"
      subtitle="AI-ranked internship radar sourced from real-time X/Twitter hiring signals.">
      <Card theme={theme}>
        <SectionHeader
          theme={theme}
          title="Command Snapshot"
          subtitle="Current system posture"
          actionLabel="Refresh"
        />
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
          <Chip theme={theme} label="21 active signals" variant="blue" />
          <Chip theme={theme} label="9 high confidence" variant="violet" />
          <Chip theme={theme} label="3 priority alerts" variant="warning" />
        </View>
      </Card>

      <SectionHeader theme={theme} title="AI Opportunity Insights" subtitle="Top ranked opportunities now" />
      {topSignals.map((item) => (
        <AIInsightBlock key={item.id} theme={theme} title={`${item.role} · ${item.company}`} summary={item.aiSummary} score={item.aiMatchScore} />
      ))}

      <SectionHeader theme={theme} title="High-Confidence Match" subtitle="Closest alignment detected" />
      <Card theme={theme}>
        <Text style={{ ...theme.typography.h2, color: theme.colors.textPrimary }}>
          {internshipOpportunities[0].company}
        </Text>
        <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
          {internshipOpportunities[0].role}
        </Text>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
          {internshipOpportunities[0].location}
        </Text>
      </Card>
    </ScreenShell>
  );
}

