import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Check, Plus, Radio, Globe, Link } from 'lucide-react-native';

import { useThemeStore } from '@/store/theme-store';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, LoadingSkeleton, SectionHeader } from '@/components/ui';
import { TelegramRenewalModal } from '@/components/telegram-renewal-modal';
import { useAppTheme } from '@/theme/use-app-theme';
import { api, baseUrl } from '@/lib/backend';
import { loadSettings, saveSettings } from '@/lib/storage/settings';
import { loadAdminToken, saveAdminToken } from '@/lib/storage/admin-token';

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

/** Lightweight slice of the data GET /monitor exposes — just enough for the
 *  "Scanning live" status card. The full event log / platform breakdown that
 *  used to live on the standalone Monitor tab was intentionally left out. */
type MonitorSummary = {
  totalSignals: number;
  newSignals: number;
  nextRun: string | null;
};

/** Shape emitted by GET /health on the backend */
type DepStatus = 'ok' | 'degraded' | 'down';

type DepResult = {
  status: DepStatus;
  latency_ms: number;
  detail?: string | null;
};

type SchedulerJob = {
  id: string;
  next_run: string | null;
  running: boolean;
};

type HealthResponse = {
  status: DepStatus;
  version: string;
  timestamp: string;
  db_name: string;
  gemini_keys: number;
  dependencies: {
    mongodb: DepResult;
    gemini: DepResult;
    telegram: DepResult;
  };
  scheduler: {
    daily_scrape: SchedulerJob;
    weekly_notifications: SchedulerJob;
  };
};

// ── Primitives ────────────────────────────────────────────────────────────────
function SectionLabel({ theme, label }: { theme: AppTheme; label: string }) {
  return (
    <Text
      style={{
        ...theme.typography.monoMeta,
        color: theme.colors.textMuted,
        textTransform: 'uppercase',
        paddingHorizontal: 4,
      }}>
      {label}
    </Text>
  );
}

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
            color: destructive ? theme.colors.accentError : theme.colors.textPrimary,
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

/** Indigo pill toggle — restyles the platform Switch with the new "filled
 *  indigo track when on, gray track when off" look, without changing any of
 *  the on-toggle handlers that already drive real state/API calls. */
function PillSwitch({
  theme,
  value,
  onValueChange,
  disabled,
}: {
  theme: AppTheme;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: theme.colors.border, true: theme.colors.accentBlue }}
      thumbColor="#FFFFFF"
      ios_backgroundColor={theme.colors.border}
    />
  );
}

/** Small rounded icon square used in front of source/channel rows. */
function IconSquare({
  theme,
  children,
}: {
  theme: AppTheme;
  children: React.ReactNode;
}) {
  return (
    <View
      style={{
        width: 36,
        height: 36,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceElevated,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      {children}
    </View>
  );
}

/** Chip-style multi-select option for the "Your taste" preference rows.
 *  Selected = indigo-tinted bg + indigo border + check + indigo text.
 *  Unselected = white/surface bg + thin gray border + gray text. */
function SelectChip({
  theme,
  label,
  selected,
  onPress,
}: {
  theme: AppTheme;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: theme.spacing.sm,
        paddingVertical: 8,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor: selected ? theme.colors.accentBlue : theme.colors.border,
        backgroundColor: selected ? theme.colors.surfaceElevated : theme.colors.surface,
        opacity: pressed ? 0.7 : 1,
      })}>
      {selected ? <Check size={13} color={theme.colors.accentBlue} strokeWidth={2.5} /> : null}
      <Text
        style={{
          ...theme.typography.meta,
          color: selected ? theme.colors.accentBlue : theme.colors.textSecondary,
        }}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── Scanning-live status card (folded in from the removed Monitor tab) ────────
function ScanningLiveCard({
  theme,
  scrapeEvent,
  monitor,
}: {
  theme: AppTheme;
  scrapeEvent: ScrapeEvent;
  monitor: MonitorSummary | null;
}) {
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

  const isRunning = scrapeEvent.running;

  const minutesAgo = scrapeEvent.lastRun
    ? Math.max(0, Math.floor((Date.now() - new Date(scrapeEvent.lastRun).getTime()) / 60000))
    : null;

  const subtitle = isRunning
    ? scrapeEvent.currentSource ?? 'Running pipeline…'
    : minutesAgo != null
      ? `Last scan ${minutesAgo}m ago · ${monitor?.totalSignals ?? 0} jobs · ${monitor?.newSignals ?? 0} new`
      : 'No scans yet';

  return (
    <Card theme={theme} style={{ borderRadius: theme.radius.lg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm }}>
        <Animated.View
          style={{
            opacity: pulse,
            width: 10,
            height: 10,
            borderRadius: 99,
            backgroundColor: isRunning ? theme.colors.accentBlue : theme.colors.textMuted,
          }}
        />
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
          {isRunning ? 'Scanning live' : 'Idle'}
        </Text>
      </View>
      <Text
        style={{
          ...theme.typography.monoMeta,
          color: theme.colors.textMuted,
          marginTop: 2,
        }}>
        {subtitle}
      </Text>
    </Card>
  );
}

// ── Backend health board ───────────────────────────────────────────────────────
function statusColor(theme: AppTheme, status: DepStatus): string {
  switch (status) {
    case 'ok':
      return theme.colors.accentSuccess;
    case 'degraded':
      return theme.colors.accentWarning;
    case 'down':
      return theme.colors.accentError;
  }
}

function DependencyRow({ theme, label, dep }: { theme: AppTheme; label: string; dep: DepResult }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: statusColor(theme, dep.status),
          }}
        />
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>{label}</Text>
      </View>
      <Text style={{ ...theme.typography.monoMeta, color: theme.colors.textMuted }}>
        {dep.status} · {dep.latency_ms}ms
      </Text>
    </View>
  );
}

function SchedulerRow({ theme, label, job }: { theme: AppTheme; label: string; job: SchedulerJob }) {
  const nextRun = job.next_run ? new Date(job.next_run).toLocaleString() : 'Not scheduled';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.spacing.xs,
      }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: job.running ? theme.colors.accentBlue : theme.colors.textMuted,
          }}
        />
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>{label}</Text>
      </View>
      <Text style={{ ...theme.typography.monoMeta, color: theme.colors.textMuted }} numberOfLines={1}>
        {job.running ? 'Running' : nextRun}
      </Text>
    </View>
  );
}

function HealthBoardCard({
  theme,
  health,
  isLoading,
  error,
  onRetry,
  onRenewTelegram,
}: {
  theme: AppTheme;
  health: HealthResponse | null;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onRenewTelegram: () => void;
}) {
  if (isLoading && !health) {
    return (
      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Backend health</Text>
        <LoadingSkeleton theme={theme} height={16} />
        <LoadingSkeleton theme={theme} height={16} />
        <LoadingSkeleton theme={theme} height={16} />
      </Card>
    );
  }

  if (error && !health) {
    return (
      <Card theme={theme}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Backend health</Text>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{error}</Text>
        <Pressable onPress={onRetry}>
          <Text style={{ ...theme.typography.body, color: theme.colors.accentBlue, fontWeight: '600' }}>
            Retry
          </Text>
        </Pressable>
      </Card>
    );
  }

  if (!health) return null;

  const telegramNeedsAttention = health.dependencies.telegram.status !== 'ok';

  return (
    <Card theme={theme}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Backend health</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: statusColor(theme, health.status),
            }}
          />
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            {health.status} · v{health.version}
          </Text>
        </View>
      </View>

      <Divider theme={theme} />
      <DependencyRow theme={theme} label="MongoDB" dep={health.dependencies.mongodb} />
      <DependencyRow theme={theme} label="Gemini" dep={health.dependencies.gemini} />
      <DependencyRow theme={theme} label="Telegram" dep={health.dependencies.telegram} />

      <Divider theme={theme} />
      <SchedulerRow theme={theme} label="Daily scrape" job={health.scheduler.daily_scrape} />
      <SchedulerRow theme={theme} label="Weekly notifications" job={health.scheduler.weekly_notifications} />

      {telegramNeedsAttention && (
        <Pressable
          onPress={onRenewTelegram}
          style={({ pressed }) => ({
            marginTop: theme.spacing.xs,
            borderRadius: theme.radius.sm,
            paddingVertical: theme.spacing.sm,
            alignItems: 'center',
            backgroundColor: statusColor(theme, health.dependencies.telegram.status),
            opacity: pressed ? 0.8 : 1,
          })}>
          <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>
            Renew Telegram session
          </Text>
        </Pressable>
      )}
    </Card>
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
      ? theme.colors.accentSuccess
      : phase === 'validating'
        ? theme.colors.accentViolet
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

// ── Channel row (restyled: icon-square + name/subtitle + indigo pill switch) ──
function ChannelRow({
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
        gap: theme.spacing.sm,
        opacity: isLoading ? 0.5 : 1,
      }}>
      <IconSquare theme={theme}>
        <Radio size={17} color={theme.colors.accentBlue} strokeWidth={2} />
      </IconSquare>

      <View style={{ flex: 1, gap: 1 }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>
          {channel.name}
        </Text>
        <Text style={{ ...theme.typography.monoMeta, color: theme.colors.textMuted }}>
          @{channel.handle}
        </Text>
      </View>

      {isLoading ? (
        <ActivityIndicator size="small" color={theme.colors.textMuted} />
      ) : (
        <PillSwitch theme={theme} value={channel.active} onValueChange={onToggle} />
      )}

      <Pressable onPress={onRemove} disabled={isLoading} hitSlop={8}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.accentError }}>
          Remove
        </Text>
      </Pressable>
    </View>
  );
}

// ── Admin token entry (small modal, mirrors SortSheet's bottom-sheet pattern) ──
function AdminTokenModal({
  visible,
  onClose,
  theme,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  theme: AppTheme;
  onSave: (token: string) => void;
}) {
  const [value, setValue] = useState('');

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
        onPress={onClose}>
        <Pressable>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderBottomWidth: 0,
              borderColor: theme.colors.border,
              padding: theme.spacing.lg,
              paddingBottom: 40,
              gap: theme.spacing.sm,
            }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Admin token</Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
              Required to renew the Telegram session. Stored securely on this device.
            </Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="x-admin-token"
              placeholderTextColor={theme.colors.textMuted}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              style={{
                borderWidth: 1,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.sm,
                paddingHorizontal: theme.spacing.sm,
                paddingVertical: theme.spacing.sm,
                ...theme.typography.body,
                color: theme.colors.textPrimary,
                backgroundColor: theme.colors.surfaceStrong,
              }}
            />
            <Pressable
              onPress={() => {
                if (!value.trim()) return;
                onSave(value.trim());
                setValue('');
                onClose();
              }}
              disabled={!value.trim()}
              style={({ pressed }) => ({
                borderRadius: theme.radius.sm,
                paddingVertical: theme.spacing.sm,
                alignItems: 'center',
                backgroundColor: !value.trim() ? theme.colors.border : theme.colors.accentBlue,
                opacity: pressed ? 0.8 : 1,
              })}>
              <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>Save</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  const {
    overrideSystemTheme,
    themeMode,
    setOverrideSystemTheme,
    setThemeMode,
    hydrate,
} = useThemeStore();
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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

  // ── Monitor summary (folded in from the removed Monitor tab) ─────────────
  // Only the lightweight totals needed for the "Scanning live" status card —
  // the full event log / platform breakdown was intentionally dropped.
  const [monitorSummary, setMonitorSummary] = useState<MonitorSummary | null>(null);

  // ── Backend health board (polled) ─────────────────────────────────────────
  const [health, setHealth]             = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError]   = useState<string | null>(null);
  const healthPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Admin token + Telegram renewal ────────────────────────────────────────
  const [adminToken, setAdminToken]                   = useState<string | null>(null);
  const [adminTokenModalVisible, setAdminTokenModalVisible] = useState(false);
  const [renewalModalVisible, setRenewalModalVisible] = useState(false);

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

  // ── Fetch channels on mount ────────────────────────────────────────────────
  useEffect(() => {
    fetchChannels();
  }, []);

  useEffect(() => {
    hydrate();
  }, []);

  // ── Fetch monitor summary once on mount (lightweight; just for the status
  // card's "N jobs · M new" line — no polling/event log like the old tab) ────
  useEffect(() => {
    async function fetchMonitorSummary() {
      try {
        const res  = await fetch(`${API_BASE}/monitor`);
        if (!res.ok) return;
        const data = await res.json();
        setMonitorSummary({
          totalSignals: data.totalSignals ?? 0,
          newSignals:   data.newSignals   ?? 0,
          nextRun:      data.nextRun      ?? null,
        });
      } catch {
        // non-critical — status card just falls back to scrape-event data
      }
    }
    fetchMonitorSummary();
  }, []);

  // ── Backend health board: fetch on mount, then poll every 30s ────────────
  async function fetchHealth() {
    try {
      const data = await api.get<HealthResponse>('/health');
      setHealth(data);
      setHealthError(null);
    } catch {
      setHealthError('Unable to reach backend');
    } finally {
      setHealthLoading(false);
    }
  }

  useEffect(() => {
    fetchHealth();
    healthPollRef.current = setInterval(fetchHealth, 30000);
    return () => {
      if (healthPollRef.current) clearInterval(healthPollRef.current);
    };
  }, []);

  // ── Load the persisted admin token once on mount ──────────────────────────
  useEffect(() => {
    loadAdminToken().then(setAdminToken);
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

  useEffect(() => {
    async function bootstrap() {
      const settings = await loadSettings();

      setOverrideSystemTheme(settings.overrideSystemTheme);
      setThemeMode(settings.themeMode);

      setSettingsLoaded(true);
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!settingsLoaded) return;

    saveSettings({
      overrideSystemTheme,
      themeMode,
    });
  }, [
    overrideSystemTheme,
    themeMode,
    settingsLoaded,
  ]);

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

      {/* ════════════════════════ SOURCES ════════════════════════════════ */}

      {/* ── Scanning live status (folded in from the removed Monitor tab) ── */}
      <ScanningLiveCard theme={theme} scrapeEvent={scrapeEvent} monitor={monitorSummary} />

      {/* ── Backend health board ─────────────────────────────────────────── */}
      <HealthBoardCard
        theme={theme}
        health={health}
        isLoading={healthLoading}
        error={healthError}
        onRetry={fetchHealth}
        onRenewTelegram={() => setRenewalModalVisible(true)}
      />

      {/* ── Force scrape ─────────────────────────────────────────────────── */}
      <Card theme={theme}>
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
              backgroundColor: isRunning ? theme.colors.border : theme.colors.accentBlue,
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
      <SectionLabel theme={theme} label="Scraping schedule" />
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="Crawler enabled"
          sub="Pause to stop all background scraping"
          right={<PillSwitch theme={theme} value={scraping} onValueChange={setScraping} />}
        />
        <Divider theme={theme} />
        <View style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            Scan interval
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {SCRAPE_INTERVALS.map((opt) => (
              <SelectChip
                key={opt}
                theme={theme}
                label={opt}
                selected={scrapeInterval === opt}
                onPress={() => setScrapeInterval(opt)}
              />
            ))}
          </View>
        </View>
      </Card>

      {/* ── Job boards & sites ────────────────────────────────────────────── */}
      <SectionLabel theme={theme} label="Job boards & sites" />
      <Card theme={theme}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
          <IconSquare theme={theme}>
            <Globe size={16} color={theme.colors.accentBlue} strokeWidth={2} />
          </IconSquare>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>
              Twitter / X
            </Text>
            <Text style={{ ...theme.typography.monoMeta, color: theme.colors.textMuted }}>
              Scan tweets, threads, and job posts
            </Text>
          </View>
          <PillSwitch theme={theme} value={twitterEnabled} onValueChange={setTwitterEnabled} />
        </View>
        <Divider theme={theme} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, paddingVertical: theme.spacing.sm }}>
          <IconSquare theme={theme}>
            <Link size={16} color={theme.colors.accentBlue} strokeWidth={2} />
          </IconSquare>
          <View style={{ flex: 1, gap: 1 }}>
            <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>
              LinkedIn
            </Text>
            <Text style={{ ...theme.typography.monoMeta, color: theme.colors.textMuted }}>
              Requires OAuth connection
            </Text>
          </View>
          <PillSwitch theme={theme} value={linkedinEnabled} onValueChange={setLinkedinEnabled} />
        </View>
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
      <SectionLabel theme={theme} label="Telegram channels" />
      <Card theme={theme}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted, marginBottom: 2 }}>
          {chLoading ? 'Loading…' : `${activeCount} of ${channels.length} active`}
        </Text>

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
            {channels.map((ch, idx) => (
              <View key={ch.id}>
                <ChannelRow
                  theme={theme}
                  channel={ch}
                  onToggle={() => toggleChannel(ch)}
                  onRemove={() => removeChannel(ch)}
                  isLoading={loadingIds.has(ch.id)}
                />
                {idx < channels.length - 1 && <Divider theme={theme} />}
              </View>
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
              borderColor: addError ? theme.colors.accentError : theme.colors.border,
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
              borderWidth: addLoading || !newHandle.trim() ? 0 : 1,
              borderColor: theme.colors.accentBlue,
              borderStyle: 'dashed',
              backgroundColor:
                addLoading || !newHandle.trim()
                  ? theme.colors.border
                  : 'transparent',
              opacity: pressed ? 0.7 : 1,
              justifyContent: 'center',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
            })}>
            {addLoading ? (
              <ActivityIndicator size="small" color={theme.colors.textMuted} />
            ) : (
              <Plus size={14} color={theme.colors.accentBlue} strokeWidth={2.5} />
            )}
            <Text
              style={{
                ...theme.typography.body,
                color: addLoading || !newHandle.trim() ? theme.colors.textMuted : theme.colors.accentBlue,
                fontWeight: '600',
              }}>
              Add channel
            </Text>
          </Pressable>
        </View>

        {/* Inline error */}
        {addError ? (
          <Text
            style={{
              ...theme.typography.meta,
              color: theme.colors.accentError,
              marginTop: 4,
            }}>
            {addError}
          </Text>
        ) : null}

        <Divider theme={theme} />
        <ActionRow
          theme={theme}
          label="Admin token"
          sub={adminToken ? 'Token set' : 'Not set — required for renewal'}
          onPress={() => setAdminTokenModalVisible(true)}
        />
        <Divider theme={theme} />
        <ActionRow
          theme={theme}
          label="Renew Telegram session"
          sub="Re-authenticate the scraper's Telegram account"
          onPress={() => setRenewalModalVisible(true)}
        />
      </Card>

      {/* ════════════════════════ YOUR TASTE ═════════════════════════════ */}

      <SectionHeader theme={theme} title="Your taste" subtitle="What counts as a match" />

      {/* ── AI & ranking ──────────────────────────────────────────────────── */}
      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="AI classification"
          sub="Enable ML-based entity extraction and tagging"
          right={<PillSwitch theme={theme} value={aiClassification} onValueChange={setAiClassification} />}
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="Deduplication"
          sub="Collapse duplicate opportunities automatically"
          right={<PillSwitch theme={theme} value={deduplication} onValueChange={setDeduplication} />}
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="Remote only"
          sub="Hide on-site and hybrid roles from feed"
          right={<PillSwitch theme={theme} value={remoteOnly} onValueChange={setRemoteOnly} />}
        />
        <Divider theme={theme} />
        <View style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            Minimum match threshold
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {MATCH_THRESHOLDS.map((opt) => (
              <SelectChip
                key={opt}
                theme={theme}
                label={opt}
                selected={matchThreshold === opt}
                onPress={() => setMatchThreshold(opt)}
              />
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
          right={<PillSwitch theme={theme} value={pushEnabled} onValueChange={setPushEnabled} />}
        />
        <Divider theme={theme} />
        <SettingRow
          theme={theme}
          label="High-confidence alerts only"
          sub="Only notify for ≥ 90% match scores"
          right={<PillSwitch theme={theme} value={highConfidenceOnly} onValueChange={setHighConfidenceOnly} />}
        />
        <Divider theme={theme} />
        <View style={{ gap: theme.spacing.xs, paddingVertical: theme.spacing.sm }}>
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
            Digest frequency
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
            {DIGEST_OPTS.map((opt) => (
              <SelectChip
                key={opt}
                theme={theme}
                label={opt}
                selected={digestFreq === opt}
                onPress={() => setDigestFreq(opt)}
              />
            ))}
          </View>
        </View>
      </Card>

      {/* ── Appearance ────────────────────────────────────────────────────── */}
      <SectionHeader
        theme={theme}
        title="Appearance"
        subtitle="Display preferences"
      />

      <Card theme={theme}>
        <SettingRow
          theme={theme}
          label="Override system theme"
          sub={
            overrideSystemTheme
              ? 'Using custom appearance'
              : 'Following device appearance'
          }
          right={<PillSwitch theme={theme} value={overrideSystemTheme} onValueChange={setOverrideSystemTheme} />}
        />

        {overrideSystemTheme && (
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              paddingHorizontal: 16,
              paddingBottom: 16,
              paddingTop: 4,
            }}
          >
            <Pressable
              onPress={() => setThemeMode('light')}
              style={{
                flex: 1,
                borderRadius: 14,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor:
                  themeMode === 'light'
                    ? theme.colors.accentBlue
                    : theme.colors.border,
                backgroundColor:
                  themeMode === 'light'
                    ? theme.colors.surfaceElevated
                    : theme.colors.surface,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color:
                    themeMode === 'light'
                      ? theme.colors.accentBlue
                      : theme.colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                Light
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setThemeMode('dark')}
              style={{
                flex: 1,
                borderRadius: 14,
                paddingVertical: 14,
                borderWidth: 1,
                borderColor:
                  themeMode === 'dark'
                    ? theme.colors.accentBlue
                    : theme.colors.border,
                backgroundColor:
                  themeMode === 'dark'
                    ? theme.colors.surfaceElevated
                    : theme.colors.surface,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color:
                    themeMode === 'dark'
                      ? theme.colors.accentBlue
                      : theme.colors.textPrimary,
                  fontWeight: '600',
                }}
              >
                Dark
              </Text>
            </Pressable>
          </View>
        )}
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

      <AdminTokenModal
        visible={adminTokenModalVisible}
        onClose={() => setAdminTokenModalVisible(false)}
        theme={theme}
        onSave={(token) => {
          setAdminToken(token);
          saveAdminToken(token);
        }}
      />

      <TelegramRenewalModal
        visible={renewalModalVisible}
        onClose={() => setRenewalModalVisible(false)}
        theme={theme}
        adminToken={adminToken}
        onRenewed={fetchHealth}
        onRequireToken={() => setAdminTokenModalVisible(true)}
      />
    </ScreenShell>
  );
}
