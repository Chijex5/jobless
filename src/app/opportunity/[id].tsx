import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bookmark, ChevronLeft } from "lucide-react-native";

import { api } from "@/lib/backend";

import {
  useRelatedInteligenceById,
  useInteligenceById,
} from "@/hooks/useInteligence";
import { useAppTheme } from "@/theme/use-app-theme";
import { IntelligenceSignal } from "@/data/mock";
import { ScoreRing } from "@/components/ui";

import type { AppTheme } from "@/theme/tokens";

// ─── 
const SECTION_STAGGER_MS = 90;
const SECTION_REVEAL_DURATION_MS = 300;
const SOURCE_EXPAND_DURATION_MS = 220;
const SOURCE_EXPANDED_MAX_HEIGHT = 420;

const SECTION_COUNT = 6;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStrengthLabel(score: number): string {
  if (score >= 90) return "Strong Signal";
  if (score >= 80) return "Stable Signal";
  return "Emerging Signal";
}

function scoreColor(score: number, theme: AppTheme): string {
  return score >= 70 ? theme.colors.accentBlue : theme.colors.textMuted;
}

function initials(text: string): string {
  return (
    (text ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

function formatRelativeTime(hoursAgo: number): string {
  const h = hoursAgo;
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface SaveSignalRequest {
  status: string;
}

interface SaveSignalResponse extends IntelligenceSignal {}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  children,
  style,
  theme,
}: {
  children: React.ReactNode;
  style?: object;
  theme: AppTheme;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: theme.colors.surfaceStrong,
          borderRadius: 20,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.border,
          padding: 16,
          gap: 12,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function SectionLabel({ theme, children }: { theme: AppTheme; children: React.ReactNode }) {
  return (
    <Text
      style={{
        fontSize: 11,
        fontFamily: theme.fontFamily.monoRegular,
        color: theme.colors.textMuted,
        textTransform: "uppercase",
        letterSpacing: 0.8,
      }}
    >
      {children}
    </Text>
  );
}

function Divider({ theme }: { theme: AppTheme }) {
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        backgroundColor: theme.colors.border,
      }}
    />
  );
}

function SkillChip({ label, theme }: { label: string; theme: AppTheme }) {
  return (
    <View
      style={{
        borderRadius: theme.radius.pill,
        backgroundColor: theme.colors.surfaceElevated,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          fontFamily: theme.fontFamily.sansSemiBold,
          color: theme.colors.accentBlue,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function StatusChip({
  label,
  color,
  theme,
}: {
  label: string;
  color: string;
  theme: AppTheme;
}) {
  return (
    <View
      style={{
        borderRadius: theme.radius.pill,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${color}28`,
        backgroundColor: `${color}12`,
        paddingHorizontal: 10,
        paddingVertical: 5,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          fontFamily: theme.fontFamily.sansSemiBold,
          color,
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function CompanyAvatar({
  label,
  theme,
  size = 52,
}: {
  label: string;
  theme: AppTheme;
  size?: number;
}) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: theme.radius.md,
        backgroundColor: theme.colors.surfaceStrong,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: size >= 48 ? 18 : 14,
          fontFamily: theme.fontFamily.monoRegular,
          color: theme.colors.textSecondary,
        }}
      >
        {initials(label)}
      </Text>
    </View>
  );
}

function DetailHeader({
  theme,
  insetsTop,
  score,
  isSaved,
  saveLoading,
  onBack,
  onToggleSave,
}: {
  theme: AppTheme;
  insetsTop: number;
  score: number;
  isSaved: boolean;
  saveLoading: boolean;
  onBack: () => void;
  onToggleSave: () => void;
}) {
  return (
    <View
      style={{
        backgroundColor: theme.colors.background,
        paddingTop: insetsTop + 8,
        paddingBottom: 10,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <Pressable onPress={onBack}>
        {({ pressed }) => (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: theme.colors.surfaceStrong,
              opacity: pressed ? 0.7 : 1,
            }}
          >
            <ChevronLeft size={20} color={theme.colors.textPrimary} />
          </View>
        )}
      </Pressable>

      <Text
        style={{
          fontSize: 11,
          fontFamily: theme.fontFamily.monoRegular,
          color: theme.colors.textMuted,
          textTransform: "uppercase",
          letterSpacing: 0.8,
        }}
      >
        MATCH · {Math.round(score)}
      </Text>

      <Pressable onPress={onToggleSave} disabled={saveLoading}>
        {({ pressed }) => (
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: isSaved
                ? theme.colors.accentBlue
                : theme.colors.surfaceStrong,
              opacity: pressed ? 0.7 : 1,
            }}
          >
            <Bookmark
              size={17}
              color={isSaved ? "#FFFFFF" : theme.colors.textPrimary}
              fill={isSaved ? "#FFFFFF" : "transparent"}
            />
          </View>
        )}
      </Pressable>
    </View>
  );
}

// ─── Loading State ────────────────────────────────────────────────────────────

function LoadingScreen({ theme }: { theme: AppTheme }) {
  const shimmer = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 0.7,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0.3,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const Block = ({
    w,
    h = 12,
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
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 12 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      >
        {/* Header skeleton */}
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
          <Block w="40%" h={10} />
          <Block w="75%" h={22} />
          <Block w="30%" h={10} />
          <Block w="100%" h={44} radius={theme.radius.md} />
        </View>

        {/* Insight skeleton */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            padding: 16,
            gap: 10,
          }}
        >
          <Block w="30%" h={10} />
          <Block w="100%" h={10} />
          <Block w="90%" h={10} />
          <Block w="70%" h={10} />
        </View>

        {/* Skills skeleton */}
        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            padding: 16,
            gap: 10,
          }}
        >
          <Block w="40%" h={14} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Block w={60} h={26} radius={theme.radius.sm} />
            <Block w={80} h={26} radius={theme.radius.sm} />
            <Block w={52} h={26} radius={theme.radius.sm} />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Not Found State ──────────────────────────────────────────────────────────

function NotFoundScreen({
  theme,
  onBack,
}: {
  theme: AppTheme;
  onBack: () => void;
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
        <View style={{ height: 3, backgroundColor: theme.colors.textMuted }} />
        <View style={{ padding: 16, gap: 16 }}>
          <View style={{ gap: 4 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: theme.colors.textPrimary,
              }}
            >
              Opportunity not found
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                lineHeight: 19,
              }}
            >
              This intelligence report is no longer available in the active
              feed. It may have expired or been removed.
            </Text>
          </View>
          <Pressable onPress={onBack}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: theme.radius.md,
                  paddingVertical: 13,
                  alignItems: "center",
                  backgroundColor: pressed
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.colors.background,
                  }}
                >
                  Back to feed
                </Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

function ErrorScreen({
  theme,
  onRetry,
  onBack,
}: {
  theme: AppTheme;
  onRetry: () => void;
  onBack: () => void;
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
              Failed to load opportunity
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: theme.colors.textSecondary,
                lineHeight: 19,
              }}
            >
              The intelligence report failed to load. Your saved opportunities
              are unaffected.
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable onPress={onBack} style={{ flex: 1 }}>
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: theme.radius.md,
                    paddingVertical: 12,
                    alignItems: "center",
                    borderWidth: StyleSheet.hairlineWidth,
                    borderColor: theme.colors.border,
                    backgroundColor: pressed
                      ? theme.colors.surfaceStrong
                      : "transparent",
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.colors.textSecondary,
                    }}
                  >
                    Go back
                  </Text>
                </View>
              )}
            </Pressable>
            <Pressable onPress={onRetry} style={{ flex: 2 }}>
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: theme.radius.md,
                    paddingVertical: 12,
                    alignItems: "center",
                    backgroundColor: pressed
                      ? theme.colors.textSecondary
                      : theme.colors.textPrimary,
                    transform: [{ scale: pressed ? 0.98 : 1 }],
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: theme.colors.background,
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
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function OpportunityDetailScreen() {
  const theme = useAppTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ id?: string }>();
  const [saveLoading, setSaveLoading] = useState(false);
  const id = typeof params.id === "string" ? params.id : undefined;

  const handleBack = () => router.back();

  const {
    data: localSignal,
    isLoading: isSignalLoading,
    error: signalError,
  } = useInteligenceById(id || "");

  const { data: relatedSignals, isLoading: isRelatedLoading } =
    useRelatedInteligenceById(id || "");

  const [signal, setSignal] = useState(localSignal);

  const isSaved = signal?.isSaved ?? false;
  const [interestState, setInterestState] = useState<
    "none" | "interested" | "not-relevant"
  >("none");
  const [sourceExpanded, setSourceExpanded] = useState(false);

  const sectionAnims = useRef(
    Array.from({ length: SECTION_COUNT }, () => new Animated.Value(0)),
  ).current;

  useEffect(() => {
    if (localSignal) setSignal(localSignal);
  }, [localSignal]);


  const sourceAnim = useRef(new Animated.Value(0)).current;

  const SaveSignal = async (
    signalId: string,
    status: string = "saved",
  ): Promise<void> => {
    setSaveLoading(true);
    try {
      const payload: SaveSignalRequest = { status };
      const res = await api.patch<SaveSignalResponse>(
        `/signals/${signalId}`,
        payload,
      );
      if (res && signal) {
        setSignal(prev =>
          prev ? { ...prev, status: res.status, isSaved: res.isSaved } : prev
        );
      }
    } catch (error) {
      console.error("Error saving signal:", error);
    } finally {
      setSaveLoading(false);
    }
  };

  // Push the role name into the header title via navigation params
  useEffect(() => {
    if (signal?.role) {
      navigation.setParams({ title: signal.role } as any);
    }
  }, [signal?.role, navigation]);

  // Reveal animation
  useEffect(() => {
    if (!signal) return;
    Animated.stagger(
      SECTION_STAGGER_MS,
      sectionAnims.map((v) =>
        Animated.timing(v, {
          toValue: 1,
          duration: SECTION_REVEAL_DURATION_MS,
          useNativeDriver: true,
        }),
      ),
    ).start();
  }, [signal, sectionAnims]);

  // Source expand animation
  useEffect(() => {
    Animated.timing(sourceAnim, {
      toValue: sourceExpanded ? 1 : 0,
      duration: SOURCE_EXPAND_DURATION_MS,
      useNativeDriver: false,
    }).start();
  }, [sourceExpanded, sourceAnim]);

  const sourceHeight = sourceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, SOURCE_EXPANDED_MAX_HEIGHT],
  });
  const sourceOpacity = sourceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const strength = signal ? getStrengthLabel(signal.aiMatchScore) : null;

  const animatedSection = (index: number, children: React.ReactNode) => (
    <Animated.View
      style={{
        opacity: sectionAnims[index],
        transform: [
          {
            translateY: sectionAnims[index].interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );

  // ── Guard: no id ──
  if (!id) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <NotFoundScreen theme={theme} onBack={handleBack} />
      </>
    );
  }

  // ── Guard: loading ──
  if (isSignalLoading) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <LoadingScreen theme={theme} />
      </>
    );
  }

  // ── Guard: error ──
  if (signalError != null) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <ErrorScreen
          theme={theme}
          onBack={handleBack}
          onRetry={() => {
            router.replace({
              pathname: "/opportunity/[id]",
              params: { id },
            } as any);
          }}
        />
      </>
    );
  }

  // ── Guard: not found ──
  if (!signal) {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <NotFoundScreen theme={theme} onBack={handleBack} />
      </>
    );
  }

  function timeAgo(postedAt: string): string {
    const now = new Date();
    const posted = new Date(postedAt);

    const seconds = Math.floor((now.getTime() - posted.getTime()) / 1000);

    if (seconds < 60) {
      return "Just now";
    }

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) {
      return `${minutes}m ago`;
    }

    const hours = Math.floor(minutes / 60);

    if (hours < 24) {
      return `${hours}h ago`;
    }

    const days = Math.floor(hours / 24);

    if (days < 7) {
      return `${days}d ago`;
    }

    const weeks = Math.floor(days / 7);

    if (weeks < 4) {
      return `${weeks}w ago`;
    }

    const months = Math.floor(days / 30);

    if (months < 12) {
      return `${months}mo ago`;
    }

    const years = Math.floor(days / 365);

    return `${years}y ago`;
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />
      <DetailHeader
        theme={theme}
        insetsTop={insets.top}
        score={signal.aiMatchScore}
        isSaved={isSaved}
        saveLoading={saveLoading}
        onBack={handleBack}
        onToggleSave={() => SaveSignal(signal.id, isSaved ? "new" : "saved")}
      />
      <ScrollView
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 48,
          gap: 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 0: Header card ── */}
        {animatedSection(
          0,
          <SectionCard theme={theme} style={{ backgroundColor: theme.colors.surface }}>
            {/* Company + role */}
            <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
              <CompanyAvatar label={signal.company ?? signal.role} theme={theme} />
              <View style={{ flex: 1, gap: 3 }}>
                <Text
                  style={{
                    fontSize: 23,
                    fontFamily: theme.fontFamily.sansExtraBold,
                    fontWeight: "800",
                    color: theme.colors.textPrimary,
                    letterSpacing: -0.5,
                    lineHeight: 28,
                  }}
                >
                  {signal.role}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  {signal.company ?? "Unknown"} · {signal.location}
                  {signal.pay != null ? ` · ${signal.pay}` : ""}
                </Text>
              </View>
            </View>

            {/* Mode + status pills */}
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <StatusChip
                label={signal.roleMode ?? "On-site"}
                color={
                  signal.roleMode === "Remote"
                    ? theme.colors.accentBlue
                    : theme.colors.textMuted
                }
                theme={theme}
              />
              <StatusChip
                label={signal.applicationStatus}
                color={
                  signal.applicationStatus === "Open"
                    ? theme.colors.accentBlue
                    : theme.colors.textMuted
                }
                theme={theme}
              />
              <StatusChip
                label={`${signal.extractionConfidence} confidence`}
                color={theme.colors.accentBlue}
                theme={theme}
              />
            </View>
          </SectionCard>,
        )}

        {/* ── Score banner ── */}
        {animatedSection(
          0,
          <View
            style={{
              backgroundColor: theme.colors.surfaceStrong,
              borderRadius: 20,
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: theme.colors.border,
              padding: 18,
              flexDirection: "row",
              alignItems: "center",
              gap: 16,
            }}
          >
            <ScoreRing theme={theme} score={signal.aiMatchScore} size={88} showSuffix />
            <View style={{ flex: 1, gap: 4 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: theme.fontFamily.monoRegular,
                  color: theme.colors.accentBlue,
                  textTransform: "uppercase",
                  letterSpacing: 0.6,
                }}
              >
                {strength}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 19,
                  color: theme.colors.textSecondary,
                }}
                numberOfLines={3}
              >
                {signal.skillAlignment ?? signal.aiSummary ?? "AI match summary unavailable."}
              </Text>
            </View>
          </View>,
        )}

        {/* ── 1: AI Insight ── */}
        {animatedSection(
          1,
          <SectionCard theme={theme}>
            <SectionLabel theme={theme}>AI insight</SectionLabel>

            {signal.aiSummary != null && (
              <Text
                style={{
                  fontSize: 14,
                  lineHeight: 21,
                  color: theme.colors.textPrimary,
                }}
              >
                {signal.aiSummary}
              </Text>
            )}

            {signal.relevanceReason != null &&
              signal.relevanceReason !== signal.aiSummary && (
                <View
                  style={{
                    borderLeftWidth: 2,
                    borderLeftColor: theme.colors.border,
                    paddingLeft: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      lineHeight: 19,
                      color: theme.colors.textSecondary,
                    }}
                  >
                    {signal.relevanceReason}
                  </Text>
                </View>
              )}

            {signal.skillAlignment != null && (
              <Text
                style={{
                  fontSize: 12,
                  lineHeight: 18,
                  color: theme.colors.textMuted,
                }}
              >
                {signal.skillAlignment}
              </Text>
            )}
          </SectionCard>,
        )}

        {/* ── 2: Skills + Structured data ── */}
        {animatedSection(
          2,
          <SectionCard theme={theme}>
            <SectionLabel theme={theme}>Skills detected</SectionLabel>

            {(signal.skillTags ?? []).length > 0 && (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
                {signal.skillTags.map((skill) => (
                  <SkillChip
                    key={`${signal.id}-${skill}`}
                    label={skill}
                    theme={theme}
                  />
                ))}
              </View>
            )}

            <Divider theme={theme} />

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {signal.roleType != null && (
                <StatusChip
                  label={signal.roleType}
                  color={theme.colors.accentBlue}
                  theme={theme}
                />
              )}
              <StatusChip
                label={
                  signal.sourceConfidence === "High"
                    ? "High source confidence"
                    : "Medium source confidence"
                }
                color={
                  signal.sourceConfidence === "High"
                    ? theme.colors.accentRose
                    : theme.colors.textMuted
                }
                theme={theme}
              />
            </View>
          </SectionCard>,
        )}

        {/* ── 3: Actions ── */}
        {animatedSection(
          3,
          <SectionCard theme={theme}>
            <SectionLabel theme={theme}>Actions</SectionLabel>

            {/* Primary CTA + bookmark, bottom-action-bar style */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => SaveSignal(signal.id, isSaved ? "new" : "saved")}
                disabled={saveLoading}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 15,
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isSaved
                        ? theme.colors.accentBlue
                        : theme.colors.border,
                      backgroundColor: isSaved
                        ? `${theme.colors.accentBlue}12`
                        : pressed
                          ? theme.colors.surfaceStrong
                          : theme.colors.surface,
                      opacity: pressed ? 0.85 : 1,
                    }}
                  >
                    <Bookmark
                      size={19}
                      color={isSaved ? theme.colors.accentBlue : theme.colors.textSecondary}
                      fill={isSaved ? theme.colors.accentBlue : "transparent"}
                    />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => Linking.openURL(signal?.applyLink || signal.sourceUrl)}
                style={{ flex: 1 }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: 15,
                      height: 48,
                      alignItems: "center",
                      flexDirection: "row",
                      justifyContent: "center",
                      gap: 6,
                      backgroundColor: theme.colors.accentBlue,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 14,
                        fontFamily: theme.fontFamily.sansSemiBold,
                        fontWeight: "700",
                        color: "#FFFFFF",
                      }}
                    >
                      Apply now
                    </Text>
                    <Text
                      style={{
                        fontSize: 13,
                        color: "#FFFFFF",
                        opacity: 0.7,
                      }}
                    >
                      ↗
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>

            {/* Secondary actions */}
            <View style={{ flexDirection: "row", gap: 8 }}>

              <Pressable
                onPress={() =>
                  setInterestState((prev) =>
                    prev === "interested" ? "none" : "interested",
                  )
                }
                style={{ flex: 1 }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: theme.radius.md,
                      paddingVertical: 11,
                      alignItems: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor:
                        interestState === "interested"
                          ? theme.colors.accentRose
                          : theme.colors.border,
                      backgroundColor:
                        interestState === "interested"
                          ? `${theme.colors.accentRose}12`
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
                        color:
                          interestState === "interested"
                            ? theme.colors.accentRose
                            : theme.colors.textSecondary,
                      }}
                    >
                      {interestState === "interested"
                        ? "✓ Interested"
                        : "Interested"}
                    </Text>
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() =>
                  setInterestState((prev) =>
                    prev === "not-relevant" ? "none" : "not-relevant",
                  )
                }
                style={{ flex: 1 }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: theme.radius.md,
                      paddingVertical: 11,
                      alignItems: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor:
                        interestState === "not-relevant"
                          ? theme.colors.accentWarning
                          : theme.colors.border,
                      backgroundColor:
                        interestState === "not-relevant"
                          ? `${theme.colors.accentWarning}12`
                          : pressed
                            ? theme.colors.surfaceStrong
                            : "transparent",
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color:
                          interestState === "not-relevant"
                            ? theme.colors.accentWarning
                            : theme.colors.textSecondary,
                      }}
                    >
                      {interestState === "not-relevant" ? "✗ Skip" : "Skip"}
                    </Text>
                  </View>
                )}
              </Pressable>
            </View>
          </SectionCard>,
        )}

        {/* ── 4: Original Source ── */}
        {animatedSection(
          4,
          <SectionCard theme={theme}>
            <Pressable onPress={() => setSourceExpanded((prev) => !prev)}>
              {({ pressed }) => (
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    opacity: pressed ? 0.7 : 1,
                  }}
                >
                  <SectionLabel theme={theme}>Original source</SectionLabel>
                  <Text
                    style={{
                      fontSize: 11,
                      fontFamily: theme.fontFamily.monoRegular,
                      color: theme.colors.textMuted,
                      letterSpacing: 0.3,
                    }}
                  >
                    {sourceExpanded ? "Collapse ▲" : "Expand ▼"}
                  </Text>
                </View>
              )}
            </Pressable>

            <Animated.View
              style={{
                maxHeight: sourceHeight,
                opacity: sourceOpacity,
                overflow: "hidden",
                gap: 10,
              }}
            >
              {signal.originalSourceText != null && (
                <Text
                  style={{
                    fontSize: 13,
                    lineHeight: 20,
                    color: theme.colors.textSecondary,
                  }}
                >
                  {signal.originalSourceText}
                </Text>
              )}

              <Pressable onPress={() => Linking.openURL(signal.sourceUrl)}>
                {({ pressed }) => (
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "500",
                      color: theme.colors.accentBlue,
                      opacity: pressed ? 0.65 : 1,
                    }}
                  >
                    {signal.sourceHandle} · {signal.sourceUrl}
                  </Text>
                )}
              </Pressable>

              {(signal.sourceMetadata ?? []).length > 0 && (
                <View style={{ gap: 4 }}>
                  {signal.sourceMetadata.map((entry: string, i) => (
                    <Text
                      key={`meta-${entry}-${i}`}
                      style={{
                        fontSize: 11,
                        color: theme.colors.textMuted,
                        lineHeight: 17,
                      }}
                    >
                      · {entry}
                    </Text>
                  ))}
                </View>
              )}
            </Animated.View>
          </SectionCard>,
        )}

        {/* ── 5: Related Opportunities ── */}
        {animatedSection(
          5,
          <SectionCard theme={theme}>
            <SectionLabel theme={theme}>Related opportunities</SectionLabel>

            {isRelatedLoading ? (
              <View style={{ paddingVertical: 16, alignItems: "center" }}>
                <ActivityIndicator
                  size="small"
                  color={theme.colors.textMuted}
                />
              </View>
            ) : !relatedSignals ||
              (Array.isArray(relatedSignals) && relatedSignals.length === 0) ? (
              <Text style={{ fontSize: 13, color: theme.colors.textMuted }}>
                No related signals found.
              </Text>
            ) : (
              <View style={{ gap: 8 }}>
                {(Array.isArray(relatedSignals)
                  ? relatedSignals
                  : relatedSignals
                    ? [relatedSignals]
                    : []
                ).map((related) => (
                  <Pressable
                    key={related.id}
                    onPress={() =>
                      router.push({
                        pathname: "/opportunity/[id]",
                        params: { id: related.id },
                      })
                    }
                  >
                    {({ pressed }) => (
                      <View
                        style={{
                          borderRadius: theme.radius.md,
                          borderWidth: StyleSheet.hairlineWidth,
                          borderColor: theme.colors.border,
                          backgroundColor: pressed
                            ? theme.colors.surfaceStrong
                            : theme.colors.surfaceElevated,
                          padding: 12,
                          gap: 3,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.textPrimary,
                            letterSpacing: -0.2,
                          }}
                        >
                          {related.role}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: theme.colors.textSecondary,
                          }}
                        >
                          {related.company ?? "Unknown"} · {related.location}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                            marginTop: 2,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: "600",
                              color: scoreColor(related.aiMatchScore, theme),
                            }}
                          >
                            {related.aiMatchScore} match
                          </Text>
                          <Text
                            style={{ fontSize: 10, color: theme.colors.border }}
                          >
                            ·
                          </Text>
                          <Text
                            style={{
                              fontSize: 11,
                              color: theme.colors.textMuted,
                            }}
                          >
                            {timeAgo(related.postedAt)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                ))}
              </View>
            )}
          </SectionCard>,
        )}
      </ScrollView>
    </View>
  );
}
