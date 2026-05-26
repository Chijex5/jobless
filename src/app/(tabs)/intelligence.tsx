import { ScrollView, Text, View } from 'react-native';
import { internshipSignals } from '@/data/mock';
import { Card, Chip, LoadingSkeleton, SectionHeader } from '@/components/ui';
import { createCommonStyles } from '@/theme/styles';
import { useAppTheme } from '@/theme/tokens';

export default function IntelligenceScreen() {
  const theme = useAppTheme();
  const s = createCommonStyles(theme);
  return (
    <ScrollView style={s.screen} contentContainerStyle={s.content}>
      <SectionHeader title="Signal Intelligence" right="Live AI sweep" />
      <Card>
        <Text style={{ ...theme.typography.display, color: theme.colors.text }}>Opportunity Radar</Text>
        <Text style={[s.meta, { marginTop: theme.spacing.xs }]}>AI-ranked internship opportunities from trusted X signals.</Text>
      </Card>
      {internshipSignals.map((item) => (
        <Card key={item.id}>
          <SectionHeader title={item.company} right={`${item.aiMatchScore}% match`} />
          <Text style={{ ...theme.typography.section, color: theme.colors.text }}>{item.role}</Text>
          <Text style={[s.meta, { marginVertical: theme.spacing.xs }]}>{item.location} • {item.postedAt} • {item.postSource}</Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>{item.aiSummary}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: theme.spacing.sm }}>
            {item.skillTags.map((tag) => <Chip key={tag} label={tag} />)}
          </View>
        </Card>
      ))}
      <Card><LoadingSkeleton /></Card>
    </ScrollView>
  );
}
