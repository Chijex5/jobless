import { useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Bookmark, BookmarkX } from 'lucide-react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import { useInteligence } from '@/hooks/useInteligence';
import { IntelligenceSignal } from '@/data/mock';
import type { AppTheme } from '@/theme/tokens';
import { api } from '@/lib/backend';
import { ScoreRing } from '@/components/ui';
import { AppHeader } from '@/components/app-header';

// ─── Types ────────────────────────────────────────────────────────────────────

type SortKey = 'match' | 'date';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'match', label: 'By match' },
  { key: 'date', label: 'By date saved' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(company: string | null | undefined): string {
  if (!company) return '?';
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sortSignals(items: IntelligenceSignal[], key: SortKey): IntelligenceSignal[] {
  return [...items].sort((a, b) => {
    if (key === 'match') return b.aiMatchScore - a.aiMatchScore;
    // "By date saved" — fall back to postedAt since there's no separate savedAt field.
    return new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime();
  });
}

// ─── Header ───────────────────────────────────────────────────────────────────

function SavedHeader({
  count,
  sortKey,
  onSortChange,
  theme,
}: {
  count: number;
  sortKey: SortKey;
  onSortChange: (key: SortKey) => void;
  theme: AppTheme;
}) {
  return (
    <View
      style={{
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 14,
        gap: 14,
        backgroundColor: theme.colors.background,
      }}
    >
      <View style={{ gap: 4 }}>
        <Text
          style={{
            fontSize: 30,
            fontFamily: theme.fontFamily.sansExtraBold,
            fontWeight: '800',
            color: theme.colors.textPrimary,
            letterSpacing: -0.5,
          }}
        >
          Saved
        </Text>
        <Text
          style={{
            fontSize: 13,
            fontFamily: theme.fontFamily.sansMedium,
            color: theme.colors.textMuted,
          }}
        >
          {count} role{count !== 1 ? 's' : ''} bookmarked for later
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {SORT_OPTIONS.map((opt) => {
          const active = sortKey === opt.key;
          return (
            <Pressable key={opt.key} onPress={() => onSortChange(opt.key)} style={{ flex: 1 }}>
              {({ pressed }) => (
                <View
                  style={{
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 999,
                    paddingVertical: 10,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: active ? theme.colors.textPrimary : theme.colors.border,
                    backgroundColor: active
                      ? theme.colors.textPrimary
                      : pressed
                      ? theme.colors.surfaceStrong
                      : theme.colors.surface,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: theme.fontFamily.sansSemiBold,
                      fontWeight: '600',
                      color: active ? theme.colors.background : theme.colors.textSecondary,
                    }}
                  >
                    {opt.label}
                  </Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Saved Card ───────────────────────────────────────────────────────────────

function SavedCard({
  item,
  onUnsave,
  onPress,
  removing,
  theme,
  animation,
}: {
  item: IntelligenceSignal;
  onUnsave: () => void;
  onPress: () => void;
  removing: boolean;
  theme: AppTheme;
  animation: Animated.Value;
}) {
  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [12, 0],
            }),
          },
        ],
      }}
    >
      <Pressable onPress={onPress}>
        {({ pressed }) => (
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderRadius: 18,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
              padding: 14,
              opacity: pressed ? 0.92 : removing ? 0.5 : 1,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              {/* Company-initials avatar */}
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: theme.colors.surfaceElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 15,
                    fontFamily: theme.fontFamily.sansExtraBold,
                    fontWeight: '800',
                    color: theme.colors.accentBlue,
                  }}
                >
                  {initials(item.company)}
                </Text>
              </View>

              {/* Title / company / pay */}
              <View style={{ flex: 1, gap: 3, paddingTop: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: theme.fontFamily.sansBold,
                    fontWeight: '700',
                    color: theme.colors.textPrimary,
                    letterSpacing: -0.2,
                  }}
                  numberOfLines={2}
                >
                  {item.role}
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: theme.fontFamily.sansMedium,
                    color: theme.colors.textSecondary,
                  }}
                  numberOfLines={1}
                >
                  {item.company ?? 'Unknown'}
                  {item.pay ? ` · ${item.pay}` : ''}
                </Text>
                <Text
                  style={{
                    fontSize: 10.5,
                    fontFamily: theme.fontFamily.monoRegular,
                    color: theme.colors.textMuted,
                    letterSpacing: 0.3,
                    marginTop: 2,
                  }}
                >
                  SAVED · {timeAgo(item.postedAt)}
                </Text>
              </View>

              {/* Score ring */}
              <ScoreRing theme={theme} score={item.aiMatchScore} size={42} />
            </View>

            {/* Unsave action */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'flex-end',
                marginTop: 10,
                paddingTop: 10,
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: theme.colors.border,
              }}
            >
              <Pressable onPress={onUnsave} hitSlop={8} disabled={removing}>
                {({ pressed }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      backgroundColor: pressed ? theme.colors.surfaceStrong : 'transparent',
                      opacity: removing ? 0.5 : 1,
                    }}
                  >
                    <BookmarkX size={14} color={theme.colors.textMuted} strokeWidth={2} />
                    <Text
                      style={{
                        fontSize: 12,
                        fontFamily: theme.fontFamily.sansSemiBold,
                        fontWeight: '600',
                        color: theme.colors.textMuted,
                      }}
                    >
                      {removing ? 'Removing…' : 'Remove'}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

// ─── Empty / Loading / Error ───────────────────────────────────────────────────

function EmptySaved({ theme }: { theme: AppTheme }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        padding: 32,
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Bookmark size={22} color={theme.colors.textMuted} strokeWidth={1.6} />
      <Text style={{ fontSize: 13, fontFamily: theme.fontFamily.sansSemiBold, color: theme.colors.textMuted }}>
        Nothing saved yet
      </Text>
      <Text
        style={{
          fontSize: 12,
          fontFamily: theme.fontFamily.sansMedium,
          color: theme.colors.textMuted,
          textAlign: 'center',
          lineHeight: 18,
        }}
      >
        Bookmark roles from Discover to keep track of them here.
      </Text>
    </View>
  );
}

function SkeletonCard({ theme }: { theme: AppTheme }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useMemo(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: 18,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Animated.View
          style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: theme.colors.border, opacity: shimmer }}
        />
        <View style={{ flex: 1, gap: 8, paddingTop: 2 }}>
          <Animated.View style={{ width: '70%', height: 14, borderRadius: 4, backgroundColor: theme.colors.border, opacity: shimmer }} />
          <Animated.View style={{ width: '45%', height: 10, borderRadius: 4, backgroundColor: theme.colors.border, opacity: shimmer }} />
        </View>
        <Animated.View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: theme.colors.border, opacity: shimmer }} />
      </View>
    </View>
  );
}

function ErrorScreen({ theme, onRetry }: { theme: AppTheme; onRetry: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: 16, justifyContent: 'center' }}>
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 3, backgroundColor: theme.colors.accentError }} />
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 16, fontFamily: theme.fontFamily.sansBold, color: theme.colors.textPrimary }}>
              Saved roles unavailable
            </Text>
            <Text style={{ fontSize: 13, fontFamily: theme.fontFamily.sansMedium, color: theme.colors.textSecondary, lineHeight: 19 }}>
              Failed to load your bookmarks. Try again.
            </Text>
          </View>
          <Pressable onPress={onRetry}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: 'center',
                  backgroundColor: pressed ? theme.colors.textSecondary : theme.colors.textPrimary,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                }}
              >
                <Text style={{ fontSize: 14, fontFamily: theme.fontFamily.sansSemiBold, color: theme.colors.background }}>
                  Retry
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Saved Screen ─────────────────────────────────────────────────────────────

export default function SavedScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  // Reuse the same "isSaved=true" query param pattern already used in queue.tsx
  const { data, isLoading, error, forcedRefetch } = useInteligence(['isSaved=true']);

  const [sortKey, setSortKey] = useState<SortKey>('match');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const cardAnims = useRef<Record<string, Animated.Value>>({}).current;

  const signals = useMemo(() => data?.signals ?? [], [data]);

  const sortedSignals = useMemo(() => sortSignals(signals, sortKey), [signals, sortKey]);

  const getCardAnim = (id: string): Animated.Value => {
    if (!cardAnims[id]) cardAnims[id] = new Animated.Value(0);
    return cardAnims[id];
  };

  useMemo(() => {
    sortedSignals.forEach((item, index) => {
      const anim = getCardAnim(item.id);
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedSignals]);

  const handleUnsave = async (id: string) => {
    setRemovingIds((prev) => new Set([...prev, id]));
    try {
      await api.patch(`/signals/${id}`, { status: 'new' });
      await forcedRefetch();
    } catch (err) {
      console.error('Failed to unsave signal:', err);
    } finally {
      setRemovingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (error != null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AppHeader />
        <ErrorScreen theme={theme} onRetry={() => forcedRefetch()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader />
      <SavedHeader count={signals.length} sortKey={sortKey} onSortChange={setSortKey} theme={theme} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, gap: 10 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          [0, 1, 2].map((i) => <SkeletonCard key={i} theme={theme} />)
        ) : sortedSignals.length === 0 ? (
          <EmptySaved theme={theme} />
        ) : (
          sortedSignals.map((item) => (
            <SavedCard
              key={item.id}
              item={item}
              theme={theme}
              removing={removingIds.has(item.id)}
              onUnsave={() => handleUnsave(item.id)}
              onPress={() =>
                router.push({
                  pathname: '/opportunity/[id]',
                  params: { id: item.id },
                })
              }
              animation={getCardAnim(item.id)}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}
