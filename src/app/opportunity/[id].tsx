import {
  Stack,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
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

import { api } from "@/lib/backend";

import {
  useRelatedInteligenceById,
  useInteligenceById,
} from "@/hooks/useInteligence";
import { useAppTheme } from "@/theme/use-app-theme";
import { IntelligenceSignal } from "@/data/mock";

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
  if (score >= 90) return theme.colors.accentSuccess;
  if (score >= 80) return theme.colors.accentBlue;
  if (score >= 70) return theme.colors.accentViolet;
  return theme.colors.textMuted;
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
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius.lg,
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
        borderRadius: theme.radius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.surfaceStrong,
        paddingHorizontal: 9,
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
        borderRadius: theme.radius.sm,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: `${color}28`,
        backgroundColor: `${color}12`,
        paddingHorizontal: 9,
        paddingVertical: 4,
      }}
    >
      <Text style={{ fontSize: 11, fontWeight: "600", color }}>{label}</Text>
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

  const accent = signal
    ? scoreColor(signal.aiMatchScore, theme)
    : theme.colors.textSecondary;
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
          <SectionCard theme={theme}>
            {/* Company + role */}
            <View style={{ gap: 3 }}>
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: "500",
                  color: theme.colors.textMuted,
                  textTransform: "uppercase",
                  letterSpacing: 0.4,
                }}
              >
                {signal.company ?? "Unknown"}
              </Text>
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "700",
                  color: theme.colors.textPrimary,
                  letterSpacing: -0.5,
                  lineHeight: 28,
                }}
              >
                {signal.role}
              </Text>
              <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                {signal.location} · {timeAgo(signal.postedAt)}
                {signal.pay != null ? ` · ${signal.pay}` : ''}
              </Text>
            </View>

            <Divider theme={theme} />

            {/* Match score block */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: `${accent}0E`,
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: `${accent}28`,
                paddingHorizontal: 14,
                paddingVertical: 12,
              }}
            >
              <View style={{ gap: 2 }}>
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: accent,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  {strength}
                </Text>
                <Text style={{ fontSize: 12, color: theme.colors.textMuted }}>
                  AI confidence score
                </Text>
                {signal.pay != null && (
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '600',
                      color: theme.colors.textPrimary,
                      marginTop: 4,
                    }}
                  >
                    {signal.pay}
                  </Text>
                )}
              </View>
              <Text
                style={{
                  fontSize: 36,
                  fontWeight: '700',
                  color: accent,
                  letterSpacing: -1,
                }}
              >
                {signal.aiMatchScore}
              </Text>
            </View>

            {/* Mode + status pills */}
            <View style={{ flexDirection: "row", gap: 6, flexWrap: "wrap" }}>
              <StatusChip
                label={signal.roleMode ?? "On-site"}
                color={
                  signal.roleMode === "Remote"
                    ? theme.colors.accentSuccess
                    : theme.colors.textMuted
                }
                theme={theme}
              />
              <StatusChip
                label={signal.applicationStatus}
                color={
                  signal.applicationStatus === "Open"
                    ? theme.colors.accentSuccess
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

        {/* ── 1: AI Insight ── */}
        {animatedSection(
          1,
          <SectionCard theme={theme}>
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              AI insight
            </Text>

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
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Skills detected
            </Text>

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
                    ? theme.colors.accentSuccess
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
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Actions
            </Text>

            {/* Primary CTA */}
            <Pressable onPress={() => Linking.openURL(signal?.applyLink || signal.sourceUrl)}>
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: theme.radius.md,
                    paddingVertical: 13,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 6,
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
                    Apply now
                  </Text>
                  <Text
                    style={{
                      fontSize: 13,
                      color: theme.colors.background,
                      opacity: 0.55,
                    }}
                  >
                    ↗
                  </Text>
                </View>
              )}
            </Pressable>

            {/* Secondary actions */}
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => SaveSignal(signal.id, isSaved ? "new" : "saved")}
                style={{ flex: 1 }}
              >
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: theme.radius.md,
                      paddingVertical: 11,
                      alignItems: "center",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: isSaved
                        ? theme.colors.accentBlue
                        : theme.colors.border,
                      backgroundColor: isSaved
                        ? `${signal.isSaved ? theme.colors.accentBlue : "transparent"}12`
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
                        color: isSaved
                          ? theme.colors.accentBlue
                          : theme.colors.textSecondary,
                      }}
                    >
                      {saveLoading
                        ? isSaved
                          ? "Removing..."
                          : "Saving..."
                        : isSaved
                          ? "✓ Saved"
                          : "Save"}
                    </Text>
                  </View>
                )}
              </Pressable>

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
                          ? theme.colors.accentSuccess
                          : theme.colors.border,
                      backgroundColor:
                        interestState === "interested"
                          ? `${theme.colors.accentSuccess}12`
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
                            ? theme.colors.accentSuccess
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
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "600",
                      color: theme.colors.textMuted,
                      textTransform: "uppercase",
                      letterSpacing: 0.6,
                    }}
                  >
                    Original source
                  </Text>
                  <Text
                    style={{
                      fontSize: 11,
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
            <Text
              style={{
                fontSize: 11,
                fontWeight: "600",
                color: theme.colors.textMuted,
                textTransform: "uppercase",
                letterSpacing: 0.6,
              }}
            >
              Related opportunities
            </Text>

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
