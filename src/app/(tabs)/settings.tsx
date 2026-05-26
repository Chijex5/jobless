import { ScrollView } from 'react-native';
import { EmptyState, SectionHeader } from '@/components/ui';
import { createCommonStyles } from '@/theme/styles';
import { useAppTheme } from '@/theme/tokens';

export default function SettingsScreen() {
  const s = createCommonStyles(useAppTheme());
  return <ScrollView style={s.screen} contentContainerStyle={s.content}><SectionHeader title="Settings" right="Preferences" /><EmptyState title="System Preferences" subtitle="Notification tuning, model presets, and ranking controls will be configurable here." /></ScrollView>;
}
