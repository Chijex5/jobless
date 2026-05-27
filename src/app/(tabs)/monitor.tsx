import { useEffect, useMemo, useRef } from 'react';
import { Animated, ScrollView, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

const liveEvents = [
  { id: 'e1', message: 'Scanning Twitter/X for internship signals…', at: 'Now', status: 'active' },
  { id: 'e2', message: 'Detected new frontend internship opportunity', at: '12s ago', status: 'info' },
  { id: 'e3', message: 'AI extracted company: Stripe', at: '29s ago', status: 'info' },
  { id: 'e4', message: 'Ranked opportunity: 92% match', at: '46s ago', status: 'high' },
  { id: 'e5', message: 'Opportunity queued for review', at: '1m ago', status: 'active' },
  { id: 'e6', message: 'Extractor normalized 18 job post entities', at: '2m ago', status: 'info' },
  { id: 'e7', message: 'Model confidence spike in AI startup cluster', at: '4m ago', status: 'high' },
];

const pipelineStages = [
  { id: 'twitter', label: 'Twitter/X', count: '12,843', rate: '98.4%', active: true },
  { id: 'extract', label: 'Extraction', count: '1,184', rate: '96.2%', active: true },
  { id: 'analysis', label: 'AI Analysis', count: '947', rate: '93.7%', active: true },
  { id: 'ranking', label: 'Ranking', count: '812', rate: '91.9%', active: true },
  { id: 'queue', label: 'Queue', count: '274', rate: '89.5%', active: true },
  { id: 'feed', label: 'User Feed', count: '122', rate: '99.1%', active: false },
];

const alerts = [
  'High-quality internship detected.',
  'Multiple frontend roles found in last scan.',
  'AI confidence spike detected in startup postings.',
];

export default function MonitorScreen() {
  const theme = useAppTheme();
  const pulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 1100, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const eventVariant = useMemo(
    () => ({
      active: 'blue' as const,
      info: 'violet' as const,
      high: 'warning' as const,
    }),
    [],
  );

  return (
    <ScreenShell theme={theme} title="Monitor" subtitle="AI Intelligence System Status">
      <Card theme={theme} style={{ backgroundColor: theme.colors.surfaceStrong }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>System Active</Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Live observability stream connected</Text>
          </View>
          <Animated.View
            style={{
              opacity: pulse,
              width: 12,
              height: 12,
              borderRadius: theme.radius.pill,
              backgroundColor: theme.colors.accentRose,
              shadowColor: theme.colors.accentRose,
              shadowOpacity: theme.appearance === 'dark' ? 0.6 : 0.2,
              shadowRadius: 8,
            }}
          />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <OverviewCard theme={theme} title="Crawler Status" rows={[['State', 'Active'], ['Tweets scanned', '12,843'], ['Last scan', '14s ago'], ['Rate limit', 'Healthy']]} />
        <OverviewCard theme={theme} title="AI Processing" rows={[['Analyzed', '1,184'], ['Extraction success', '96.2%'], ['Classification accuracy', '93.7%']]} />
        <OverviewCard theme={theme} title="Ranking Engine" rows={[['Ranked today', '812'], ['High confidence', '204'], ['Filter efficiency', '88.9%']]} />
        <OverviewCard theme={theme} title="Database Sync" rows={[['Sync status', 'In sync'], ['Last update', '21s ago'], ['Backlog size', '17 items']]} />
      </View>

      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Pipeline Flow</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs, paddingVertical: theme.spacing.xs }}>
            {pipelineStages.map((stage, idx) => (
              <View key={stage.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    minWidth: 128,
                    borderWidth: 1,
                    borderColor: theme.colors.border,
                    backgroundColor: theme.colors.surfaceStrong,
                    borderRadius: theme.radius.sm,
                    padding: theme.spacing.xs,
                    gap: 2,
                  }}>
                  <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{stage.label}</Text>
                  <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{stage.count}</Text>
                  <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>Success {stage.rate}</Text>
                  <Chip theme={theme} label={stage.active ? 'Processing' : 'Standby'} variant={stage.active ? 'blue' : 'default'} />
                </View>
                {idx < pipelineStages.length - 1 ? (
                  <Text style={{ marginHorizontal: theme.spacing.xs, color: theme.colors.textMuted }}>→</Text>
                ) : null}
              </View>
            ))}
          </View>
        </ScrollView>
      </Card>

      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>System Health</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
          <Chip theme={theme} label="CPU 37%" variant="default" />
          <Chip theme={theme} label="Latency 184ms" variant="blue" />
          <Chip theme={theme} label="Error rate 0.3%" variant="success" />
          <Chip theme={theme} label="Uptime 12d 04h" variant="violet" />
        </View>
      </Card>

      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Live Activity Feed</Text>
        {liveEvents.map((event) => (
          <View
            key={event.id}
            style={{
              borderLeftWidth: 2,
              borderLeftColor: theme.colors.border,
              paddingLeft: theme.spacing.sm,
              paddingVertical: 2,
              gap: 4,
            }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.xs }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 }}>{event.message}</Text>
              <Chip theme={theme} label={event.status} variant={eventVariant[event.status as keyof typeof eventVariant]} />
            </View>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{event.at}</Text>
          </View>
        ))}
      </Card>

      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Intelligence Alerts</Text>
        {alerts.map((alert) => (
          <View
            key={alert}
            style={{
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.surfaceStrong,
              borderWidth: 1,
              borderColor: theme.colors.border,
              padding: theme.spacing.sm,
            }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{alert}</Text>
          </View>
        ))}
      </Card>
    </ScreenShell>
  );
}

function OverviewCard({
  theme,
  title,
  rows,
}: {
  theme: ReturnType<typeof useAppTheme>;
  title: string;
  rows: Array<[string, string]>;
}) {
  return (
    <Card theme={theme} style={{ flexBasis: '48%', flexGrow: 1 }}>
      <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{title}</Text>
      {rows.map(([key, value]) => (
        <View key={`${title}-${key}`} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.xs }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{key}</Text>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>{value}</Text>
        </View>
      ))}
    </Card>
  );
}
