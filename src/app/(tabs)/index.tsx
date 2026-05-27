import { IntelligenceSignal, intelligenceSignals } from "@/data/mock";
import { useInteligence } from "@/hooks/useInteligence";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { ArrowDownNarrowWide }  from  "lucide-react-native";
import { AppTheme } from "@/theme/tokens";
import { LivePulse } from "@/components/ui";
import { useAppTheme } from "@/theme/use-app-theme";

const CARD_STAGGER_DELAY_MS = 50;
const CARD_ANIMATION_DURATION_MS = 280;
const LOADING_STATE_INTERVAL_MS = 1800;
const LOADING_STATES = ["Scanning sources", "Ranking signals", "Calibrating fit"];

const FILTERS = [
  "All", "Frontend", "Backend", "AI", "Data",
  "Remote", "Nigeria", "Global", "React", "Python",
];

const SORT_OPTIONS = [
  { label: "Best match", value: "match" },
  { label: "Most recent", value: "recent" },
  { label: "Oldest first", value: "oldest" },
  { label: "By platform", value: "platform" },
];

type Signal = IntelligenceSignal;
type SortValue = "match" | "recent" | "oldest" | "platform";

const FILTER_STRATEGIES: Record<string, (s: Signal) => boolean> = {
  All: () => true,
  Frontend: (s) => s.role.toLowerCase().includes("frontend"),
  Backend: (s) => s.role.toLowerCase().includes("backend"),
  AI: (s) =>
    s.role.toLowerCase().includes("ai") ||
    s.skillTags.some((t) => t.toLowerCase().includes("llm")),
  Data: (s) =>
    s.role.toLowerCase().includes("data") || s.roleType === "Data",
  Remote: (s) => s.location.toLowerCase().includes("remote"),
  Nigeria: (s) => s.location.toLowerCase().includes("nigeria"),
  Global: (s) => s.location.toLowerCase().includes("global"),
  React: (s) => s.skillTags.some((t) => t.toLowerCase().includes("react")),
  Python: (s) => s.skillTags.some((t) => t.toLowerCase().includes("python")),
};

const SORT_STRATEGIES: Record<SortValue, (a: Signal, b: Signal) => number> = {
  match: (a, b) => b.aiMatchScore - a.aiMatchScore,
  recent: (a, b) =>
    new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime(),
  oldest: (a, b) =>
    new Date(a.postedAt).getTime() - new Date(b.postedAt).getTime(),
  platform: (a, b) => (a.platform ?? "").localeCompare(b.platform ?? ""),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function scoreLabel(score: number) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Strong";
  if (score >= 70) return "Good";
  return "Fair";
}

function scoreColor(score: number, theme: any): string {
  if (score >= 90) return theme.colors.accentSuccess;
  if (score >= 80) return theme.colors.accentBlue;
  if (score >= 70) return theme.colors.accentViolet;
  return theme.colors.textMuted;
}

function turnDatetoHours(dateStr: string | null): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / 3_600_000);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function roleTypeBadgeColor(roleType: string, theme: any) {
  const map: Record<string, string> = {
    "Software Engineering": theme.colors.accentBlue,
    Data: theme.colors.accentViolet,
    QA: theme.colors.accentWarning,
    Design: theme.colors.accentSuccess,
    Other: theme.colors.textMuted,
  };
  return map[roleType] ?? theme.colors.textMuted;
}

// ─── Score Badge ──────────────────────────────────────────────────────────────
// Fix #2: wide enough to never clip label text

function ScoreBadge({ score, theme }: { score: number; theme: any }) {
  const color = scoreColor(score, theme);
  const label = scoreLabel(score);
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        minWidth: 64,
        paddingHorizontal: 10,
        paddingVertical: 8,
        borderRadius: theme.radius.md,
        backgroundColor: `${color}14`,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${color}35`,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color,
          letterSpacing: -0.5,
          lineHeight: 24,
        }}
      >
        {score}
      </Text>
      <Text
        style={{
          fontSize: 9,
          fontWeight: "600",
          color,
          opacity: 0.75,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── Skill Tag ────────────────────────────────────────────────────────────────

function SkillTag({ tag, theme }: { tag: string; theme: any }) {
  return (
    <View
      style={{
        borderRadius: theme.radius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceStrong,
        paddingHorizontal: 8,
        paddingVertical: 4,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "500",
          color: theme.colors.textSecondary,
        }}
      >
        {tag}
      </Text>
    </View>
  );
}

// ─── Sort Sheet ───────────────────────────────────────────────────────────────

function SortSheet({
  visible,
  activeSort,
  onSelect,
  onClose,
  theme,
}: {
  visible: boolean;
  activeSort: SortValue;
  onSelect: (v: SortValue) => void;
  onClose: () => void;
  theme: any;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "flex-end",
        }}
        onPress={onClose}
      >
        <Pressable>
          <View
            style={{
              backgroundColor: theme.colors.surface,
              borderTopLeftRadius: theme.radius.lg,
              borderTopRightRadius: theme.radius.lg,
              borderWidth: StyleSheet.hairlineWidth,
              borderBottomWidth: 0,
              borderColor: theme.colors.border,
              paddingTop: 12,
              paddingBottom: 40,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: theme.colors.border,
                }}
              />
            </View>

            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.textMuted,
                letterSpacing: 0.8,
                textTransform: "uppercase",
                paddingHorizontal: 20,
                marginBottom: 8,
              }}
            >
              Sort by
            </Text>

            {SORT_OPTIONS.map((opt, i) => {
              const selected = activeSort === opt.value;
              return (
                <Pressable
                  key={opt.value}
                  onPress={() => {
                    onSelect(opt.value as SortValue);
                    onClose();
                  }}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingHorizontal: 20,
                        paddingVertical: 15,
                        backgroundColor: pressed
                          ? theme.colors.surfaceStrong
                          : "transparent",
                        borderTopWidth: i === 0 ? 0 : StyleSheet.hairlineWidth,
                        borderTopColor: theme.colors.border,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: selected ? "600" : "400",
                          color: selected
                            ? theme.colors.textPrimary
                            : theme.colors.textSecondary,
                        }}
                      >
                        {opt.label}
                      </Text>
                      {selected && (
                        <View
                          style={{
                            width: 20,
                            height: 20,
                            borderRadius: 10,
                            backgroundColor: theme.colors.accentBlue,
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Text style={{ fontSize: 11, color: "#fff", fontWeight: "700" }}>
                            ✓
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonCard({ theme, delay }: { theme: any; delay: number }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.7,
          duration: 900,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const Block = ({
    w,
    h = 10,
    radius = 4,
  }: {
    w: number | string;
    h?: number;
    radius?: number;
  }) => (
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
        padding: 16,
        gap: 14,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ gap: 8, flex: 1 }}>
          <Block w="40%" h={10} />
          <Block w="70%" h={18} />
          <Block w="30%" h={10} />
        </View>
        <Block w={64} h={52} radius={theme.radius.md} />
      </View>
      <Block w="100%" h={1} radius={1} />
      <View style={{ gap: 7 }}>
        <Block w="100%" h={10} />
        <Block w="80%" h={10} />
      </View>
      <View style={{ flexDirection: "row", gap: 6 }}>
        <Block w={52} h={24} radius={theme.radius.sm} />
        <Block w={66} h={24} radius={theme.radius.sm} />
        <Block w={44} h={24} radius={theme.radius.sm} />
      </View>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Block w="28%" h={42} radius={theme.radius.md} />
        <Block w="68%" h={42} radius={theme.radius.md} />
      </View>
    </View>
  );
}

// ─── Loading Screen ───────────────────────────────────────────────────────────

function LoadingScreen({ theme }: { theme: any }) {
  const [stateIndex, setStateIndex] = useState(0);

  useEffect(() => {
    const iv = setInterval(
      () => setStateIndex((p) => (p + 1) % LOADING_STATES.length),
      LOADING_STATE_INTERVAL_MS
    );
    return () => clearInterval(iv);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingVertical: 4,
          }}
        >
          <LivePulse theme={theme} />
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: theme.colors.textMuted,
            }}
          >
            {LOADING_STATES[stateIndex]}
          </Text>
        </View>
        {[0, 1, 2].map((i) => (
          <SkeletonCard key={i} theme={theme} delay={i * 120} />
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
  theme: any;
  onRetry: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colors.background,
        padding: 16,
        justifyContent: "center",
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ height: 3, backgroundColor: "#E5484D" }} />
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.textPrimary,
              }}
            >
              Feed unavailable
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                lineHeight: 19,
              }}
            >
              The intelligence feed failed to respond. Saved opportunities are
              unaffected.
            </Text>
          </View>
          <Pressable onPress={onRetry}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: theme.radius.md,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: pressed
                    ? theme.colors.surfaceStrong
                    : "transparent",
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.colors.textPrimary,
                  }}
                >
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

// ─── Empty Screen ─────────────────────────────────────────────────────────────

function EmptyScreen({ theme, filter }: { theme: any; filter: string }) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        padding: 32,
        alignItems: "center",
        gap: 6,
      }}
    >
      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: theme.colors.textMuted,
        }}
      >
        No {filter} signals
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: theme.colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        Try a different filter or check back soon.
      </Text>
    </View>
  );
}

// ─── Stats Bar ────────────────────────────────────────────────────────────────
// Fix #4: proper card container with background + border

function StatsBar({ signals, total, theme }: { signals: Signal[]; total: number; theme: any }) {
  const remote = signals.filter((s) =>
    s.location?.toLowerCase().includes("remote")
  ).length;
  const highMatch = signals.filter((s) => s.aiMatchScore >= 85).length;
  const open = signals.filter((s) => s.applicationStatus === "Open").length;

  const Stat = ({
    label,
    value,
    color,
  }: {
    label: string;
    value: number;
    color: string;
  }) => (
    <View style={{ flex: 1, alignItems: "center", gap: 3 }}>
      <Text
        style={{
          fontSize: 22,
          fontWeight: "700",
          color,
          letterSpacing: -0.8,
        }}
      >
        {value}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: "500",
          color: theme.colors.textMuted,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        paddingVertical: 16,
        paddingHorizontal: 8,
      }}
    >
      <Stat label="Total" value={total} color={theme.colors.textPrimary} />
      <View
        style={{
          width: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginVertical: 4,
        }}
      />
      <Stat label="Remote" value={remote} color={theme.colors.accentBlue} />
      <View
        style={{
          width: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginVertical: 4,
        }}
      />
      <Stat label="≥85 fit" value={highMatch} color={theme.colors.accentSuccess} />
      <View
        style={{
          width: StyleSheet.hairlineWidth,
          backgroundColor: theme.colors.border,
          marginVertical: 4,
        }}
      />
      <Stat label="Open" value={open} color={theme.colors.accentViolet} />
    </View>
  );
}

// ─── Signal Card ──────────────────────────────────────────────────────────────

function SignalCard({
  item,
  theme,
  saved,
  onSave,
  onView,
  animation,
}: {
  item: Signal;
  theme: AppTheme;
  saved: boolean;
  onSave: () => void;
  onView: () => void;
  animation: Animated.Value;
}) {
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const accent = scoreColor(item.aiMatchScore, theme);
  const badgeColor = roleTypeBadgeColor(item.roleType ?? "Other", theme);

  const skills = (item.skillAlignment ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: "hidden",
        }}
      >
        {/* Fix #7: thicker, more visible score stripe */}
        <View
          style={{
            height: 3,
            backgroundColor: theme.colors.surfaceElevated,
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${item.aiMatchScore}%`,
              backgroundColor: accent,
              opacity: 0.85,
            }}
          />
        </View>

        <View style={{ padding: 16, gap: 14 }}>

          {/* Fix #6: clear hierarchy — company muted small, role bold large */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 12,
            }}
          >
            <View style={{ flex: 1, gap: 3 }}>
              {/* Company — small muted */}
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: theme.colors.textMuted,
                  letterSpacing: 0.3,
                  textTransform: "uppercase",
                }}
              >
                {item.company ?? "Unknown"}
              </Text>

              {/* Role — large bold, clear dominance */}
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: theme.colors.textPrimary,
                  letterSpacing: -0.4,
                  lineHeight: 24,
                }}
                numberOfLines={2}
              >
                {item.role}
              </Text>

              {/* Location / mode row */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    backgroundColor:
                      item.roleMode === "Remote"
                        ? `${theme.colors.accentSuccess}18`
                        : theme.colors.surfaceStrong,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 10,
                      fontWeight: "600",
                      letterSpacing: 0.4,
                      color:
                        item.roleMode === "Remote"
                          ? theme.colors.accentSuccess
                          : theme.colors.textMuted,
                    }}
                  >
                    {item.roleMode ?? "On-site"}
                  </Text>
                </View>
                {item.location !== "Unknown" &&
                  item.location !== "Remote" && (
                    <Text
                      style={{ fontSize: 11, color: theme.colors.textMuted }}
                    >
                      {item.location}
                    </Text>
                  )}
              </View>
            </View>

            {/* Fix #2: ScoreBadge with fixed min-width */}
            <ScoreBadge score={item.aiMatchScore} theme={theme} />
          </View>

          {/* Divider */}
          <View
            style={{
              height: StyleSheet.hairlineWidth,
              backgroundColor: theme.colors.border,
            }}
          />

          {/* AI summary */}
          {item.aiSummary != null && (
            <Text
              style={{
                fontSize: 13,
                lineHeight: 20,
                color: theme.colors.textSecondary,
              }}
            >
              {item.aiSummary}
            </Text>
          )}

          {/* Relevance reason */}
          {item.relevanceReason && item.relevanceReason !== item.aiSummary && (
            <View
              style={{
                borderLeftWidth: 2,
                borderLeftColor: theme.colors.border,
                paddingLeft: 10,
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 18,
                  color: theme.colors.textMuted,
                }}
              >
                {item.relevanceReason}
              </Text>
            </View>
          )}

          {/* Skill tags */}
          {skills.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
            >
              {skills.map((s) => (
                <SkillTag key={s} tag={s} theme={theme} />
              ))}
              {(item.skillTags ?? []).slice(0, 2).map((tag) => (
                <SkillTag key={`x-${tag}`} tag={tag} theme={theme} />
              ))}
            </ScrollView>
          )}

          {/* Meta row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontSize: 11, color: theme.colors.textMuted }}>
                {timeAgo(item.postedAt)}
              </Text>
              {item.pay != null && (
                <View
                  style={{
                    borderRadius: theme.radius.sm,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    backgroundColor: `${theme.colors.accentSuccess}10`,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: `${theme.colors.accentSuccess}25`,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: '600',
                      color: theme.colors.accentSuccess,
                    }}
                  >
                    {item.pay}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {item.roleType && (
                <View
                  style={{
                    borderRadius: theme.radius.sm,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    backgroundColor: `${badgeColor}12`,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: `${badgeColor}28`,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '600', color: badgeColor, letterSpacing: 0.3 }}>
                    {item.roleType}
                  </Text>
                </View>
              )}
              <Text style={{ fontSize: 10, color: theme.colors.textMuted }}>
                {item.extractionConfidence === 'High' ? 'High confidence' : 'Medium confidence'}
              </Text>
            </View>
          </View>

          {/* Fix #5: CTA — Save outline, Apply solid dark with contrast */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={onSave} style={{ flex: 1 }}>
              {({ pressed }) => (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: theme.radius.md,
                    paddingVertical: 12,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: saved ? accent : theme.colors.border,
                    backgroundColor: saved
                      ? `${accent}12`
                      : pressed
                      ? theme.colors.surfaceStrong
                      : "transparent",
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: saved ? accent : theme.colors.textSecondary,
                    }}
                  >
                    {saved ? "✓ Saved" : "Save"}
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable onPress={onView} style={{ flex: 2.2 }}>
              {({ pressed }) => (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                    borderRadius: theme.radius.md,
                    paddingVertical: 12,
                    // Fix #5: solid high-contrast button, not washed-out white
                    backgroundColor: pressed
                      ? theme.colors.textSecondary
                      : theme.colors.textPrimary,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.colors.background,
                    }}
                  >
                    View Opportunity
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: theme.colors.background,
                      opacity: 0.55,
                    }}
                  >
                    ↗
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Source toggle */}
          <Pressable onPress={() => setSourceExpanded((p) => !p)}>
            {({ pressed }) => (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  opacity: pressed ? 0.5 : 1,
                }}
              >
                <View
                  style={{
                    flex: 1,
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: theme.colors.border,
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    color: theme.colors.textMuted,
                    letterSpacing: 0.6,
                    textTransform: "uppercase",
                  }}
                >
                  Source {sourceExpanded ? "▲" : "▼"}
                </Text>
                <View
                  style={{
                    flex: 1,
                    height: StyleSheet.hairlineWidth,
                    backgroundColor: theme.colors.border,
                  }}
                />
              </View>
            )}
          </Pressable>

          {sourceExpanded && (
            <View
              style={{
                backgroundColor: theme.colors.surfaceStrong,
                borderRadius: theme.radius.sm,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: theme.colors.border,
                padding: 12,
                gap: 8,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "600",
                    color: theme.colors.textMuted,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                  }}
                >
                  {item.platform} · @{item.sourceHandle}
                </Text>
                <Text
                  style={{ fontSize: 10, color: theme.colors.textMuted }}
                >
                  {item.applicationStatus}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 11,
                  lineHeight: 17,
                  color: theme.colors.textMuted,
                  fontFamily: "monospace",
                }}
              >
                {item.sourcePostPreview ?? "No preview available."}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Intelligence Screen ──────────────────────────────────────────────────────

export default function IntelligenceScreen() {
  const theme = useAppTheme();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState("All");
  const [activeSort, setActiveSort] = useState<SortValue>("match");
  const [sortSheetVisible, setSortSheetVisible] = useState(false);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [scanningStateIndex, setScanningStateIndex] = useState(0);

  const cardAnimations = useRef<Record<string, Animated.Value>>({}).current;

  const intelligenceResult = useInteligence();
  const { data: intelligenceSignals, isLoading, error } = intelligenceResult;
  const signals: Signal[] = intelligenceSignals?.signals ?? [];

  useEffect(() => {
    const iv = setInterval(
      () => setScanningStateIndex((p) => (p + 1) % LOADING_STATES.length),
      LOADING_STATE_INTERVAL_MS
    );
    return () => clearInterval(iv);
  }, []);

  const getCardAnimation = useCallback(
    (id: string) => {
      if (!cardAnimations[id]) cardAnimations[id] = new Animated.Value(0);
      return cardAnimations[id];
    },
    [cardAnimations]
  );

  const filteredAndSorted = useMemo(() => {
    const strategy = FILTER_STRATEGIES[activeFilter];
    const filtered = signals.filter((s) => (strategy ? strategy(s) : true));
    return [...filtered].sort(SORT_STRATEGIES[activeSort]);
  }, [activeFilter, activeSort, signals]);

  useEffect(() => {
    if (filteredAndSorted.length === 0) return;
    Animated.stagger(
      CARD_STAGGER_DELAY_MS,
      filteredAndSorted.map((signal) => {
        const anim = getCardAnimation(signal.id);
        anim.setValue(0);
        return Animated.timing(anim, {
          toValue: 1,
          duration: CARD_ANIMATION_DURATION_MS,
          useNativeDriver: true,
        });
      })
    ).start();
  }, [filteredAndSorted, getCardAnimation]);

  const toggleSave = (id: string) =>
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Sort";

  if (isLoading) return <LoadingScreen theme={theme} />;
  if (error != null) {
    return (
      <ErrorScreen
        theme={theme}
        onRetry={() => {
          if (typeof (intelligenceResult as any).refetch === "function")
            (intelligenceResult as any).refetch();
        }}
      />
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <SortSheet
        visible={sortSheetVisible}
        activeSort={activeSort}
        onSelect={setActiveSort}
        onClose={() => setSortSheetVisible(false)}
        theme={theme}
      />

      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 40,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats bar — sits right below the tab header */}
        {signals.length > 0 && <StatsBar signals={signals} total={intelligenceSignals?.total  || 0} theme={theme} />}

        {/* Fix #3: filters and sort on separate lines, visually aligned */}
        {/* Filter row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6 }}
        >
          {FILTERS.map((filter) => {
            const selected = activeFilter === filter;
            return (
              <Pressable key={filter} onPress={() => setActiveFilter(filter)}>
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: selected
                        ? theme.colors.textPrimary
                        : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.textPrimary
                        : pressed
                        ? theme.colors.surfaceStrong
                        : theme.colors.surface,
                      transform: [{ scale: pressed ? 0.96 : 1 }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: selected ? "600" : "400",
                        color: selected
                          ? theme.colors.background
                          : theme.colors.textSecondary,
                      }}
                    >
                      {filter}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Sort + result count row — separate from filters */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontWeight: "500",
              color: theme.colors.textMuted,
            }}
          >
            {filteredAndSorted.length} result
            {filteredAndSorted.length !== 1 ? "s" : ""}
            {activeFilter !== "All" ? ` · ${activeFilter}` : ""}
          </Text>

          {/* Fix #3: sort button its own row, proper weight */}
          <Pressable onPress={() => setSortSheetVisible(true)}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: theme.colors.border,
                  backgroundColor: pressed
                    ? theme.colors.surfaceStrong
                    : theme.colors.surface,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                }}
              >
                <ArrowDownNarrowWide size={16} color={theme.colors.textMuted} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: theme.colors.textSecondary,
                  }}
                >
                  {activeSortLabel}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Cards */}
        <View style={{ gap: 10 }}>
          {filteredAndSorted.length === 0 ? (
            <EmptyScreen theme={theme} filter={activeFilter} />
          ) : (
            filteredAndSorted.map((item) => (
              <SignalCard
                key={item.id}
                item={item}
                theme={theme}
                saved={Boolean(savedIds[item.id])}
                onSave={() => toggleSave(item.id)}
                onView={() =>
                  router.push({
                    pathname: "/opportunity/[id]",
                    params: { id: item.id },
                  })
                }
                animation={getCardAnimation(item.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}