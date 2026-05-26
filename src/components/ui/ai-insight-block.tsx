import { Text, View } from 'react-native';

import type { AppTheme } from '@/theme/tokens';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';

export function AIInsightBlock({
  theme,
  title,
  summary,
  score,
}: {
  theme: AppTheme;
  title: string;
  summary: string;
  score: number;
}) {
  return (
    <Card theme={theme}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary, flex: 1 }}>{title}</Text>
        <Chip theme={theme} label={`${score}% match`} variant="violet" />
      </View>
      <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{summary}</Text>
    </Card>
  );
}

