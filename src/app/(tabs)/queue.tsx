import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useAppTheme } from '@/theme/use-app-theme';
import { useInteligence } from '@/hooks/useInteligence';
import { IntelligenceSignal } from '@/data/mock';
import type { AppTheme } from '@/theme/tokens';
import { api } from '@/lib/backend';
import { AppHeader } from '@/components/app-header';
import { ArrowDownNarrowWide } from 'lucide-react-native';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStage = 'new' | 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';

type QueueItem = IntelligenceSignal & {
  pipelineStage: PipelineStage;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PIPELINE_STAGES: PipelineStage[] = [
  'new', 'saved', 'applied', 'interviewing', 'offered', 'rejected',
];

// Visual progress stepper across the "active application" stages. `new` is
// excluded since it precedes a user action; `rejected` is a terminal branch
// shown via the stage pill rather than the linear stepper.
const STEPPER_STAGES: PipelineStage[] = ['saved', 'applied', 'interviewing', 'offered'];

const STAGE_LABELS: Record<PipelineStage, string> = {
  new: 'New',
  saved: 'Saved',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offered: 'Offered',
  rejected: 'Rejected',
};

const NEXT_STAGE: Partial<Record<PipelineStage, PipelineStage>> = {
  new: 'saved',
  saved: 'applied',
  applied: 'interviewing',
  interviewing: 'offered',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function stageColor(stage: PipelineStage, theme: AppTheme): string {
  switch (stage) {
    case 'new': return theme.colors.textMuted;
    case 'saved': return theme.colors.accentBlue;
    case 'applied': return theme.colors.accentViolet;
    case 'interviewing': return theme.colors.accentWarning;
    case 'offered': return theme.colors.accentRose;
    case 'rejected': return '#E5484D';
  }
}

function timeAgo(dateStr: string | null | undefined): string {
  if (!dateStr) return 'Recently';
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return 'Just now';
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function sortItems(items: QueueItem[], key: SortKey): QueueItem[] {
  return [...items].sort((a, b) => {
    if (key === 'matchScore') return b.aiMatchScore - a.aiMatchScore;
    if (key === 'company') return (a.company ?? '').localeCompare(b.company ?? '');
    if (key === 'recent') {
      return new Date(b.postedAt ?? 0).getTime() - new Date(a.postedAt ?? 0).getTime();
    }
    return 0;
  });
}

type SortKey = 'recent' | 'matchScore' | 'company';

const SORT_LABELS: Record<SortKey, string> = {
  recent: 'Most recent',
  matchScore: 'Best match',
  company: 'Company A–Z',
};

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = [
  '#5B8AF0', '#3EBD8A', '#E8A838', '#9B7FEA', '#E5484D', '#F5C542',
];

type ConfettiPiece = {
  x: Animated.Value;
  y: Animated.Value;
  opacity: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
  startX: number;
};

function ConfettiLayer({ active }: { active: boolean }) {
  const pieces = useRef<ConfettiPiece[]>(
    Array.from({ length: 38 }, (_, i) => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 6 + Math.random() * 6,
      startX: Math.random() * 380,
    }))
  ).current;

  useEffect(() => {
    if (!active) return;

    const animations = pieces.map((p, i) => {
      p.x.setValue(0);
      p.y.setValue(0);
      p.opacity.setValue(0);
      p.rotate.setValue(0);

      const delay = i * 40;
      const xDrift = (Math.random() - 0.5) * 160;

      return Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(p.opacity, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: 700, duration: 2200, useNativeDriver: true }),
          Animated.timing(p.x, { toValue: xDrift, duration: 2200, useNativeDriver: true }),
          Animated.timing(p.rotate, { toValue: 1, duration: 2200, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(1400),
            Animated.timing(p.opacity, { toValue: 0, duration: 600, useNativeDriver: true }),
          ]),
        ]),
      ]);
    });

    Animated.parallel(animations).start();
  }, [active, pieces]);

  if (!active) return null;

  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999,
        overflow: 'hidden',
      }}
    >
      {pieces.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            top: 0,
            left: p.startX,
            width: p.size,
            height: p.size,
            borderRadius: 2,
            backgroundColor: p.color,
            opacity: p.opacity,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              {
                rotate: p.rotate.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0deg', '720deg'],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ theme, delay }: { theme: AppTheme; delay: number }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.7, duration: 900, delay, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const Block = ({ w, h = 10, radius = 4 }: { w: number | string; h?: number; radius?: number }) => (
    <Animated.View
      style={{
        width: w as any,
        height: h,
        borderRadius: radius,
        backgroundColor: theme.colors.border,
        opacity: shimmer,
      }}
    />
  );

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
      <Animated.View
        style={{ height: 3, backgroundColor: theme.colors.border, opacity: shimmer }}
      />
      <View style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View style={{ gap: 8, flex: 1 }}>
            <Block w="35%" h={10} />
            <Block w="70%" h={18} />
            <Block w="25%" h={10} />
          </View>
          <Block w={52} h={52} radius={theme.radius.sm} />
        </View>
        <Block w="100%" h={1} radius={1} />
        <View style={{ gap: 6 }}>
          <Block w="100%" />
          <Block w="75%" />
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Block w="45%" h={40} radius={theme.radius.md} />
          <Block w="28%" h={40} radius={theme.radius.md} />
          <Block w="20%" h={40} radius={theme.radius.md} />
        </View>
      </View>
    </View>
  );
}

function LoadingScreen({ theme }: { theme: AppTheme }) {
  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* Stats skeleton */}
        <Animated.View
          style={{
            height: 64,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.md,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
          }}
        />
        {/* Pipeline tabs skeleton */}
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[80, 64, 72, 96, 68, 72].map((w, i) => (
            <View
              key={i}
              style={{
                width: w,
                height: 32,
                borderRadius: 999,
                backgroundColor: theme.colors.surface,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
              }}
            />
          ))}
        </View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} theme={theme} delay={i * 100} />
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Error Screen ─────────────────────────────────────────────────────────────

function ErrorScreen({
  theme,
  onRetry,
}: {
  theme: AppTheme;
  onRetry: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: 'hidden',
        }}
      >
        <View style={{ height: 3, backgroundColor: '#E5484D' }} />
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary }}>
              Queue unavailable
            </Text>
            <Text style={{ fontSize: 13, color: theme.colors.textSecondary, lineHeight: 19 }}>
              Failed to load your signals. Your pipeline data is unaffected.
            </Text>
          </View>
          <Pressable onPress={onRetry}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: theme.radius.md,
                  paddingVertical: 13,
                  alignItems: 'center',
                  backgroundColor: pressed
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                }}
              >
                <Text style={{ fontSize: 14, fontWeight: '600', color: theme.colors.background }}>
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

// ─── Stats Bar ────────────────────────────────────────────────────────────────

function StatsBar({ items, theme }: { items: QueueItem[]; theme: AppTheme }) {
  const applied = items.filter((i) => i.pipelineStage === 'applied').length;
  const interviewing = items.filter((i) => i.pipelineStage === 'interviewing').length;
  const offered = items.filter((i) => i.pipelineStage === 'offered').length;

  const StatCard = ({ label, value }: { label: string; value: number }) => (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.surface,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        paddingVertical: 14,
        alignItems: 'center',
        gap: 3,
      }}
    >
      <Text
        style={{
          fontSize: 22,
          fontFamily: theme.fontFamily.sansExtraBold,
          fontWeight: '800',
          color: theme.colors.textPrimary,
          letterSpacing: -0.6,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontFamily: theme.fontFamily.sansSemiBold,
          fontWeight: '600',
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: 0.3,
        }}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <StatCard label={STAGE_LABELS.applied} value={applied} />
      <StatCard label={STAGE_LABELS.interviewing} value={interviewing} />
      <StatCard label={STAGE_LABELS.offered} value={offered} />
    </View>
  );
}

// ─── Stage Stepper ────────────────────────────────────────────────────────────
// Horizontal progress track: small circles connected by lines, one per active
// stage (saved → applied → interviewing → offered). Completed/current steps
// are filled indigo; upcoming steps are light gray. The current stage label
// is highlighted in indigo underneath. Rejected items render as a plain
// "Rejected" notice instead of the linear stepper since it's a terminal branch.

function StageStepper({ stage, theme }: { stage: PipelineStage; theme: AppTheme }) {
  if (stage === 'rejected') {
    return (
      <View
        style={{
          paddingVertical: 8,
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: 11,
            fontFamily: theme.fontFamily.sansSemiBold,
            fontWeight: '600',
            color: '#E5484D',
          }}
        >
          Application closed
        </Text>
      </View>
    );
  }

  // 'new' hasn't entered the active pipeline yet — show stepper with nothing filled.
  const currentIndex = STEPPER_STAGES.indexOf(stage === 'new' ? STEPPER_STAGES[0] : stage);
  const activeIndex = stage === 'new' ? -1 : currentIndex;

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {STEPPER_STAGES.map((s, i) => {
          const done = i <= activeIndex;
          const isLast = i === STEPPER_STAGES.length - 1;
          return (
            <View key={s} style={{ flexDirection: 'row', alignItems: 'center', flex: isLast ? 0 : 1 }}>
              <View
                style={{
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: done ? theme.colors.accentBlue : theme.colors.surfaceStrong,
                  borderWidth: done ? 0 : StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                }}
              />
              {!isLast && (
                <View
                  style={{
                    flex: 1,
                    height: 2,
                    backgroundColor: i < activeIndex ? theme.colors.accentBlue : theme.colors.surfaceStrong,
                  }}
                />
              )}
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: 'row' }}>
        {STEPPER_STAGES.map((s, i) => (
          <Text
            key={s}
            style={{
              flex: 1,
              fontSize: 9,
              fontFamily: i === activeIndex ? theme.fontFamily.sansSemiBold : theme.fontFamily.sansMedium,
              fontWeight: i === activeIndex ? '600' : '500',
              color: i === activeIndex ? theme.colors.accentBlue : theme.colors.textMuted,
              textAlign: i === 0 ? 'left' : i === STEPPER_STAGES.length - 1 ? 'right' : 'center',
            }}
          >
            {STAGE_LABELS[s]}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ─── Pipeline Track ───────────────────────────────────────────────────────────

function PipelineTrack({
  activeStage,
  counts,
  onSelect,
  theme,
}: {
  activeStage: PipelineStage;
  counts: Record<PipelineStage, number>;
  onSelect: (s: PipelineStage) => void;
  theme: AppTheme;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 6, paddingVertical: 2 }}
    >
      {PIPELINE_STAGES.map((stage) => {
        const selected = stage === activeStage;
        const color = stageColor(stage, theme);
        const count = counts[stage];

        return (
          <Pressable key={stage} onPress={() => onSelect(stage)}>
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  paddingHorizontal: 13,
                  paddingVertical: 7,
                  gap: 6,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: selected ? color : theme.colors.border,
                  backgroundColor: selected
                    ? `${color}14`
                    : pressed
                    ? theme.colors.surfaceStrong
                    : theme.colors.surface,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: selected ? '600' : '400',
                    color: selected ? color : theme.colors.textSecondary,
                  }}
                >
                  {STAGE_LABELS[stage]}
                </Text>
                {count > 0 && (
                  <View
                    style={{
                      minWidth: 16,
                      height: 16,
                      borderRadius: 8,
                      backgroundColor: selected ? color : theme.colors.surfaceElevated,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 9,
                        fontWeight: '700',
                        color: selected ? '#fff' : theme.colors.textMuted,
                      }}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ─── Move Stage Row ───────────────────────────────────────────────────────────

function MoveStageRow({
  item,
  onMove,
  onRemove,
  theme,
}: {
  item: QueueItem;
  onMove: (id: string, stage: PipelineStage) => void;
  onRemove: (id: string) => void;
  theme: AppTheme;
}) {
  const next = NEXT_STAGE[item.pipelineStage];

  // Only show reject after the user has actually applied
  const canReject = item.pipelineStage === 'applied' || item.pipelineStage === 'interviewing';

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {next && (
        <Pressable onPress={() => onMove(item.id, next)} style={{ flex: 2 }}>
          {({ pressed }) => (
            <View
              style={{
                borderRadius: theme.radius.md,
                paddingVertical: 11,
                alignItems: 'center',
                backgroundColor: pressed
                  ? theme.colors.textSecondary
                  : theme.colors.textPrimary,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.background }}>
                {item.pipelineStage === 'saved' ? 'Mark as applied →' : `Move to ${STAGE_LABELS[next]} →`}
              </Text>
            </View>
          )}
        </Pressable>
      )}

      {canReject ? (
        <Pressable onPress={() => onMove(item.id, 'rejected')} style={{ flex: 1 }}>
          {({ pressed }) => (
            <View
              style={{
                borderRadius: theme.radius.md,
                paddingVertical: 11,
                alignItems: 'center',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: pressed ? '#E5484D' : theme.colors.border,
                backgroundColor: pressed ? '#E5484D14' : 'transparent',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: pressed ? '#E5484D' : theme.colors.textMuted,
                }}
              >
                Rejected
              </Text>
            </View>
          )}
        </Pressable>
      ):(
        <Pressable onPress={() => Linking.openURL(item?.applyLink || item.sourceUrl)} style={{ flex: 1 }}>
          {({ pressed }) => (
            <View
              style={{
                borderRadius: theme.radius.md,
                paddingVertical: 11,
                alignItems: 'center',
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: pressed ? theme.colors.textSecondary : theme.colors.border,
                backgroundColor: pressed ? '#E5484D14' : 'transparent',
                transform: [{ scale: pressed ? 0.97 : 1 }],
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color: pressed ? theme.colors.textSecondary : theme.colors.textMuted,
                }}
              >
                Apply
              </Text>
            </View>
          )}
        </Pressable>
      )}

      <Pressable onPress={() => onRemove(item.id)} style={{ flex: 1 }}>
        {({ pressed }) => (
          <View
            style={{
              borderRadius: theme.radius.md,
              paddingVertical: 11,
              alignItems: 'center',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
              backgroundColor: pressed ? theme.colors.surfaceStrong : 'transparent',
              transform: [{ scale: pressed ? 0.97 : 1 }],
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: theme.colors.textMuted }}>
              Remove
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── Queue Card ───────────────────────────────────────────────────────────────

function initials(company: string | null | undefined): string {
  if (!company) return '?';
  const words = company.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Status pill style per current stage: filled indigo for "Offered", indigo-tinted
// for the in-progress stages (applied/interviewing), neutral gray otherwise.
function statusPillStyle(stage: PipelineStage, theme: AppTheme): { bg: string; fg: string; label: string } {
  if (stage === 'offered') {
    return { bg: theme.colors.accentBlue, fg: theme.colors.background, label: `${STAGE_LABELS.offered} \u{1F389}` };
  }
  if (stage === 'interviewing' || stage === 'applied') {
    return { bg: theme.colors.surfaceElevated, fg: theme.colors.accentBlue, label: STAGE_LABELS[stage] };
  }
  if (stage === 'rejected') {
    return { bg: `${'#E5484D'}14`, fg: '#E5484D', label: STAGE_LABELS.rejected };
  }
  return { bg: theme.colors.surfaceStrong, fg: theme.colors.textMuted, label: STAGE_LABELS[stage] };
}

function QueueCard({
  item,
  onMove,
  onRemove,
  theme,
  animation,
}: {
  item: QueueItem;
  onMove: (id: string, stage: PipelineStage) => void;
  onRemove: (id: string) => void;
  theme: AppTheme;
  animation: Animated.Value;
}) {
  const pill = statusPillStyle(item.pipelineStage, theme);

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
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: 16,
          gap: 14,
        }}
      >
        {/* Header row: avatar, title+company, status pill */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: 12,
          }}
        >
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 13,
              backgroundColor: theme.colors.surfaceElevated,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontFamily: theme.fontFamily.sansExtraBold,
                fontWeight: '800',
                color: theme.colors.accentBlue,
              }}
            >
              {initials(item.company)}
            </Text>
          </View>

          <View style={{ flex: 1, gap: 2, paddingTop: 1 }}>
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
            </Text>
          </View>

          <View
            style={{
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
              backgroundColor: pill.bg,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: theme.fontFamily.sansSemiBold,
                fontWeight: '600',
                color: pill.fg,
                letterSpacing: 0.2,
              }}
            >
              {pill.label}
            </Text>
          </View>
        </View>

        {/* Stage stepper */}
        <StageStepper stage={item.pipelineStage} theme={theme} />

        {/* AI summary */}
        {item.aiSummary != null && (
          <Text style={{ fontSize: 13, lineHeight: 19, fontFamily: theme.fontFamily.sansMedium, color: theme.colors.textSecondary }}>
            {item.aiSummary}
          </Text>
        )}

        {/* Relevance reason as hint */}
        {item.relevanceReason != null && item.relevanceReason !== item.aiSummary && (
          <View
            style={{
              borderLeftWidth: 2,
              borderLeftColor: theme.colors.border,
              paddingLeft: 10,
            }}
          >
            <Text style={{ fontSize: 12, lineHeight: 17, fontFamily: theme.fontFamily.sansMedium, color: theme.colors.textMuted }}>
              {item.relevanceReason}
            </Text>
          </View>
        )}

        {/* Mono timestamp */}
        <Text
          style={{
            fontSize: 10.5,
            fontFamily: theme.fontFamily.monoRegular,
            color: theme.colors.textMuted,
            letterSpacing: 0.3,
          }}
        >
          UPDATED {timeAgo(item.postedAt).toUpperCase()}
        </Text>

        {/* Actions */}
        <MoveStageRow item={item} onMove={onMove} onRemove={onRemove} theme={theme} />
      </View>
    </Animated.View>
  );
}

// ─── Offered Banner ───────────────────────────────────────────────────────────

function OfferedBanner({ items, theme }: { items: QueueItem[]; theme: AppTheme }) {
  if (items.length === 0) return null;
  return (
    <View
      style={{
        backgroundColor: `${theme.colors.accentRose}10`,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${theme.colors.accentRose}30`,
        padding: 14,
        gap: 4,
      }}
    >
      <Text style={{ fontSize: 13, fontFamily: theme.fontFamily.sansBold, fontWeight: '700', color: theme.colors.accentRose }}>
        🎉 {items.length === 1 ? 'You have an offer!' : `You have ${items.length} offers!`}
      </Text>
      <Text style={{ fontSize: 12, fontFamily: theme.fontFamily.sansMedium, color: theme.colors.textSecondary }}>
        {items.map((i) => `${i.role} at ${i.company ?? 'Unknown'}`).join(' · ')}
      </Text>
    </View>
  );
}

// ─── Empty Stage ──────────────────────────────────────────────────────────────

function EmptyStage({ stage, theme }: { stage: PipelineStage; theme: AppTheme }) {
  const messages: Record<PipelineStage, { title: string; body: string }> = {
    new: { title: 'No new signals', body: 'Fresh opportunities will appear here as Intelligence scans.' },
    saved: { title: 'Nothing saved yet', body: 'Save signals from the Intelligence feed to start tracking them.' },
    applied: { title: 'No applications yet', body: "Move saved opportunities here once you've applied." },
    interviewing: { title: 'No active interviews', body: 'Move applied opportunities here when you hear back.' },
    offered: { title: 'No offers yet', body: "Keep going — you're getting closer." },
    rejected: { title: 'No rejections', body: "That's a good sign. Keep applying." },
  };

  const { title, body } = messages[stage];

  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        padding: 32,
        alignItems: 'center',
        gap: 6,
      }}
    >
      <Text style={{ fontSize: 13, fontFamily: theme.fontFamily.sansSemiBold, fontWeight: '600', color: theme.colors.textMuted }}>
        {title}
      </Text>
      <Text
        style={{ fontSize: 12, fontFamily: theme.fontFamily.sansMedium, color: theme.colors.textMuted, textAlign: 'center', lineHeight: 18 }}
      >
        {body}
      </Text>
    </View>
  );
}

// ─── Queue Screen ─────────────────────────────────────────────────────────────

export default function QueueScreen() {
  const theme = useAppTheme();

  const { data: signalData, isLoading, error, forcedRefetch:  refetch } = useInteligence(["isSaved=true"]);

  // localSignals — seeded from the feed, then mutated locally for pipeline tracking
  const [localSignals, setLocalSignals] = useState<IntelligenceSignal[]>([]);

  useEffect(() => {
    if (signalData?.signals) {
      setLocalSignals(signalData.signals);
    }
  }, [signalData]);

  // Pipeline stage map: signal id → stage. All signals start as 'new'.
  const [stageMap, setStageMap] = useState<Record<string, PipelineStage>>({});
  // Removed ids
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  const [activeStage, setActiveStage] = useState<PipelineStage>('new');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const cardAnims = useRef<Record<string, Animated.Value>>({}).current;

  // Build queue items: localSignals mapped to QueueItem, excluding removed
  const allQueueItems = useMemo<QueueItem[]>(() => {
    return localSignals
      .filter((s) => !removedIds.has(s.id))
      .map((s) => ({
        ...s,
        pipelineStage: stageMap[s.id] ?? s.status ?? 'new',
      }));
  }, [localSignals, stageMap, removedIds]);

  const counts = useMemo<Record<PipelineStage, number>>(
    () => ({
      new: allQueueItems.filter((i) => i.pipelineStage === 'new').length,
      saved: allQueueItems.filter((i) => i.pipelineStage === 'saved').length,
      applied: allQueueItems.filter((i) => i.pipelineStage === 'applied').length,
      interviewing: allQueueItems.filter((i) => i.pipelineStage === 'interviewing').length,
      offered: allQueueItems.filter((i) => i.pipelineStage === 'offered').length,
      rejected: allQueueItems.filter((i) => i.pipelineStage === 'rejected').length,
    }),
    [allQueueItems]
  );

  const offeredItems = useMemo(
    () => allQueueItems.filter((i) => i.pipelineStage === 'offered'),
    [allQueueItems]
  );

  const visibleItems = useMemo(
    () => sortItems(allQueueItems.filter((i) => i.pipelineStage === activeStage), sortKey),
    [allQueueItems, activeStage, sortKey]
  );

  // Animate cards on stage/sort change
  useEffect(() => {
    visibleItems.forEach((item, index) => {
      if (!cardAnims[item.id]) cardAnims[item.id] = new Animated.Value(0);
      const anim = cardAnims[item.id];
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 260,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, [visibleItems, cardAnims]);

  const handleMove = async (id: string, newStage: PipelineStage) => {
    // Optimistic update
    const previousStage = stageMap[id] ?? 'new';
    setStageMap((prev) => ({ ...prev, [id]: newStage }));

    if (newStage === 'offered') {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2800);
    }

    try {
      const updated = await api.patch<IntelligenceSignal>(
        `/signals/${id}`,
        { status: newStage }
      );

      // Sync localSignals with the fully updated signal from backend
      if (updated) {
        setLocalSignals((prev) =>
          prev.map((s) => (s.id === id ? updated : s))
        );
      }
    } catch (err) {
      // Rollback on failure
      console.error('Failed to update signal status:', err);
      setStageMap((prev) => ({ ...prev, [id]: previousStage }));
    }
  };

  const handleRemove = (id: string) => {
    setRemovedIds((prev) => new Set([...prev, id]));
  };

  const getCardAnim = (id: string): Animated.Value => {
    if (!cardAnims[id]) cardAnims[id] = new Animated.Value(1);
    return cardAnims[id];
  };

  // ── Loading ──
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AppHeader />
        <LoadingScreen theme={theme} />
      </View>
    );
  }

  // ── Error ──
  if (error != null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AppHeader />
        <ErrorScreen
          theme={theme}
          onRetry={() => {
            if (typeof refetch === 'function') refetch();
          }}
        />
      </View>
    );
  }

  const activeCount = allQueueItems.filter(
    (i) => i.pipelineStage === 'applied' || i.pipelineStage === 'interviewing'
  ).length;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ConfettiLayer active={showConfetti} />

      <AppHeader />

      {/* Fixed header */}
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
            Applications
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontFamily: theme.fontFamily.sansMedium,
              color: theme.colors.textMuted,
            }}
          >
            {activeCount} active · update stages yourself
          </Text>
        </View>

        <StatsBar items={allQueueItems} theme={theme} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 110, gap: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {offeredItems.length > 0 && (
          <OfferedBanner items={offeredItems} theme={theme} />
        )}

        <PipelineTrack
          activeStage={activeStage}
          counts={counts}
          onSelect={setActiveStage}
          theme={theme}
        />

        {/* Sort + count row */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: theme.fontFamily.sansMedium, fontWeight: '500', color: theme.colors.textMuted }}>
            {visibleItems.length} result{visibleItems.length !== 1 ? 's' : ''} · {STAGE_LABELS[activeStage]}
          </Text>

          <View>
            <Pressable onPress={() => setShowSortMenu((p) => !p)}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    borderRadius: 999,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                    backgroundColor: pressed
                      ? theme.colors.surfaceStrong
                      : theme.colors.surface,
                    transform: [{ scale: pressed ? 0.96 : 1 }],
                  }}
                >
                  <ArrowDownNarrowWide size={16} color={theme.colors.textMuted} />
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: '500',
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {SORT_LABELS[sortKey]}
                  </Text>
                </View>
              )}
            </Pressable>

            {showSortMenu && (
              <View
                style={{
                  position: 'absolute',
                  top: 34,
                  right: 0,
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                  zIndex: 100,
                  minWidth: 160,
                  overflow: 'hidden',
                }}
              >
                {(Object.keys(SORT_LABELS) as SortKey[]).map((key, i) => (
                  <Pressable
                    key={key}
                    onPress={() => {
                      setSortKey(key);
                      setShowSortMenu(false);
                    }}
                  >
                    {({ pressed }) => (
                      <View
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 11,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: pressed
                            ? theme.colors.surfaceStrong
                            : 'transparent',
                          borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                          borderTopColor: theme.colors.border,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: sortKey === key ? '600' : '400',
                            color:
                              sortKey === key
                                ? theme.colors.textPrimary
                                : theme.colors.textSecondary,
                          }}
                        >
                          {SORT_LABELS[key]}
                        </Text>
                        {sortKey === key && (
                          <View
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: theme.colors.accentBlue,
                            }}
                          />
                        )}
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Cards */}
        <View style={{ gap: 10 }}>
          {visibleItems.length === 0 ? (
            <EmptyStage stage={activeStage} theme={theme} />
          ) : (
            visibleItems.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                theme={theme}
                onMove={handleMove}
                onRemove={handleRemove}
                animation={getCardAnim(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}