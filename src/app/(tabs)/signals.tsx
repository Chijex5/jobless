import { ScrollView, Text } from 'react-native';
import { internshipSignals } from '@/data/mock';
import { Card, SectionHeader } from '@/components/ui';
import { createCommonStyles } from '@/theme/styles';
import { useAppTheme } from '@/theme/tokens';

export default function SignalsScreen() {
  const theme = useAppTheme();
  const s = createCommonStyles(theme);
  return <ScrollView style={s.screen} contentContainerStyle={s.content}><SectionHeader title="Signals" right={`${internshipSignals.length} active`} /><Card><Text style={{...theme.typography.body,color:theme.colors.textMuted}}>Source streams, trust weighting, and post freshness indicators will appear here.</Text></Card></ScrollView>;
}
