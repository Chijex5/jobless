import { useState } from 'react';
import { Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

// ── Types ──────────────────────────────────────────────────────────────────
type RowProps = {
  theme: ReturnType<typeof useAppTheme>;
  label: string;
  sub?: string;
  right?: React.ReactNode;
};

type ActionRowProps = RowProps & { onPress: () => void; destructive?: boolean };

// ── Primitives ─────────────────────────────────────────────────────────────
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

function Divider({ theme }: { theme: ReturnType<typeof useAppTheme> }) {
  return (
    <View
      style={{ height: 0.5, backgroundColor: theme.colors.border, marginVertical: 2 }}
    />
  );
}

// ── Source Badge ───────────────────────────────────────────────────────────
type SourceEntry = { id: string; name: string; handle: string; active: boolean };

function SourceBadge({
  theme,
  source,
  onToggle,
  onRemove,
}: {
  theme: ReturnType<typeof useAppTheme>;
  source: SourceEntry;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.sm,
        padding: theme.spacing.sm,
        gap: theme.spacing.sm,
        backgroundColor: source.active ? undefined : theme.colors.surfaceStrong,
      }}>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>{source.name}</Text>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{source.handle}</Text>
      </View>
      <Switch
        value={source.active}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.accentBlue ?? theme.colors.accentRose }}
        thumbColor={theme.colors.textPrimary}
      />
      <Pressable onPress={onRemove}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.accentRose }}>Remove</Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ────────────────────────────────────────────────────────────
const SCRAPE_INTERVALS = ['Every 15m', 'Every 30m', 'Every 1h', 'Every 6h', 'Manual only'];
const MATCH_THRESHOLDS = ['60%', '70%', '80%', '90%', '95%'];
const DIGEST_OPTS = ['Off', 'Every 1h', 'Every 6h', 'Daily'];

const DEFAULT_TELEGRAM_SOURCES: SourceEntry[] = [
  { id: 't1', name: 'Tech Jobs Global', handle: '@techjobsglobal', active: true },
  { id: 't2', name: 'Remote Dev Ops', handle: '@remotedevops', active: false },
];

export default function SettingsScreen() {
  const theme = useAppTheme();

  // ── Scraping controls ──
  const [scrapeInterval, setScrapeInterval] = useState('Every 30m');
  const [scraping, setScraping] = useState(true);
  const [isScraping, setIsScraping] = useState(false);

  // ── Sources ──
  const [twitterEnabled, setTwitterEnabled] = useState(true);
  const [linkedinEnabled, setLinkedinEnabled] = useState(false);
  const [telegramSources, setTelegramSources] = useState<SourceEntry[]>(DEFAULT_TELEGRAM_SOURCES);
  const [newTgHandle, setNewTgHandle] = useState('');

  // ── AI & ranking ──
  const [matchThreshold, setMatchThreshold] = useState('80%');
  const [aiClassification, setAiClassification] = useState(true);
  const [deduplication, setDeduplication] = useState(true);
  const [remoteOnly, setRemoteOnly] = useState(false);

  // ── Notifications ──
  const [pushEnabled, setPushEnabled] = useState(true);
  const [digestFreq, setDigestFreq] = useState('Every 6h');
  const [highConfidenceOnly, setHighConfidenceOnly] = useState(false);

  // ── Appearance ──
  const [darkMode, setDarkMode] = useState(theme.appearance === 'dark');

  // ── Actions ──
  function handleForceScrape() {
    if (isScraping) return;
    setIsScraping(true);
    setTimeout(() => setIsScraping(false), 3000);
  }

  function addTelegramSource() {
    const handle = newTgHandle.trim();
    if (!handle) return;
    const formatted = handle.startsWith('@') ? handle : `@${handle}`;
    setTelegramSources((prev) => [
      ...prev,
      { id: Date.now().toString(), name: formatted, handle: formatted, active: true },
    ]);
    setNewTgHandle('');
  }

  function toggleTelegramSource(id: string) {
    setTelegramSources((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s)),
    );
  }

  function removeTelegramSource(id: string) {
    setTelegramSources((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <ScreenShell
      theme={theme}
      title="Settings"
      subtitle="Intelligence behavior, data sources, and pipeline controls">

      {/* ── Force Scrape ───────────────────────────────────────────────── */}
      <Card theme={theme} style={{ backgroundColor: theme.colors.surfaceStrong }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: theme.spacing.sm }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>
              {isScraping ? 'Scraping now…' : 'Force scrape'}
            </Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
              {isScraping
                ? 'Running full pipeline pass — usually 30–60s'
                : 'Trigger a full intelligence pass immediately'}
            </Text>
          </View>
          <Pressable
            onPress={handleForceScrape}
            disabled={isScraping}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.sm,
              borderRadius: theme.radius.sm,
              backgroundColor: isScraping ? theme.colors.border : theme.colors.accentRose,
              opacity: pressed ? 0.7 : 1,
            })}>
            <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>
              {isScraping ? 'Running' : 'Run now'}
            </Text>
          </Pressable>
        </View>
        {isScraping && (
          <View style={{ flexDirection: 'row', gap: theme.spacing.xs, flexWrap: 'wrap', marginTop: theme.spacing.xs }}>
            <Chip theme={theme} label="Crawler active" variant="blue" />
            <Chip theme={theme} label="AI extracting…" variant="violet" />
            <Chip theme={theme} label="Ranking queued" variant="default" />
          </View>
        )}
      </Card>

      {/* ── Scraping schedule ──────────────────────────────────────────── */}
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
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Scan interval</Text>
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

      {/* ── Data sources ──────────────────────────────────────────────── */}
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
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted, paddingBottom: theme.spacing.xs }}>
            Tap to connect your LinkedIn account and enable this source.
          </Text>
        )}
      </Card>

      {/* ── Telegram sources ──────────────────────────────────────────── */}
      <SectionHeader theme={theme} title="Telegram channels" subtitle="Add groups or channels as sources" />
      <Card theme={theme}>
        {telegramSources.length === 0 && (
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted, paddingVertical: theme.spacing.xs }}>
            No Telegram sources yet. Add a public channel below.
          </Text>
        )}
        <View style={{ gap: theme.spacing.sm }}>
          {telegramSources.map((src) => (
            <SourceBadge
              key={src.id}
              theme={theme}
              source={src}
              onToggle={() => toggleTelegramSource(src.id)}
              onRemove={() => removeTelegramSource(src.id)}
            />
          ))}
        </View>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.md }}>
          <TextInput
            value={newTgHandle}
            onChangeText={setNewTgHandle}
            placeholder="@channelname or invite link"
            placeholderTextColor={theme.colors.textMuted}
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.sm,
              paddingHorizontal: theme.spacing.sm,
              paddingVertical: theme.spacing.xs,
              ...theme.typography.body,
              color: theme.colors.textPrimary,
              backgroundColor: theme.colors.surfaceStrong,
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <Pressable
            onPress={addTelegramSource}
            style={({ pressed }) => ({
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              backgroundColor: theme.colors.accentRose,
              opacity: pressed ? 0.7 : 1,
              justifyContent: 'center',
            })}>
            <Text style={{ ...theme.typography.body, color: '#fff', fontWeight: '600' }}>Add</Text>
          </Pressable>
        </View>
      </Card>

      {/* ── AI & Ranking ──────────────────────────────────────────────── */}
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
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Minimum match threshold</Text>
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

      {/* ── Notifications ─────────────────────────────────────────────── */}
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
          <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Digest frequency</Text>
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

      {/* ── Appearance ────────────────────────────────────────────────── */}
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

      {/* ── Danger zone ───────────────────────────────────────────────── */}
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