import { ScrollView, Text } from 'react-native';
import { Card, SectionHeader } from '@/components/ui';
import { createCommonStyles } from '@/theme/styles';
import { useAppTheme } from '@/theme/tokens';

export default function MonitorScreen() {
  const theme = useAppTheme();
  const s = createCommonStyles(theme);
  return <ScrollView style={s.screen} contentContainerStyle={s.content}><SectionHeader title="Monitor" right="System calm" /><Card><Text style={{...theme.typography.body,color:theme.colors.textMuted}}>Pulse views, noise suppression, and ranking drift monitoring live here.</Text></Card></ScrollView>;
}
