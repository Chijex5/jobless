import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';
import { baseUrl } from '@/lib/backend';

const API_BASE = baseUrl;

// ── Types ──────────────────────────────────────────────────────────────────────
type AppTheme = ReturnType<typeof useAppTheme>;

type RowProps = {
  theme: AppTheme;
  label: string;
  sub?: string;
  right?: React.ReactNode;
};

type ActionRowProps = RowProps & { onPress: () => void; destructive?: boolean };

/** Mirrors TelegramChannel on the backend */
type Channel = {
  id: string;
  handle: string;
  name: string;
  active: boolean;
  addedAt: string;
};

/** Shape emitted by GET /scrape/stream */
type ScrapeEvent = {
  running: boolean;
  progress: number;           // 0–100
  phase: string;              // idle | fetching | validating | saving | done
  currentSource: string | null;
  lastSaved: number | null;
  lastRun: string | null;
};

// ── Primitives ────────────────────────────────────────────────────────────────
function SettingRow({ theme, label, sub, right }: RowProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        gap: theme.spacing.sm,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>{label}</Text>
        {sub ? (
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{sub}</Text>
        ) : null}
      </View>
      {right}
    </View>
  );
}

function ActionRow({ theme, label, sub, onPress, destructive }: ActionRowProps) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: theme.colors.border }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.sm,
        opacity: pressed ? 0.6 : 1,
        gap: theme.spacing.sm,
      })}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text
          style={{
            ...theme.typography.body,
            color: destructive ? theme.colors.accentRose : theme.colors.textPrimary,
          }}>
          {label}
        </Text>
        {sub ? (
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{sub}</Text>
        ) : null}
      </View>
      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>›</Text>
    </Pressable>
  );
}

function Divider({ theme }: { theme: AppTheme }) {
  return (
    <View style={{ height: 0.5, backgroundColor: theme.colors.border, marginVertical: 2 }} />
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ScrapeProgressBar({
  theme,
  progress,
  phase,
  currentSource,
}: {
  theme: AppTheme;
  progress: number;
  phase: string;
  currentSource: string | null;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress / 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const phaseLabel: Record<string, string> = {
    fetching:   'Fetching sources',
    validating: 'AI validation',
    saving:     'Saving to DB',
    done:       'Complete',
    idle:       '',
  };

  const barColor =
    progress === 100
      ? theme.colors.accentRose
      : phase === 'validating'
        ? theme.colors.accentViolet ?? theme.colors.accentBlue
        : theme.colors.accentBlue;

  return (
    <View style={{ gap: 8 }}>
      {/* Track */}
      <View
        style={{
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.colors.border,
          overflow: 'hidden',
        }}>
        <Animated.View
          style={{
            height: '100%',
            borderRadius: 2,
            backgroundColor: barColor,
            width: anim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
          }}
        />
      </View>

      {/* Labels row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text
          style={{ ...theme.typography.meta, color: theme.colors.textMuted }}
          numberOfLines={1}>
          {currentSource ?? phaseLabel[phase] ?? phase}
        </Text>
        <Text
          style={{
            ...theme.typography.meta,
            color: barColor,
            fontWeight: '600',
            fontSize: 11,
          }}>
          {progress}%
        </Text>
      </View>
    </View>
  );
}

// ── Channel Badge ─────────────────────────────────────────────────────────────
function ChannelBadge({
  theme,
  channel,
  onToggle,
  onRemove,
  isLoading,
}: {
  theme: AppTheme;
  channel: Channel;
  onToggle: () => void;
  onRemove: () => void;
  isLoading?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: channel.active ? theme.colors.border : `${theme.colors.border}66`,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.sm,
        gap: theme.spacing.sm,
        backgroundColor: channel.active ? undefined : theme.colors.surfaceStrong,
        opacity: isLoading ? 0.5 : 1,
      }}>
      {/* Status dot */}
      <View
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          backgroundColor: channel.active
            ? theme.colors.accentRose
            : theme.colors.textMuted,
        }}
      />

      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>
          {channel.name}
        </Text>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
          @{channel.handle}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.textMuted} />
      ) : (
        <Switch
          value={channel.active}
          onValueChange={onToggle}
          trackColor={{
            false: theme.colors.border,
            true: theme.colors.accentBlue ?? theme.colors.accentRose,
          }}
          thumbColor={theme.colors.textPrimary}
        />
      )}

      <Pressable onPress={onRemove} disabled={isLoading} hitSlop={8}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.accentRose }}>
          Remove
        </Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
const SCRAPE_INTERVALS = ['Every 15m', 'Every 30m', 'Every 1h', 'Every 6h', 'Manual only'];
const MATCH_THRESHOLDS = ['60%', '70%', '80%', '90%', '95%'];
const DIGEST_OPTS = ['Off', 'Every 1h', 'Every 6h', 'Daily'];

export default function SettingsScreen() {
  const theme = useAppTheme();

  // ── Scraping controls ──────────────────────────────────────────────────────
  const [scrapeInterval, setScrapeInterval] = useState('Every 30m');
  const [scraping, setScraping] = useState(true);

  // ── Scrape progress (polled) ───────────────────────────────────────────────
  const [scrapeEvent, setScrapeEvent] = useState<ScrapeEvent>({
    running: false,
    progress: 0,
    phase: 'idle',
    currentSource: null,
    lastSaved: null,
    lastRun: null,
  });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Telegram channels (API-backed) ────────────────────────────────────────
  const [channels, setChannels]     = useState<Channel[]>([]);
  const [chLoading, setChLoading]   = useState(false);       // initial fetch
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set()); // per-item
  const [newHandle, setNewHandle]   = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError]     = useState('');

  // ── Sources ────────────────────────────────────────────────────────────────
  const [twitterEnabled, setTwitterEnabled]   = useState(true);
  const [linkedinEnabled, setLinkedinEnabled] = useState(false);

  // ── AI & ranking ──────────────────────────────────────────────────────────
  const [matchThreshold, setMatchThreshold]       = useState('80%');
  const [aiClassification, setAiClassification]   = useState(true);
  const [deduplication, setDeduplication]         = useState(true);
  const [remoteOnly, setRemoteOnly]               = useState(false);

  // ── Notifications ─────────────────────────────────────────────────────────
  const [pushEnabled, setPushEnabled]             = useState(true);
  const [digestFreq, setDigestFreq]               = useState('Every 6h');
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);

  // ── Appearance ────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(theme.appearance === 'dark');

  // ── Fetch channels on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchChannels();
  }, []);

  async function fetchChannels() {
    setChLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/channels`);
      const data = await res.json();
      setChannels(data);
    } catch (e) {
      console.error('Failed to load channels', e);
    } finally {
      setChLoading(false);
    }
  }

  // ── Poll /scrape/status every 1.5 s while scrape is running ──────────────
  function startPolling() {
    stopPolling();
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API_BASE}/scrape/status`);
        const data = await res.json();
        const event: ScrapeEvent = {
          running:       data.running       ?? false,
          progress:      data.progress      ?? 0,
          phase:         data.phase         ?? 'idle',
          currentSource: data.currentSource ?? null,
          lastSaved:     data.lastSaved     ?? null,
          lastRun:       data.lastRun       ?? null,
        };
        setScrapeEvent(event);
        // Stop polling 1.5 s after the job finishes
        if (!event.running) {
          setTimeout(stopPolling, 1500);
        }
      } catch {
        // network hiccup — keep polling
      }
    }, 1500);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  useEffect(() => {
    return () => stopPolling();
  }, []);

  // ── Force scrape ──────────────────────────────────────────────────────────
  async function handleForceScrape() {
    if (scrapeEvent.running) return;
    setScrapeEvent((p) => ({ ...p, running: true, progress: 0, phase: 'fetching', currentSource: 'Starting…' }));
    startPolling();
    try {
      await fetch(`${API_BASE}/scrape/run`, { method: 'POST' });
    } catch (e) {
      console.error('Scrape trigger failed', e);
      setScrapeEvent((p) => ({ ...p, running: false, phase: 'idle' }));
    }
  }

  // ── Add channel ───────────────────────────────────────────────────────────
  async function addChannel() {
    const handle = newHandle.trim().replace(/^@/, '');
    if (!handle) return;
    setAddLoading(true);
    setAddError('');
    try {
      const res = await fetch(`${API_BASE}/channels`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle }),
      });
      if (res.status === 409) {
        setAddError(`@${handle} is already added`);
        return;
      }
      if (!res.ok) {
        setAddError('Failed to add channel');
        return;
      }
      const ch: Channel = await res.json();
      setChannels((p) => [...p, ch]);
      setNewHandle('');
    } catch {
      setAddError('Network error');
    } finally {
      setAddLoading(false);
    }
  }

  // ── Toggle channel active ─────────────────────────────────────────────────
  async function toggleChannel(ch: Channel) {
    setLoadingIds((s) => new Set(s).add(ch.id));
    // Optimistic update
    setChannels((p) => p.map((c) => (c.id === ch.id ? { ...c, active: !c.active } : c)));
    try {
      const res = await fetch(`${API_BASE}/channels/${ch.handle}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !ch.active }),
      });
      if (!res.ok) throw new Error();
      const updated: Channel = await res.json();
      setChannels((p) => p.map((c) => (c.id === ch.id ? updated : c)));
    } catch {
      // Revert optimistic
      setChannels((p) => p.map((c) => (c.id === ch.id ? ch : c)));
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(ch.id); return n; });
    }
  }

  // ── Remove channel ────────────────────────────────────────────────────────
  async function removeChannel(ch: Channel) {
    setLoadingIds((s) => new Set(s).add(ch.id));
    // Optimistic remove
    setChannels((p) => p.filter((c) => c.id !== ch.id));
    try {
      const res = await fetch(`${API_BASE}/channels/${ch.handle}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
    } catch {
      // Revert
      setChannels((p) => [...p, ch].sort((a, b) => a.addedAt.localeCompare(b.addedAt)));
    } finally {
      setLoadingIds((s) => { const n = new Set(s); n.delete(ch.id); return n; });
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────
  const isRunning      = scrapeEvent.running;
  const activeCount    = channels.filter((c) => c.active).length;
  const showProgress   = isRunning || scrapeEvent.phase === 'done';

  return (
    <ScreenShell
      theme={theme}
      title="Settings"
      subtitle="Intelligence behavior, data sources, and pipeline controls">

      {/* ── Force Scrape ─────────────────────────────────────────────────── */}
      <Card theme={theme} style={{ backgroundColor: theme.colors.surfaceStrong }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: theme.spacing.sm,
          }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
              {isRunning ? 'Scraping now…' : 'Force scrape'}
            </Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
              {isRunning
                ? scrapeEvent.currentSource ?? 'Running pipeline…'
                : scrapeEvent.lastRun
                  ? `Last run: ${new Date(scrapeEvent.lastRun).toLocaleTimeString()}`
                  : 'Trigger a full intelligence pass immediately'}
            </Text>
          </View>
          <Pressable
            onPress={handleForceScrape}
            disabled={isRunning}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              backgroundColor: isRunning ? theme.colors.border : theme.colors.accentRose,
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>
              {isRunning ? 'Running' : 'Run now'}
            </Text>
          </Pressable>
        </View>

        {/* Live progress bar */}
        {showProgress && (
          <ScrapeProgressBar
            theme={theme}
            progress={scrapeEvent.progress}
            phase={scrapeEvent.phase}
            currentSource={isRunning ? scrapeEvent.currentSource : null}
          />
        )}

        {/* Phase chips */}
        {isRunning && (
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap' }}>
            <Chip
              theme={theme}
              label={scrapeEvent.phase === 'fetching' ? 'Crawler active' : 'Crawler done'}
              variant={scrapeEvent.phase === 'fetching' ? 'blue' : 'default'}
            />
            <Chip
              theme={theme}
              label={scrapeEvent.phase === 'validating' ? 'AI extracting…' : 'AI ready'}
              variant={scrapeEvent.phase === 'validating' ? 'violet' : 'default'}
            />
            <Chip
              theme={theme}
              label={
                scrapeEvent.lastSaved != null
                  ? `${scrapeEvent.lastSaved} saved`
                  : 'Ranking queued'
              }
              variant={scrapeEvent.phase === 'saving' ? 'blue' : 'default'}
            />
          </View>
        )}

        {/* Done summary */}
        {!isRunning && scrapeEvent.phase === 'done' && scrapeEvent.lastSaved != null && (
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            ✓ Saved {scrapeEvent.lastSaved} new signal{scrapeEvent.lastSaved !== 1 ? 's' : ''} in this pass
          </Text>
        )}
      </Card>

      {/* ── Scraping schedule ─────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Scraping schedule" subtitle="Crawler cadence" />
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="Crawler enabled"
          sub="Pause to stop all background scraping"
          right={
            <Switch
              value={scraping}
              onValueChange={setScraping}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <View style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            Scan interval
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {SCRAPE_INTERVALS.map((opt) => (
              <Pressable key={opt} onPress={() => setScrapeInterval(opt)}>
                <Chip
                  theme={theme}
                  label={opt}
                  variant={scrapeInterval === opt ? 'blue' : 'default'}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      {/* ── Data sources ──────────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Data sources" subtitle="Where to scrape from" />
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="Twitter / X"
          sub="Scan tweets, threads, and job posts"
          right={
            <Switch
              value={twitterEnabled}
              onValueChange={setTwitterEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="LinkedIn"
          sub="Requires OAuth connection"
          right={
            <Switch
              value={linkedinEnabled}
              onValueChange={setLinkedinEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        {!linkedinEnabled && (
          <Text
            style={{
              ...theme.typography.meta,
              color: theme.colors.textMuted,
              paddingBottom: theme.spacing.xs,
            }}>
            Tap to connect your LinkedIn account and enable this source.
          </Text>
        )}
      </Card>

      {/* ── Telegram channels ─────────────────────────────────────────────── */}
      <SectionHeader
        theme={theme}
        title="Telegram channels"
        subtitle={
          chLoading
            ? 'Loading…'
            : `${activeCount} of ${channels.length} active`
        }
      />
      <Card theme={theme}>
        {chLoading ? (
          <View style={{ paddingVertical: theme.spacing.md, alignItems: 'center' }}>
            <ActivityIndicator size="small" color={theme.colors.textMuted} />
          </View>
        ) : channels.length === 0 ? (
          <Text
            style={{
              ...theme.typography.body,
              color: theme.colors.textMuted,
              paddingVertical: theme.spacing.xs,
            }}>
            No Telegram sources yet. Add a public channel below.
          </Text>
        ) : (
          <View style={{ gap: theme.spacing.sm }}>
            {channels.map((ch) => (
              <ChannelBadge
                key={ch.id}
                theme={theme}
                channel={ch}
                onToggle={() => toggleChannel(ch)}
                onRemove={() => removeChannel(ch)}
                isLoading={loadingIds.has(ch.id)}
              />
            ))}
          </View>
        )}

        {/* Add channel row */}
        <View
          style={{
            flexDirection: 'row',
            gap: theme.spacing.sm,
            marginTop: theme.spacing.md,
          }}>
          <TextInput
            value={newHandle}
            onChangeText={(t) => { setNewHandle(t); setAddError(''); }}
            placeholder="@channelname or handle"
            placeholderTextColor={theme.colors.textMuted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: addError ? theme.colors.accentRose : theme.colors.border,
              borderRadius: theme.radius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              ...theme.typography.body,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.surfaceStrong,
            }}
            autoCapitalize="none"
            autoCorrect={false}
            onSubmitEditing={addChannel}
          />
          <Pressable
            onPress={addChannel}
            disabled={addLoading || !newHandle.trim()}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              backgroundColor:
                addLoading || !newHandle.trim()
                  ? theme.colors.border
                  : theme.colors.accentRose,
              opacity: pressed ? 0.7 : 1,
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            })}>
            {addLoading && <ActivityIndicator size="small" color="#fff" />}
            <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>
              Add
            </Text>
          </Pressable>
        </View>

        {/* Inline error */}
        {addError ? (
          <Text
            style={{
              ...theme.typography.meta,
              color: theme.colors.accentRose,
              marginTop: 4,
            }}>
            {addError}
          </Text>
        ) : null}
      </Card>

      {/* ── AI & Ranking ──────────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="AI & ranking" subtitle="Model behaviour and filters" />
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="AI classification"
          sub="Enable ML-based entity extraction and tagging"
          right={
            <Switch
              value={aiClassification}
              onValueChange={setAiClassification}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="Deduplication"
          sub="Collapse duplicate opportunities automatically"
          right={
            <Switch
              value={deduplication}
              onValueChange={setDeduplication}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="Remote only"
          sub="Hide on-site and hybrid roles from feed"
          right={
            <Switch
              value={remoteOnly}
              onValueChange={setRemoteOnly}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <View style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            Minimum match threshold
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {MATCH_THRESHOLDS.map((opt) => (
              <Pressable key={opt} onPress={() => setMatchThreshold(opt)}>
                <Chip
                  theme={theme}
                  label={opt}
                  variant={matchThreshold === opt ? 'violet' : 'default'}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Notifications" subtitle="Alerts and digest timing" />
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="Push notifications"
          sub="Receive alerts for high-confidence matches"
          right={
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="High-confidence alerts only"
          sub="Only notify for ≥ 90% match scores"
          right={
            <Switch
              value={highConfidenceOnly}
              onValueChange={setHighConfidenceOnly}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
        <Divider theme={theme} />
        <View style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            Digest frequency
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {DIGEST_OPTS.map((opt) => (
              <Pressable key={opt} onPress={() => setDigestFreq(opt)}>
                <Chip
                  theme={theme}
                  label={opt}
                  variant={digestFreq === opt ? 'success' : 'default'}
                />
              </Pressable>
            ))}
          </View>
        </View>
      </Card>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Appearance" subtitle="Display preferences" />
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="Dark mode"
          sub="Override system theme"
          right={
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: theme.colors.border, true: theme.colors.accentRose }}
              thumbColor={theme.colors.textPrimary}
            />
          }
        />
      </Card>

      {/* ── Danger zone ───────────────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Data & account" subtitle="Irreversible actions" />
      <Card theme={theme}>
        <ActionRow
          theme={theme}
          label="Clear opportunity cache"
          sub="Wipes locally stored ranked opportunities"
          onPress={() => {}}
          destructive
        />
        <Divider theme={theme} />
        <ActionRow
          theme={theme}
          label="Reset all settings"
          sub="Restore pipeline defaults"
          onPress={() => {}}
          destructive
        />
        <Divider theme={theme} />
        <ActionRow
          theme={theme}
          label="Export my data"
          sub="Download a JSON dump of all collected data"
          onPress={() => {}}
        />
      </Card>
    </ScreenShell>
  );
}