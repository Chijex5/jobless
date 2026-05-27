import { useMemo } from 'react';   // ← removed useState (no longer needed here)
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
 
import { useAppTheme } from '@/theme/use-app-theme';
import type { AppTheme } from '@/theme/tokens';
import {
  SECTION_ORDER,
  useNotifications,
  type NotificationCategory,
  type NotificationItem,
  type NotificationPriority,
} from '@/hooks/useNotifications';



// ─── Helpers ──────────────────────────────────────────────────────────────────

function categoryMeta(
  category: NotificationCategory,
  theme: AppTheme
): { color: string; icon: string } {
  switch (category) {
    case 'High Match Opportunity':
      return { color: theme.colors.accentRose, icon: '◆' };
    case 'Deadline Alert':
      return { color: theme.colors.accentWarning, icon: '◎' };
    case 'Trending Opportunity':
      return { color: theme.colors.accentBlue, icon: '↑' };
    case 'Queue Reminder':
      return { color: theme.colors.accentViolet, icon: '○' };
    case 'AI Insight Alert':
      return { color: theme.colors.accentBlue, icon: '∿' };
    case 'System Activity':
      return { color: theme.colors.textMuted, icon: '·' };
  }
}

// ─── Card variants ────────────────────────────────────────────────────────────

// High Match — score is the hero
function MatchCard({
  item,
  theme,
  isImportant,
  onToggleImportant,
  onDismiss,
}: CardProps) {
  const meta = categoryMeta(item.category, theme);
  const score = item.matchScore ?? 0;
  const scoreCol =
    score >= 90
      ? theme.colors.accentRose
      : score >= 80
      ? theme.colors.accentBlue
      : theme.colors.accentViolet;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      {/* Top stripe */}
      <View style={{ height: 3, backgroundColor: `${scoreCol}` }} />

      <View style={{ padding: 16, gap: 12 }}>
        {/* Header row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Text style={{ fontSize: 11, color: meta.color }}>{meta.icon}</Text>
              <Text style={{ fontSize: 11, fontWeight: '500', color: theme.colors.textMuted, letterSpacing: 0.2 }}>
                {item.category}
              </Text>
            </View>
            <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: -0.3, lineHeight: 20 }}>
              {item.title.replace(/— \d+% match/, '').trim()}
            </Text>
          </View>

          {/* Score badge */}
          <View style={{
            alignItems: 'center',
            minWidth: 52,
            paddingHorizontal: 8,
            paddingVertical: 6,
            borderRadius: theme.radius.sm,
            backgroundColor: `${scoreCol}12`,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: `${scoreCol}30`,
          }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: scoreCol, letterSpacing: -0.5 }}>
              {score}
            </Text>
            <Text style={{ fontSize: 8, fontWeight: '600', color: scoreCol, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.4 }}>
              match
            </Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary }}>
          {item.context}
        </Text>

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ActionButton label="Save" theme={theme} primary />
          <ActionButton label="Open" theme={theme} />
          <ActionButton
            label={isImportant ? '★' : '☆'}
            theme={theme}
            active={isImportant}
            activeColor={theme.colors.accentWarning}
            onPress={onToggleImportant}
          />
        </View>

        <TimeStamp time={item.time} theme={theme} />
      </View>
    </View>
  );
}

// Deadline — urgency is the hero
function DeadlineCard({ item, theme, onDismiss }: CardProps) {
  const meta = categoryMeta(item.category, theme);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${theme.colors.accentWarning}30`,
        overflow: 'hidden',
      }}
    >
      <View style={{ height: 3, backgroundColor: theme.colors.accentWarning }} />

      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={{ fontSize: 11, color: meta.color }}>{meta.icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.accentWarning, letterSpacing: 0.3 }}>
              Closes in {item.urgency}
            </Text>
          </View>
          <TimeStamp time={item.time} theme={theme} />
        </View>

        <Text style={{ fontSize: 15, fontWeight: '700', color: theme.colors.textPrimary, letterSpacing: -0.3, lineHeight: 20 }}>
          {item.title.replace('Application deadline approaching in 24 hours', 'Deadline approaching')}
        </Text>

        <Text style={{ fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary }}>
          {item.context}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ActionButton label="Open & Apply" theme={theme} primary accentColor={theme.colors.accentWarning} />
          <ActionButton label="Dismiss" theme={theme} onPress={onDismiss} />
        </View>
      </View>
    </View>
  );
}

// Trending — lighter, informational
function TrendingCard({ item, theme, isImportant, onToggleImportant }: CardProps) {
  const meta = categoryMeta(item.category, theme);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <Text style={{ fontSize: 13, color: meta.color, fontWeight: '700' }}>{meta.icon}</Text>
            <Text style={{ fontSize: 11, fontWeight: '500', color: theme.colors.textMuted }}>
              Trending
            </Text>
          </View>
          <TimeStamp time={item.time} theme={theme} />
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, letterSpacing: -0.2, lineHeight: 19 }}>
          {item.title}
        </Text>

        <Text style={{ fontSize: 13, lineHeight: 19, color: theme.colors.textSecondary }}>
          {item.context}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ActionButton label="Open" theme={theme} />
          <ActionButton
            label={isImportant ? '★ Important' : '☆ Mark important'}
            theme={theme}
            active={isImportant}
            activeColor={theme.colors.accentWarning}
            onPress={onToggleImportant}
          />
        </View>
      </View>
    </View>
  );
}

// Queue reminder — subtle nudge
function ReminderCard({ item, theme, onDismiss }: CardProps) {
  const meta = categoryMeta(item.category, theme);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        flexDirection: 'row',
        overflow: 'hidden',
      }}
    >
      {/* Left accent bar */}
      <View style={{ width: 3, backgroundColor: meta.color }} />

      <View style={{ flex: 1, padding: 14, gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 11, fontWeight: '500', color: meta.color }}>
            Queue reminder
          </Text>
          <TimeStamp time={item.time} theme={theme} />
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, letterSpacing: -0.2, lineHeight: 19 }}>
          {item.title}
        </Text>

        <Text style={{ fontSize: 12, lineHeight: 18, color: theme.colors.textMuted }}>
          {item.context}
        </Text>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <ActionButton label="Open" theme={theme} />
          <ActionButton label="Dismiss" theme={theme} onPress={onDismiss} />
        </View>
      </View>
    </View>
  );
}

// AI Insight — stat/data feel
function InsightCard({ item, theme }: CardProps) {
  const meta = categoryMeta(item.category, theme);

  // Extract the stat from title if present e.g. "21%"
  const statMatch = item.title.match(/(\d+%)/);
  const stat = statMatch?.[1];
  const titleClean = stat
    ? item.title.replace(stat, '').replace('increased', '').replace('  ', ' ').trim()
    : item.title;

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 16, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: '500', color: meta.color, letterSpacing: 0.2 }}>
              Market insight
            </Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary, letterSpacing: -0.2, lineHeight: 19 }}>
              {item.title}
            </Text>
          </View>
          {stat && (
            <View style={{
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 8,
              borderRadius: theme.radius.sm,
              backgroundColor: `${meta.color}10`,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: `${meta.color}25`,
            }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: meta.color, letterSpacing: -0.5 }}>
                {stat}
              </Text>
              <Text style={{ fontSize: 8, fontWeight: '600', color: meta.color, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                growth
              </Text>
            </View>
          )}
        </View>

        <View style={{ borderLeftWidth: 2, borderLeftColor: theme.colors.border, paddingLeft: 10 }}>
          <Text style={{ fontSize: 12, lineHeight: 18, color: theme.colors.textMuted }}>
            {item.context}
          </Text>
        </View>

        <TimeStamp time={item.time} theme={theme} />
      </View>
    </View>
  );
}

// System Activity — minimal, almost dismissible
function SystemCard({ item, theme, onDismiss }: CardProps) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 11,
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        gap: 12,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.textSecondary, lineHeight: 17 }}>
          {item.title}
        </Text>
        <TimeStamp time={item.time} theme={theme} />
      </View>
      <Pressable onPress={onDismiss}>
        {({ pressed }) => (
          <Text style={{ fontSize: 11, color: theme.colors.textMuted, opacity: pressed ? 0.4 : 1 }}>
            Dismiss
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ─── Shared primitives ────────────────────────────────────────────────────────

type CardProps = {
  item: NotificationItem;
  theme: AppTheme;
  isImportant?: boolean;
  onToggleImportant?: () => void;
  onDismiss?: () => void;
};

function TimeStamp({ time, theme }: { time: string; theme: AppTheme }) {
  return (
    <Text style={{ fontSize: 10, color: theme.colors.textMuted, letterSpacing: 0.1 }}>
      {time}
    </Text>
  );
}

function ActionButton({
  label,
  theme,
  primary = false,
  active = false,
  activeColor,
  accentColor,
  onPress,
}: {
  label: string;
  theme: AppTheme;
  primary?: boolean;
  active?: boolean;
  activeColor?: string;
  accentColor?: string;
  onPress?: () => void;
}) {
  const bg = primary
    ? (accentColor ?? theme.colors.textPrimary)
    : active && activeColor
    ? `${activeColor}12`
    : 'transparent';

  const textColor = primary
    ? theme.colors.background
    : active && activeColor
    ? activeColor
    : theme.colors.textSecondary;

  const borderColor = primary
    ? 'transparent'
    : active && activeColor
    ? `${activeColor}30`
    : theme.colors.border;

  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View
          style={{
            borderRadius: theme.radius.md,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor,
            backgroundColor: pressed
              ? primary
                ? `${accentColor ?? theme.colors.textSecondary}`
                : theme.colors.surfaceStrong
              : bg,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ title, count, theme }: { title: string; count: number; theme: AppTheme }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.7 }}>
        {title}
      </Text>
      <View style={{ flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />
      <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>{count}</Text>
    </View>
  );
}

// ─── Card router ──────────────────────────────────────────────────────────────

function NotificationCard({
  item,
  theme,
  isImportant,
  onToggleImportant,
  onDismiss,
}: CardProps) {
  switch (item.category) {
    case 'High Match Opportunity':
      return (
        <MatchCard
          item={item}
          theme={theme}
          isImportant={isImportant}
          onToggleImportant={onToggleImportant}
          onDismiss={onDismiss}
        />
      );
    case 'Deadline Alert':
      return <DeadlineCard item={item} theme={theme} onDismiss={onDismiss} />;
    case 'Trending Opportunity':
      return (
        <TrendingCard
          item={item}
          theme={theme}
          isImportant={isImportant}
          onToggleImportant={onToggleImportant}
        />
      );
    case 'Queue Reminder':
      return <ReminderCard item={item} theme={theme} onDismiss={onDismiss} />;
    case 'AI Insight Alert':
      return <InsightCard item={item} theme={theme} />;
    case 'System Activity':
      return <SystemCard item={item} theme={theme} onDismiss={onDismiss} />;
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SignalsScreen() {
  const theme = useAppTheme();
  const {
    grouped,          
    importantIds,     
    dismissedIds,     
    totalActive,      
    loading,
    error,
    toggleImportant,  
    dismiss,          
    restoreDismissed, 
    generating,
    forceGenerate,
  } = useNotifications();

  console.log('Grouped notifications:', grouped);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={theme.colors.accentBlue} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 48,
          gap: 20,
        }}
      >
        {/* Summary row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
            {totalActive} alert{totalActive !== 1 ? 's' : ''} · low noise, high signal
          </Text>
          {dismissedIds.length > 0 && (
            <Pressable onPress={restoreDismissed} >
              {({ pressed }) => (
                <Text style={{ fontSize: 12, color: theme.colors.accentBlue, opacity: pressed ? 0.5 : 1 }}>
                  Restore {dismissedIds.length} dismissed
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {/* Sections */}
        {SECTION_ORDER.map((section) => {
          const items = grouped.get(section) ?? [];
          if (items.length === 0) return null;

          return (
            <View key={section} style={{ gap: 8 }}>
              <SectionLabel title={section} count={items.length} theme={theme} />
              {items.map((item) => (
                <NotificationCard
                  key={item.id}
                  item={item}
                  theme={theme}
                  isImportant={importantIds.includes(item.id)}
                  onToggleImportant={() => toggleImportant(item.id)}
                  onDismiss={() => dismiss(item.id)}
                />
              ))}
            </View>
          );
        })}
        {totalActive === 0 && !loading && (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.textPrimary }}>
              No active signals
            </Text>
            <Text style={{ fontSize: 12, color: theme.colors.textMuted, textAlign: 'center' }}>
              Run a scrape then tap to refresh intelligence.
            </Text>
            <Pressable onPress={forceGenerate} disabled={generating}>
              {({ pressed }) => (
                <Text style={{
                  fontSize: 12,
                  color: theme.colors.accentBlue,
                  opacity: pressed || generating ? 0.5 : 1,
                  marginTop: 4,
                }}>
                  {generating ? 'Generating…' : 'Generate now'}
                </Text>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}