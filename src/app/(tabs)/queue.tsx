import { ScrollView } from 'react-native';
import { EmptyState, SectionHeader } from '@/components/ui';
import { createCommonStyles } from '@/theme/styles';
import { useAppTheme } from '@/theme/tokens';

export default function QueueScreen() {
  const s = createCommonStyles(useAppTheme());
  return <ScrollView style={s.screen} contentContainerStyle={s.content}><SectionHeader title="Queue" right="0 pending actions" /><EmptyState title="Application Queue" subtitle="Track shortlisted opportunities and next steps with AI-assisted prioritization." /></ScrollView>;
}
