import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, Text, View, ActivityIndicator } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { baseUrl } from '@/lib/backend';

const API_BASE = baseUrl;
const POLL_INTERVAL_MS = 10_000;

// ── Types ──────────────────────────────────────────────────────────────────
type AppTheme = ReturnType<typeof useAppTheme>;
type EventStatus = 'active' | 'info' | 'high' | 'error';

type PipelineEvent = {
  id: string;
  message: string;
  status: EventStatus;
  at: string;
};

type MonitorData = {
  scrapeRunning:    boolean;
  scrapePhase:      string;
  scrapeProgress:   number;
  currentSource:    string | null;
  lastRun:          string | null;
  lastSaved:        number | null;
  nextRun:          string | null;
  totalSignals:     number;
  newSignals:       number;
  savedSignals:     number;
  highMatchSignals: number;
  platformCounts:   Record<string, number>;
  notifRunning:     boolean;
  notifLastRun:     string | null;
  notifLastCount:   number | null;
  recentEvents:     PipelineEvent[];
};

// ── Helpers ────────────────────────────────────────────────────────────────
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

function fmt(iso: string | null): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60)  return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60)  return `${m}m ago`;
    const h = Math.floor(m / 60);
    return `${h}h ago`;
  } catch {
    return '';
  }
}

// ── Sub-components ─────────────────────────────────────────────────────────
function StatRow({ theme, label, value }: { theme: AppTheme; label: string; value: string }) {
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
  theme: AppTheme;
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

function LiveEvent({
  theme,
  event,
  variantMap,
}: {
  theme: AppTheme;
  event: PipelineEvent;
  variantMap: Record<EventStatus, 'blue' | 'violet' | 'warning' | 'default'>;
}) {
  return (
    <View
      style={{
        borderLeftWidth: 2,
        borderLeftColor:
          event.status === 'high' || event.status === 'error'
            ? theme.colors.accentRose
            : event.status === 'active'
              ? theme.colors.accentBlue ?? theme.colors.border
              : theme.colors.border,
        paddingLeft: theme.spacing.sm,
        paddingVertical: 4,
        gap: 3,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.xs }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 }}>
          {event.message}
        </Text>
        <Chip theme={theme} label={event.status} variant={variantMap[event.status]} />
      </View>
      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
        {relativeTime(event.at)}
      </Text>
    </View>
  );
}

// ── Platform breakdown row ─────────────────────────────────────────────────
function PlatformRow({
  theme,
  name,
  count,
  total,
}: {
  theme: AppTheme;
  name: string;
  count: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const barAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(barAnim, {
      toValue: pct / 100,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [pct]);

  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>{name}</Text>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
          {count} · {pct}%
        </Text>
      </View>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: theme.colors.border, overflow: 'hidden' }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 2,
            backgroundColor: theme.colors.accentBlue ?? theme.colors.accentRose,
            width: barAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>
    </View>
  );
}

// ── Main screen ────────────────────────────────────────────────────────────
export default function MonitorScreen() {
  const theme = useAppTheme();
  const pulse = usePulse();

  const [data, setData]         = useState<MonitorData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const variantMap = useMemo(
    (): Record<EventStatus, 'blue' | 'violet' | 'warning' | 'default'> => ({
      active: 'blue',
      info:   'violet',
      high:   'warning',
      error:  'default',
    }),
    [],
  );

  const fetchMonitor = useCallback(async (isManual = false) => {
    if (isManual) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/monitor`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: MonitorData = await res.json();
      setData(json);
      setError(false);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('Monitor fetch failed:', e);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch + poll
  useEffect(() => {
    fetchMonitor();
    pollRef.current = setInterval(() => fetchMonitor(), POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchMonitor]);

  // ── Derived display values ─────────────────────────────────────────────
  const platformEntries = useMemo(
    () => Object.entries(data?.platformCounts ?? {}).sort((a, b) => b[1] - a[1]),
    [data?.platformCounts],
  );

  const phaseLabel: Record<string, string> = {
    fetching:   'Fetching sources',
    validating: 'AI validation',
    saving:     'Saving signals',
    done:       'Complete',
    idle:       'Idle',
  };

  const systemStatus = data?.scrapeRunning
    ? 'Scraping'
    : data?.notifRunning
      ? 'Generating notifications'
      : 'Idle';

  const lastRefreshStr = lastRefresh
    ? lastRefresh.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  // ── Loading skeleton ───────────────────────────────────────────────────
  if (loading && !data) {
    return (
      <ScreenShell theme={theme} title="Monitor" subtitle="AI intelligence system status">
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
          <ActivityIndicator size="large" color={theme.colors.accentRose} />
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted, marginTop: 12 }}>
            Loading monitor…
          </Text>
        </View>
      </ScreenShell>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────
  if (error && !data) {
    return (
      <ScreenShell theme={theme} title="Monitor" subtitle="AI intelligence system status">
        <Card theme={theme}>
          <Text style={{ ...theme.typography.body, color: theme.colors.accentRose }}>
            Failed to load monitor data.
          </Text>
          <Pressable
            onPress={() => fetchMonitor(true)}
            style={({ pressed }) => ({
              marginTop: theme.spacing.sm,
              opacity: pressed ? 0.6 : 1,
              alignSelf: 'flex-start',
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.accentRose,
            })}>
            <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>Retry</Text>
          </Pressable>
        </Card>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell theme={theme} title="Monitor" subtitle="AI intelligence system status">

      {/* ── System status bar ──────────────────────────────────────────── */}
      <Card theme={theme} style={{ backgroundColor: theme.colors.surfaceStrong }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
              {systemStatus}
            </Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
              {data?.scrapeRunning
                ? `${phaseLabel[data.scrapePhase] ?? data.scrapePhase} · ${data.scrapeProgress}%`
                : `Refreshed ${lastRefreshStr} · next scrape ${fmt(data?.nextRun ?? null)}`
              }
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
            <Pressable
              onPress={() => fetchMonitor(true)}
              style={({ pressed }) => ({
                opacity: pressed || loading ? 0.5 : 1,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: 4,
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.sm,
              })}>
              <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>
                {loading ? 'Loading…' : 'Refresh'}
              </Text>
            </Pressable>
            <Animated.View
              style={{
                opacity: pulse,
                width: 11,
                height: 11,
                borderRadius: 99,
                backgroundColor: data?.scrapeRunning
                  ? theme.colors.accentRose
                  : theme.colors.textMuted,
              }}
            />
          </View>
        </View>

        {/* Progress bar — only visible while scrape is running */}
        {data?.scrapeRunning && (
          <View style={{ gap: 6, marginTop: theme.spacing.xs }}>
            <View style={{ height: 3, borderRadius: 2, backgroundColor: theme.colors.border, overflow: 'hidden' }}>
              <View
                style={{
                  height: '100%',
                  borderRadius: 2,
                  width: `${data.scrapeProgress}%`,
                  backgroundColor: theme.colors.accentRose,
                }}
              />
            </View>
            {data.currentSource && (
              <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                {data.currentSource}
              </Text>
            )}
          </View>
        )}
      </Card>

      {/* ── Pipeline state chips ───────────────────────────────────────── */}
      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Pipeline state</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, marginTop: theme.spacing.xs }}>
          <Chip
            theme={theme}
            label={data?.scrapeRunning ? `Scraper: ${phaseLabel[data.scrapePhase] ?? data.scrapePhase}` : 'Scraper: idle'}
            variant={data?.scrapeRunning ? 'blue' : 'default'}
          />
          <Chip
            theme={theme}
            label={data?.notifRunning ? 'Notifications: generating' : 'Notifications: idle'}
            variant={data?.notifRunning ? 'violet' : 'default'}
          />
          <Chip
            theme={theme}
            label={`Last saved: ${data?.lastSaved ?? 0} signals`}
            variant="default"
          />
          {data?.notifLastCount != null && (
            <Chip
              theme={theme}
              label={`${data.notifLastCount} notifications generated`}
              variant="success"
            />
          )}
        </View>
      </Card>

      {/* ── Signal overview cards ──────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Signal overview" subtitle="Counts across the pipeline" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
        <OverviewCard
          theme={theme}
          title="Feed"
          accent={theme.colors.accentRose}
          rows={[
            ['Total signals', String(data?.totalSignals ?? 0)],
            ['Unreviewed',    String(data?.newSignals    ?? 0)],
            ['Saved',         String(data?.savedSignals  ?? 0)],
            ['High match ≥80', String(data?.highMatchSignals ?? 0)],
          ]}
        />
        <OverviewCard
          theme={theme}
          title="Scraper"
          accent={theme.colors.accentBlue ?? theme.colors.border}
          rows={[
            ['State',      data?.scrapeRunning ? 'Running' : 'Idle'],
            ['Phase',      phaseLabel[data?.scrapePhase ?? 'idle'] ?? '—'],
            ['Last run',   fmt(data?.lastRun ?? null)],
            ['Next run',   fmt(data?.nextRun ?? null)],
          ]}
        />
        <OverviewCard
          theme={theme}
          title="Notifications"
          rows={[
            ['State',      data?.notifRunning ? 'Running' : 'Idle'],
            ['Last run',   fmt(data?.notifLastRun ?? null)],
            ['Generated',  String(data?.notifLastCount ?? '—')],
          ]}
        />
      </View>

      {/* ── Platform breakdown ─────────────────────────────────────────── */}
      {platformEntries.length > 0 && (
        <>
          <SectionHeader theme={theme} title="Sources" subtitle="Signals by platform" />
          <Card theme={theme}>
            <View style={{ gap: theme.spacing.sm }}>
              {platformEntries.map(([name, count]) => (
                <PlatformRow
                  key={name}
                  theme={theme}
                  name={name}
                  count={count}
                  total={data?.totalSignals ?? 0}
                />
              ))}
            </View>
          </Card>
        </>
      )}

      {/* ── Live activity feed ─────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Pipeline events" subtitle="Last 15 logged events" />
      <Card theme={theme}>
        {!data?.recentEvents || data.recentEvents.length === 0 ? (
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
            No events yet. Run a scrape to see activity here.
          </Text>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {data.recentEvents.map((event) => (
              <LiveEvent key={event.id} theme={theme} event={event} variantMap={variantMap} />
            ))}
          </View>
        )}
      </Card>

    </ScreenShell>
  );
}