import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

// ── Static data ────────────────────────────────────────────────────────────
const INITIAL_EVENTS = [
  { id: 'e1', message: 'Scanning Twitter/X for internship signals…', at: 'Now', status: 'active' as const },
  { id: 'e2', message: 'Detected new frontend internship — Stripe', at: '12s ago', status: 'info' as const },
  { id: 'e3', message: 'AI extracted role: Frontend Engineer Intern', at: '29s ago', status: 'info' as const },
  { id: 'e4', message: 'Ranked opportunity: 92% match', at: '46s ago', status: 'high' as const },
  { id: 'e5', message: 'Opportunity queued for review', at: '1m ago', status: 'active' as const },
  { id: 'e6', message: 'Extractor normalised 18 job post entities', at: '2m ago', status: 'info' as const },
  { id: 'e7', message: 'Model confidence spike in AI startup cluster', at: '4m ago', status: 'high' as const },
];

const PIPELINE_STAGES = [
  { id: 'twitter', label: 'Twitter / X', count: '12,843', rate: '98.4%', active: true },
  { id: 'extract', label: 'Extraction', count: '1,184', rate: '96.2%', active: true },
  { id: 'analysis', label: 'AI Analysis', count: '947', rate: '93.7%', active: true },
  { id: 'ranking', label: 'Ranking', count: '812', rate: '91.9%', active: true },
  { id: 'queue', label: 'Queue', count: '274', rate: '89.5%', active: true },
  { id: 'feed', label: 'User Feed', count: '122', rate: '99.1%', active: false },
];

const ALERTS = [
  { id: 'a1', text: 'High-quality internship detected — Stripe Frontend (92%).' },
  { id: 'a2', text: 'Multiple frontend roles found in last scan window.' },
  { id: 'a3', text: 'AI confidence spike detected in startup postings.' },
];

// ── Helpers ────────────────────────────────────────────────────────────────
type EventStatus = 'active' | 'info' | 'high';

function usePulse() {
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
  return pulse;
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatRow({
  theme,
  label,
  value,
}: {
  theme: ReturnType<typeof useAppTheme>;
  label: string;
  value: string;
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{label}</Text>
      <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary, fontWeight: '600' }}>
        {value}
      </Text>
    </View>
  );
}

function OverviewCard({
  theme,
  title,
  rows,
  accent,
}: {
  theme: ReturnType<typeof useAppTheme>;
  title: string;
  rows: Array<[string, string]>;
  accent?: string;
}) {
  return (
    <Card
      theme={theme}
      style={{
        flexBasis: '47%',
        flexGrow: 1,
        borderLeftWidth: 2,
        borderLeftColor: accent ?? theme.colors.border,
      }}>
      <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{title}</Text>
      <View style={{ gap: 6, marginTop: 4 }}>
        {rows.map(([key, value]) => (
          <StatRow key={`${title}-${key}`} theme={theme} label={key} value={value} />
        ))}
      </View>
    </Card>
  );
}

function PipelineStage({
  theme,
  stage,
  isLast,
}: {
  theme: ReturnType<typeof useAppTheme>;
  stage: (typeof PIPELINE_STAGES)[number];
  isLast: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          minWidth: 118,
          borderWidth: 1,
          borderColor: stage.active ? theme.colors.accentRose : theme.colors.border,
          backgroundColor: theme.colors.surfaceStrong,
          borderRadius: theme.radius.sm,
          padding: theme.spacing.xs,
          gap: 3,
        }}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{stage.label}</Text>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{stage.count}</Text>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>
          ✓ {stage.rate}
        </Text>
        <Chip
          theme={theme}
          label={stage.active ? 'Processing' : 'Standby'}
          variant={stage.active ? 'blue' : 'default'}
        />
      </View>
      {!isLast && (
        <Text style={{ marginHorizontal: 6, color: theme.colors.textMuted, fontSize: 16 }}>→</Text>
      )}
    </View>
  );
}

function LiveEvent({
  theme,
  event,
  variantMap,
}: {
  theme: ReturnType<typeof useAppTheme>;
  event: (typeof INITIAL_EVENTS)[number];
  variantMap: Record<EventStatus, 'blue' | 'violet' | 'warning'>;
}) {
  return (
    <View
      style={{
        borderLeftWidth: 2,
        borderLeftColor:
          event.status === 'high'
            ? theme.colors.accentRose
            : event.status === 'active'
              ? theme.colors.accentBlue ?? theme.colors.border
              : theme.colors.border,
        paddingLeft: theme.spacing.sm,
        paddingVertical: 4,
        gap: 3,
      }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.spacing.xs,
        }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 }}>
          {event.message}
        </Text>
        <Chip theme={theme} label={event.status} variant={variantMap[event.status]} />
      </View>
      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{event.at}</Text>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function MonitorScreen() {
  const theme = useAppTheme();
  const pulse = usePulse();
  const [events, setEvents] = useState(INITIAL_EVENTS);
  const [lastRefresh, setLastRefresh] = useState('Just now');
  const [refreshing, setRefreshing] = useState(false);

  const variantMap = useMemo(
    (): Record<EventStatus, 'blue' | 'violet' | 'warning'> => ({
      active: 'blue',
      info: 'violet',
      high: 'warning',
    }),
    [],
  );

  function handleRefresh() {
    if (refreshing) return;
    setRefreshing(true);
    setTimeout(() => {
      setLastRefresh('Just now');
      setRefreshing(false);
    }, 1400);
  }

  return (
    <ScreenShell theme={theme} title="Monitor" subtitle="AI intelligence system status">

      {/* ── System status bar ──────────────────────────────────────────── */}
      <Card theme={theme} style={{ backgroundColor: theme.colors.surfaceStrong }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>System active</Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
              Live observability stream connected · refreshed {lastRefresh}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Pressable
              onPress={handleRefresh}
              style={({ pressed }) => ({
                opacity: pressed || refreshing ? 0.5 : 1,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.sm,
              })}>
              <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>
                {refreshing ? 'Refreshing…' : 'Refresh'}
              </Text>
            </Pressable>
            <Animated.View
              style={{
                opacity: pulse,
                width: 11,
                height: 11,
                borderRadius: 99,
                backgroundColor: theme.colors.accentRose,
              }}
            />
          </View>
        </View>
      </Card>

      {/* ── System health chips ────────────────────────────────────────── */}
      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>System health</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          <Chip theme={theme} label="CPU 37%" variant="default" />
          <Chip theme={theme} label="Latency 184ms" variant="blue" />
          <Chip theme={theme} label="Error rate 0.3%" variant="success" />
          <Chip theme={theme} label="Uptime 12d 04h" variant="violet" />
          <Chip theme={theme} label="Queue depth 17" variant="default" />
          <Chip theme={theme} label="DB in sync" variant="success" />
        </View>
      </Card>

      {/* ── Overview cards grid ────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Subsystem overview" subtitle="Key metrics per component" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <OverviewCard
          theme={theme}
          title="Crawler"
          accent={theme.colors.accentRose}
          rows={[
            ['State', 'Active'],
            ['Tweets scanned', '12,843'],
            ['Last scan', '14s ago'],
            ['Rate limit', 'Healthy'],
          ]}
        />
        <OverviewCard
          theme={theme}
          title="AI processing"
          accent={theme.colors.accentBlue ?? theme.colors.border}
          rows={[
            ['Analysed', '1,184'],
            ['Extraction success', '96.2%'],
            ['Classification acc.', '93.7%'],
          ]}
        />
        <OverviewCard
          theme={theme}
          title="Ranking engine"
          rows={[
            ['Ranked today', '812'],
            ['High confidence', '204'],
            ['Filter efficiency', '88.9%'],
          ]}
        />
        <OverviewCard
          theme={theme}
          title="Database sync"
          rows={[
            ['Sync status', 'In sync'],
            ['Last update', '21s ago'],
            ['Backlog size', '17 items'],
          ]}
        />
      </View>

      {/* ── Pipeline flow ──────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Pipeline flow" subtitle="Stage-by-stage throughput" />
      <Card theme={theme}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: theme.spacing.xs,
            }}>
            {PIPELINE_STAGES.map((stage, idx) => (
              <PipelineStage
                key={stage.id}
                theme={theme}
                stage={stage}
                isLast={idx === PIPELINE_STAGES.length - 1}
              />
            ))}
          </View>
        </ScrollView>
      </Card>

      {/* ── Live activity feed ─────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Live activity" subtitle="Real-time pipeline events" />
      <Card theme={theme}>
        <View style={{ gap: theme.spacing.sm }}>
          {events.map((event) => (
            <LiveEvent key={event.id} theme={theme} event={event} variantMap={variantMap} />
          ))}
        </View>
      </Card>

      {/* ── Intelligence alerts ────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Intelligence alerts" subtitle="Actionable signals" />
      <Card theme={theme}>
        <View style={{ gap: theme.spacing.sm }}>
          {ALERTS.map((alert) => (
            <View
              key={alert.id}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.spacing.sm,
                borderRadius: theme.radius.sm,
                backgroundColor: theme.colors.surfaceStrong,
                borderWidth: 1,
                borderColor: theme.colors.border,
                padding: theme.spacing.sm,
              }}>
              <Text style={{ color: theme.colors.accentRose, fontSize: 14, marginTop: 1 }}>●</Text>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 }}>
                {alert.text}
              </Text>
            </View>
          ))}
        </View>
      </Card>
    </ScreenShell>
  );
}