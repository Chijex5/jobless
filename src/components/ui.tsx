import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { createCommonStyles } from '@/theme/styles';
import { useAppTheme } from '@/theme/tokens';

export function SectionHeader({ title, right }: { title: string; right?: string }) {
  const theme = useAppTheme();
  const s = createCommonStyles(theme);
  return (
    <View style={s.sectionHeaderRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {right ? <Text style={s.meta}>{right}</Text> : null}
    </View>
  );
}

export function Card({ children }: { children: ReactNode }) {
  const s = createCommonStyles(useAppTheme());
  return <View style={s.card}>{children}</View>;
}

export function Chip({ label }: { label: string }) {
  const s = createCommonStyles(useAppTheme());
  return (
    <View style={s.chip}>
      <Text style={s.chipText}>{label}</Text>
    </View>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle: string }) {
  const theme = useAppTheme();
  const s = createCommonStyles(theme);
  return (
    <Card>
      <Text style={[s.sectionTitle, { marginBottom: theme.spacing.xs }]}>{title}</Text>
      <Text style={s.meta}>{subtitle}</Text>
    </Card>
  );
}

export function LoadingSkeleton() {
  const theme = useAppTheme();
  return (
    <View style={{ gap: theme.spacing.xs }}>
      <View style={{ height: 10, borderRadius: 6, backgroundColor: theme.colors.border, width: '45%' }} />
      <View style={{ height: 10, borderRadius: 6, backgroundColor: theme.colors.border, width: '80%' }} />
      <View style={{ height: 10, borderRadius: 6, backgroundColor: theme.colors.border, width: '60%' }} />
    </View>
  );
}
