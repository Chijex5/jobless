import { IntelligenceSignal } from "@/data/mock";
import { useInteligence } from "@/hooks/useInteligence";
import { useRouter } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ArrowDownNarrowWide,
  Check,
  Search,
  X,
} from "lucide-react-native";
import { AppTheme } from "@/theme/tokens";
import { LivePulse, ScoreRing } from "@/components/ui";
import { AppHeader } from "@/components/app-header";
import { useAppTheme } from "@/theme/use-app-theme";
import { api } from "@/lib/backend";

// ─── Constants ────────────────────────────────────────────────────────────────

const CARD_STAGGER_DELAY_MS      = 50;
const CARD_ANIMATION_DURATION_MS = 280;
const LOADING_STATE_INTERVAL_MS  = 1800;
const SOFT_SEARCH_DEBOUNCE_MS    = 800;  // pause-and-fetch, no loader

const LOADING_STATES = [
  "Scanning sources",
  "Ranking signals",
  "Calibrating fit",
];

// ─── Filter configuration ─────────────────────────────────────────────────────

type FilterParam =
  | { role_category: string }
  | { location_filter: string }
  | { skill_filter: string }
  | Record<string, never>;

interface FilterConfig {
  label: string;
  params: FilterParam;
}

const FILTERS: FilterConfig[] = [
  { label: "All",      params: {} },
  { label: "Frontend", params: { role_category: "frontend" } },
  { label: "Backend",  params: { role_category: "backend"  } },
  { label: "AI / ML",  params: { role_category: "ai"       } },
  { label: "Data",     params: { role_category: "data"     } },
  { label: "Mobile",   params: { role_category: "mobile"   } },
  { label: "DevOps",   params: { role_category: "devops"   } },
  { label: "QA",       params: { role_category: "qa"       } },
  { label: "Remote",   params: { location_filter: "remote"  } },
  { label: "Nigeria",  params: { location_filter: "nigeria" } },
  { label: "Global",   params: { location_filter: "global"  } },
  { label: "React",    params: { skill_filter: "react"  } },
  { label: "Python",   params: { skill_filter: "python" } },
  { label: "Node.js",  params: { skill_filter: "node"   } },
];

const SORT_OPTIONS: { label: string; value: SortValue }[] = [
  { label: "Best match",   value: "match"    },
  { label: "Most recent",  value: "newest"   },
  { label: "Oldest first", value: "oldest"   },
  { label: "By platform",  value: "platform" },
];

const PLATFORM_LABELS: Record<string, string> = {
  remotive:  "Remotive",
  telegram:  "Telegram",
  jobberman: "Jobberman",
  myjobmag:  "MyJobMag",
  himalayas: "Himalayas",
};

function platformLabel(p?: string | null) {
  if (!p) return null;
  return PLATFORM_LABELS[p.toLowerCase()] ?? p;
}

interface SaveSignalRequest  { status: string }
interface SaveSignalResponse extends IntelligenceSignal {}

type Signal    = IntelligenceSignal;
type SortValue = "match" | "newest" | "oldest" | "platform";

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Mirrors ScoreRing's own threshold so accents elsewhere on the card (e.g.
// the "save" button outline) match the ring's indigo / muted-gray language.
function scoreColor(score: number, theme: AppTheme): string {
  return score >= 70 ? theme.colors.accentBlue : theme.colors.textMuted;
}

function initials(text: string): string {
  return (text ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("") || "?";
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Recently";
  const diff = Date.now() - new Date(dateStr).getTime();
  const h    = Math.floor(diff / 3_600_000);
  if (h < 1)  return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── SkillTag ─────────────────────────────────────────────────────────────────

// Indigo-tinted pill with a small checkmark — used for derived match facets
// (work mode, top skills, seniority) on the hero + standard cards.
function SkillTag({ tag, theme }: { tag: string; theme: AppTheme }) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: 9,
        paddingVertical: 5,
      }}
    >
      <Check size={11} color={theme.colors.accentBlue} strokeWidth={2.5} />
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          fontFamily: theme.fontFamily.sansSemiBold,
          color: theme.colors.accentBlue,
        }}
      >
        {tag}
      </Text>
    </View>
  );
}

// ─── WorkModeBadge ────────────────────────────────────────────────────────────

function WorkModeBadge({
  roleMode,
  theme,
}: {
  roleMode?: string | null;
  theme: AppTheme;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        borderRadius: theme.radius.sm,
        paddingHorizontal: 9,
        paddingVertical: 4,
        backgroundColor: theme.colors.surfaceStrong,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          fontFamily: theme.fontFamily.sansSemiBold,
          color: theme.colors.textSecondary,
          letterSpacing: 0.2,
        }}
      >
        {roleMode ?? "On-site"}
      </Text>
    </View>
  );
}

// ─── PlatformBadge ────────────────────────────────────────────────────────────

function PlatformBadge({
  platform,
  theme,
}: {
  platform?: string | null;
  theme: AppTheme;
}) {
  const label = platformLabel(platform);
  if (!label) return null;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        borderRadius: theme.radius.sm,
        paddingHorizontal: 7,
        paddingVertical: 3,
        backgroundColor: theme.colors.surfaceStrong,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
      }}
    >
      <Text
        style={{
          fontSize: 10,
          fontWeight: "600",
          fontFamily: theme.fontFamily.monoRegular,
          color: theme.colors.textMuted,
          letterSpacing: 0.2,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

// ─── SearchBar ────────────────────────────────────────────────────────────────
//
// Two search modes:
//   • Soft  — debounced 800ms after the user pauses typing; results update
//             silently in the background (no loader shown).
//   • Hard  — triggered immediately when the user presses the keyboard's
//             Search/Enter key; the full loading skeleton is shown.
//
// The component surfaces `onSoftSearch` and `onHardSearch` so the parent
// can apply each mode's different loading behaviour.

function SearchBar({
  value,
  onChangeText,
  onSoftSearch,
  onHardSearch,
  isSoftSearching,
  theme,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSoftSearch: (query: string) => void;
  onHardSearch: (query: string) => void;
  isSoftSearching: boolean;
  theme: AppTheme;
}) {
  const [focused, setFocused]   = useState(false);
  const borderAnim              = useRef(new Animated.Value(0)).current;
  const softDebounce            = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef                = useRef<TextInput>(null);

  useEffect(() => {
    Animated.timing(borderAnim, {
      toValue: focused ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [focused]);

  const borderColor = borderAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [theme.colors.border, theme.colors.accentBlue],
  });

  // Called on every keystroke — schedules a soft search after the user pauses.
  const handleChange = (text: string) => {
    onChangeText(text);

    // Clear any pending soft-search timer.
    if (softDebounce.current) clearTimeout(softDebounce.current);

    // Schedule a soft search if there's something to search.
    const trimmed = text.trim();
    softDebounce.current = setTimeout(() => {
      onSoftSearch(trimmed);
    }, SOFT_SEARCH_DEBOUNCE_MS);
  };

  // Called when the user taps the keyboard's Search / Go / Enter key.
  const handleSubmitEditing = () => {
    // Cancel the in-flight soft debounce — hard search takes over.
    if (softDebounce.current) clearTimeout(softDebounce.current);
    onHardSearch(value.trim());
  };

  // Clear the field and reset both search states.
  const handleClear = () => {
    if (softDebounce.current) clearTimeout(softDebounce.current);
    onChangeText("");
    onSoftSearch("");   // silently clear backend results
    inputRef.current?.focus();
  };

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      if (softDebounce.current) clearTimeout(softDebounce.current);
    };
  }, []);

  return (
    <Animated.View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        borderRadius: theme.radius.pill,
        borderWidth: 1,
        borderColor,
        backgroundColor: theme.colors.surface,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      {/* Icon — pulses subtly while a soft search is in-flight */}
      <Animated.View style={{ opacity: isSoftSearching ? 0.45 : 1 }}>
        <Search
          size={16}
          color={focused ? theme.colors.accentBlue : theme.colors.textMuted}
          strokeWidth={2}
        />
      </Animated.View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onSubmitEditing={handleSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Search roles, companies, skills…"
        placeholderTextColor={theme.colors.textMuted}
        returnKeyType="search"   // shows "Search" label on the keyboard
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          flex: 1,
          fontSize: 14,
          color: theme.colors.textPrimary,
          padding: 0,
          margin: 0,
        }}
      />

      {/* Soft-search activity indicator — three fading dots */}
      {isSoftSearching && value.length > 0 && (
        <SoftSearchIndicator theme={theme} />
      )}

      {value.length > 0 && !isSoftSearching && (
        <Pressable onPress={handleClear} hitSlop={8}>
          <View
            style={{
              width: 18,
              height: 18,
              borderRadius: 9,
              backgroundColor: theme.colors.textMuted,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={11} color={theme.colors.background} strokeWidth={2.5} />
          </View>
        </Pressable>
      )}
    </Animated.View>
  );
}

// ─── SoftSearchIndicator ─────────────────────────────────────────────────────
// Three small pulsing dots shown inside the search bar while a background
// (soft) fetch is in-flight. Deliberately subtle — the user can keep typing.

function SoftSearchIndicator({ theme }: { theme: AppTheme }) {
  const dots = [
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
    useRef(new Animated.Value(0.3)).current,
  ];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 350,
            useNativeDriver: true,
          }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
      {dots.map((dot, i) => (
        <Animated.View
          key={i}
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            backgroundColor: theme.colors.accentBlue,
            opacity: dot,
          }}
        />
      ))}
    </View>
  );
}

// ─── SortSheet ────────────────────────────────────────────────────────────────

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
  theme: AppTheme;
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
          backgroundColor: "rgba(0,0,0,0.6)",
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
                fontFamily: theme.fontFamily.monoRegular,
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
                    onSelect(opt.value);
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
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.colors.background,
                              fontWeight: "700",
                            }}
                          >
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

// ─── SkeletonCard ─────────────────────────────────────────────────────────────

function SkeletonCard({ theme, delay }: { theme: AppTheme; delay: number }) {
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

// ─── LoadingScreen ────────────────────────────────────────────────────────────

function LoadingScreen({ theme }: { theme: AppTheme }) {
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
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
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

// ─── ErrorScreen ──────────────────────────────────────────────────────────────

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
        <View
          style={{ height: 3, backgroundColor: theme.colors.accentError }}
        />
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

// ─── EmptyScreen ──────────────────────────────────────────────────────────────

function EmptyScreen({
  theme,
  filter,
  searchQuery,
}: {
  theme: AppTheme;
  filter: string;
  searchQuery: string;
}) {
  const isSearch = searchQuery.length > 0;
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
        {isSearch
          ? `No results for "${searchQuery}"`
          : `No ${filter} signals`}
      </Text>
      <Text
        style={{
          fontSize: 12,
          color: theme.colors.textMuted,
          textAlign: "center",
          lineHeight: 18,
        }}
      >
        {isSearch
          ? "Try a different keyword or clear the search."
          : "Try a different filter or check back soon."}
      </Text>
    </View>
  );
}

// ─── StatsBar ─────────────────────────────────────────────────────────────────

function StatsBar({
  signals,
  total,
  theme,
}: {
  signals: Signal[];
  total: number;
  theme: AppTheme;
}) {
  const remote    = signals.filter((s) =>
    s.location?.toLowerCase().includes("remote")
  ).length;
  const highMatch = signals.filter((s) => s.aiMatchScore >= 85).length;
  const open      = signals.filter(
    (s) => s.applicationStatus === "Open"
  ).length;

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
          fontFamily: theme.fontFamily.monoRegular,
          color: theme.colors.textMuted,
          letterSpacing: 0.3,
          textTransform: "uppercase",
        }}
      >
        {label}
      </Text>
    </View>
  );

  const Divider = () => (
    <View
      style={{
        width: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
      }}
    />
  );

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        paddingVertical: 16,
        paddingHorizontal: 8,
      }}
    >
      <Stat label="Total"   value={total}     color={theme.colors.textPrimary}  />
      <Divider />
      <Stat label="Remote"  value={remote}    color={theme.colors.accentBlue}   />
      <Divider />
      <Stat label="≥85 fit" value={highMatch} color={theme.colors.accentRose}   />
      <Divider />
      <Stat label="Open"    value={open}      color={theme.colors.accentViolet} />
    </View>
  );
}

// ─── PaginationBar ────────────────────────────────────────────────────────────

function PaginationBar({
  page,
  pages,
  onPrev,
  onNext,
  theme,
}: {
  page: number;
  pages: number;
  onPrev: () => void;
  onNext: () => void;
  theme: AppTheme;
}) {
  if (pages <= 1) return null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.lg,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        paddingHorizontal: 16,
        paddingVertical: 12,
      }}
    >
      <Pressable onPress={onPrev} disabled={page <= 1}>
        {({ pressed }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: page <= 1 ? 0.3 : pressed ? 0.7 : 1,
              transform: [{ scale: pressed && page > 1 ? 0.97 : 1 }],
            }}
          >
            <Text style={{ fontSize: 14, color: theme.colors.textPrimary }}>
              ←
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: theme.colors.textPrimary,
              }}
            >
              Prev
            </Text>
          </View>
        )}
      </Pressable>

      <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
        Page{" "}
        <Text
          style={{ fontWeight: "700", color: theme.colors.textPrimary }}
        >
          {page}
        </Text>{" "}
        of{" "}
        <Text
          style={{ fontWeight: "700", color: theme.colors.textPrimary }}
        >
          {pages}
        </Text>
      </Text>

      <Pressable onPress={onNext} disabled={page >= pages}>
        {({ pressed }) => (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              opacity: page >= pages ? 0.3 : pressed ? 0.7 : 1,
              transform: [{ scale: pressed && page < pages ? 0.97 : 1 }],
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "500",
                color: theme.colors.textPrimary,
              }}
            >
              Next
            </Text>
            <Text style={{ fontSize: 14, color: theme.colors.textPrimary }}>
              →
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── SignalCard ───────────────────────────────────────────────────────────────

// Pulls a short real "why it matches / why it doesn't" clause out of the
// existing skillAlignment / aiSummary fields — never invents new text.
function deriveReasonLine(item: Signal): { text: string; positive: boolean } | null {
  const source = item.skillAlignment || item.relevanceReason || item.aiSummary;
  if (!source) return null;
  const firstClause = source.split(/[.!?]/)[0]?.trim();
  if (!firstClause) return null;
  const negativeHints = /\bweak|lack|gap|missing|require[s]? stronger|limited\b/i;
  const positive = !negativeHints.test(firstClause);
  return { text: firstClause, positive };
}

// Derives the small indigo checkmark pills (work mode, top skills, seniority)
// strictly from real fields — roleMode, skillTags, roleType.
function deriveFacetTags(item: Signal): string[] {
  const tags: string[] = [];
  if (item.roleMode) tags.push(item.roleMode);
  for (const tag of item.skillTags ?? []) {
    if (tags.length >= 4) break;
    if (!tags.includes(tag)) tags.push(tag);
  }
  if (tags.length < 4 && item.roleType && !tags.includes(item.roleType)) {
    tags.push(item.roleType);
  }
  return tags.slice(0, 4);
}

function InitialsAvatar({
  text,
  size,
  theme,
}: {
  text: string;
  size: number;
  theme: AppTheme;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.27,
        backgroundColor: theme.colors.surfaceStrong,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size * 0.34,
          fontFamily: theme.fontFamily.mono,
          color: theme.colors.textSecondary,
          letterSpacing: 0.2,
        }}
      >
        {initials(text)}
      </Text>
    </View>
  );
}

function SignalCard({
  item,
  theme,
  saved,
  onSave,
  loading,
  onView,
  animation,
  isHero = false,
}: {
  item: Signal;
  theme: AppTheme;
  saved: boolean;
  loading: boolean;
  onSave: () => void;
  onView: () => void;
  animation: Animated.Value;
  isHero?: boolean;
}) {
  const [sourceExpanded, setSourceExpanded] = useState(false);
  const accent    = scoreColor(item.aiMatchScore, theme);
  const facetTags = deriveFacetTags(item);
  const reason    = isHero ? null : deriveReasonLine(item);

  return (
    <Animated.View
      style={{
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange:  [0, 1],
              outputRange: [16, 0],
            }),
          },
        ],
      }}
    >
      <View
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: isHero ? 22 : 18,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          overflow: "hidden",
        }}
      >
        <View style={{ padding: isHero ? 18 : 14, gap: isHero ? 14 : 10 }}>
          {/* ── Top label row (hero only) ── */}
          {isHero && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: theme.fontFamily.monoRegular,
                  color: theme.colors.accentBlue,
                  letterSpacing: 0.8,
                  textTransform: "uppercase",
                }}
              >
                ★ Top match
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: theme.fontFamily.monoRegular,
                  color: theme.colors.textMuted,
                  letterSpacing: 0.4,
                }}
              >
                {timeAgo(item.postedAt)}
              </Text>
            </View>
          )}

          {/* ── Row: avatar + title/subtitle + score ring ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
            }}
          >
            <InitialsAvatar
              text={item.company ?? item.role}
              size={isHero ? 48 : 44}
              theme={theme}
            />

            <View style={{ flex: 1, gap: 2 }}>
              <Text
                style={{
                  fontSize: isHero ? 17 : 15,
                  fontWeight: "700",
                  fontFamily: theme.fontFamily.sansBold,
                  color: theme.colors.textPrimary,
                  letterSpacing: -0.3,
                  lineHeight: isHero ? 22 : 20,
                }}
                numberOfLines={2}
              >
                {item.role}
              </Text>
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: theme.fontFamily.sansMedium,
                  color: theme.colors.textMuted,
                }}
                numberOfLines={1}
              >
                {[item.company, item.location, item.pay]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>

            <ScoreRing
              theme={theme}
              score={item.aiMatchScore}
              size={isHero ? 60 : 46}
            />
          </View>

          {/* ── Facet tags (hero) ── */}
          {isHero && facetTags.length > 0 && (
            <View
              style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}
            >
              {facetTags.map((tag) => (
                <SkillTag key={tag} tag={tag} theme={theme} />
              ))}
            </View>
          )}

          {/* ── Reasoning line (standard cards) ── */}
          {!isHero && reason && (
            <View
              style={{ flexDirection: "row", alignItems: "flex-start", gap: 6 }}
            >
              {reason.positive ? (
                <Check
                  size={13}
                  color={theme.colors.accentBlue}
                  strokeWidth={2.5}
                  style={{ marginTop: 2 }}
                />
              ) : (
                <X
                  size={13}
                  color={theme.colors.textMuted}
                  strokeWidth={2.5}
                  style={{ marginTop: 2 }}
                />
              )}
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 17,
                  fontFamily: theme.fontFamily.sansMedium,
                  color: theme.colors.textSecondary,
                }}
                numberOfLines={2}
              >
                {reason.text}
              </Text>
            </View>
          )}

          {/* ── AI summary (hero only — fuller context for the top card) ── */}
          {isHero && item.aiSummary != null && (
            <Text
              style={{
                fontSize: 13,
                lineHeight: 19,
                fontFamily: theme.fontFamily.sansMedium,
                color: theme.colors.textSecondary,
              }}
            >
              {item.aiSummary}
            </Text>
          )}

          {/* ── Meta row ── */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 6,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}
            >
              {!isHero && <WorkModeBadge roleMode={item.roleMode} theme={theme} />}
              <PlatformBadge platform={item.platform} theme={theme} />
              {!isHero && (
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: theme.fontFamily.monoRegular,
                    color: theme.colors.textMuted,
                  }}
                >
                  {timeAgo(item.postedAt)}
                </Text>
              )}
            </View>
          </View>

          {/* ── CTAs ── */}
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={onSave} style={{ flex: 1 }}>
              {({ pressed }) => (
                <View
                  style={{
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: theme.radius.md,
                    paddingVertical: 11,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: saved ? theme.colors.accentBlue : theme.colors.border,
                    backgroundColor: saved
                      ? theme.colors.surfaceElevated
                      : pressed
                      ? theme.colors.surfaceStrong
                      : theme.colors.surface,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      fontFamily: theme.fontFamily.sansSemiBold,
                      color: saved ? theme.colors.accentBlue : theme.colors.textSecondary,
                    }}
                  >
                    {loading
                      ? saved
                        ? "Removing…"
                        : "Saving…"
                      : saved
                      ? "✓ Saved"
                      : "Save"}
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
                    paddingVertical: 11,
                    backgroundColor: theme.colors.accentBlue,
                    opacity: pressed ? 0.85 : 1,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "700",
                      fontFamily: theme.fontFamily.sansBold,
                      color: "#FFFFFF",
                    }}
                  >
                    View opportunity
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* ── Source toggle ── */}
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
                    fontFamily: theme.fontFamily.monoRegular,
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
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: theme.fontFamily.monoRegular,
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
                  fontFamily: theme.fontFamily.monoRegular,
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

// ─── IntelligenceScreen ───────────────────────────────────────────────────────

export default function IntelligenceScreen() {
  const theme  = useAppTheme();
  const router = useRouter();

  const [activeFilterIndex, setActiveFilterIndex] = useState(0);
  const [activeSort, setActiveSort]               = useState<SortValue>("match");
  const [page, setPage]                           = useState(1);
  const [sortSheetVisible, setSortSheetVisible]   = useState(false);
  const [saveLoading, setSaveLoading]             = useState(false);
  const [isRefreshing, setIsRefreshing]           = useState(false);

  // ── Search state ──────────────────────────────────────────────────────────
  //
  // searchInput   — raw value bound to the TextInput (updates on every keystroke)
  // searchQuery   — the value actually sent to the backend
  // searchMode    — "soft" | "hard" | null
  //                 "soft" → background fetch, no skeleton
  //                 "hard" → intentional submit, show full loader
  //
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchMode, setSearchMode]   = useState<"soft" | "hard" | null>(null);

  // isSoftSearching is true only between the debounce firing and the result
  // arriving — used to show the subtle dots indicator inside the search bar.
  const [isSoftSearching, setIsSoftSearching] = useState(false);

  // Called by SearchBar when the user pauses typing (debounced 800ms).
  const handleSoftSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSearchMode("soft");
    setIsSoftSearching(true);
  }, []);

  // Called by SearchBar when the user hits the keyboard Search/Enter key.
  const handleHardSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(1);
    setSearchMode("hard");
    setIsSoftSearching(false); // dots go away; full loader takes over
  }, []);

  const cardAnimations = useRef<Record<string, Animated.Value>>({}).current;
  const scrollRef      = useRef<ScrollView>(null);

  const activeFilter = FILTERS[activeFilterIndex];

  // ── Build query params ────────────────────────────────────────────────────
  const queryParams = useMemo(() => {
    const params: string[] = [];
    if (activeSort) params.push(`sort=${activeSort}`);

    const fp = activeFilter.params as Record<string, string>;
    for (const [key, val] of Object.entries(fp)) {
      if (val) params.push(`${key}=${encodeURIComponent(val)}`);
    }

    if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
    params.push(`page=${page}`);
    return params;
  }, [activeFilter, activeSort, page, searchQuery]);

  const { data, isLoading, error, forcedRefetch } = useInteligence(queryParams);

  // When new data arrives after a soft search, stop the dots indicator.
  useEffect(() => {
    if (!isLoading && searchMode === "soft") {
      setIsSoftSearching(false);
    }
  }, [isLoading, searchMode]);

  const signals: Signal[] = data?.signals ?? [];
  const total              = data?.total   ?? 0;
  const pages              = data?.pages   ?? 1;

  // Reset to page 1 on filter/sort change (search changes are handled above).
  useEffect(() => { setPage(1); }, [activeFilterIndex, activeSort]);

  const getCardAnimation = useCallback(
    (id: string) => {
      if (!cardAnimations[id]) cardAnimations[id] = new Animated.Value(0);
      return cardAnimations[id];
    },
    [cardAnimations]
  );

  useEffect(() => {
    if (signals.length === 0) return;
    Animated.stagger(
      CARD_STAGGER_DELAY_MS,
      signals.map((signal) => {
        const anim = getCardAnimation(signal.id);
        anim.setValue(0);
        return Animated.timing(anim, {
          toValue: 1,
          duration: CARD_ANIMATION_DURATION_MS,
          useNativeDriver: true,
        });
      })
    ).start();
  }, [signals, getCardAnimation]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await forcedRefetch();
    setIsRefreshing(false);
  };

  const goToPage = (next: number) => {
    setPage(next);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleSave = async (signalId: string, isSaved: boolean) => {
    setSaveLoading(true);
    try {
      const payload: SaveSignalRequest = { status: isSaved ? "new" : "saved" };
      await api.patch<SaveSignalResponse>(`/signals/${signalId}`, payload);
      await forcedRefetch();
    } catch (err) {
      console.error("Error saving signal:", err);
    } finally {
      setSaveLoading(false);
    }
  };

  const activeSortLabel =
    SORT_OPTIONS.find((o) => o.value === activeSort)?.label ?? "Sort";

  const activeFilterLabel =
    activeFilterIndex === 0 ? "" : ` · ${activeFilter.label}`;

  // ── Render guards ─────────────────────────────────────────────────────────
  //
  // Show the full skeleton loader only for:
  //   • Initial page load
  //   • Hard search (user pressed Enter)
  //   • Pull-to-refresh
  //
  // Soft searches never show the skeleton — results update in the background.
  const showFullLoader =
    isLoading && !isRefreshing && searchMode !== "soft";

  if (showFullLoader) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AppHeader />
        <LoadingScreen theme={theme} />
      </View>
    );
  }
  if (error != null) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <AppHeader />
        <ErrorScreen theme={theme} onRetry={forcedRefetch} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <AppHeader />

      <SortSheet
        visible={sortSheetVisible}
        activeSort={activeSort}
        onSelect={setActiveSort}
        onClose={() => setSortSheetVisible(false)}
        theme={theme}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.accentBlue}
            colors={[theme.colors.accentBlue]}
          />
        }
      >
        {/* ── Title block ── */}
        <View style={{ gap: 4 }}>
          <Text
            style={{
              fontSize: 30,
              fontWeight: "800",
              fontFamily: theme.fontFamily.sansExtraBold,
              color: theme.colors.textPrimary,
              letterSpacing: -0.6,
            }}
          >
            Today&apos;s matches
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontFamily: theme.fontFamily.sansMedium,
              color: theme.colors.textMuted,
            }}
          >
            {total} new role{total !== 1 ? "s" : ""} · ranked for your taste
          </Text>
        </View>

        {/* ── Search bar ── */}
        <SearchBar
          value={searchInput}
          onChangeText={setSearchInput}
          onSoftSearch={handleSoftSearch}
          onHardSearch={handleHardSearch}
          isSoftSearching={isSoftSearching}
          theme={theme}
        />

        {/* ── Stats bar ── */}
        {signals.length > 0 && (
          <StatsBar signals={signals} total={total} theme={theme} />
        )}

        {/* ── Filter pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8 }}
        >
          {FILTERS.map((filter, index) => {
            const selected = activeFilterIndex === index;
            return (
              <Pressable
                key={filter.label}
                onPress={() => {
                  setActiveFilterIndex(index);
                  setPage(1);
                }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: theme.radius.pill,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderWidth: selected ? 0 : StyleSheet.hairlineWidth,
                      borderColor: theme.colors.border,
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
                        fontWeight: selected ? "700" : "500",
                        fontFamily: selected
                          ? theme.fontFamily.sansBold
                          : theme.fontFamily.sansMedium,
                        color: selected
                          ? theme.colors.background
                          : theme.colors.textSecondary,
                      }}
                    >
                      {filter.label}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Result count + sort ── */}
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
              fontFamily: theme.fontFamily.monoRegular,
              color: theme.colors.textMuted,
            }}
          >
            {total} result{total !== 1 ? "s" : ""}
            {activeFilterLabel}
            {searchQuery ? ` · "${searchQuery}"` : ""}
          </Text>

          <Pressable onPress={() => setSortSheetVisible(true)}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: theme.radius.pill,
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
                <ArrowDownNarrowWide
                  size={16}
                  color={theme.colors.textMuted}
                />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    fontFamily: theme.fontFamily.sansMedium,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {activeSortLabel}
                </Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* ── Cards ── */}
        <View style={{ gap: 12 }}>
          {signals.length === 0 ? (
            <EmptyScreen
              theme={theme}
              filter={activeFilter.label}
              searchQuery={searchQuery}
            />
          ) : (
            signals.map((item, index) => (
              <SignalCard
                key={item.id}
                item={item}
                theme={theme}
                loading={saveLoading}
                saved={item?.isSaved ?? false}
                isHero={page === 1 && index === 0 && activeSort === "match"}
                onSave={() => handleSave(item.id, item?.isSaved ?? false)}
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

        <PaginationBar
          page={page}
          pages={pages}
          onPrev={() => goToPage(page - 1)}
          onNext={() => goToPage(page + 1)}
          theme={theme}
        />
      </ScrollView>
    </View>
  );
}