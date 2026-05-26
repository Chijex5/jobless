import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, LivePulse } from '@/components/ui';
import { getIntelligenceSignalById, getRelatedIntelligenceSignals } from '@/data/mock';
import { useAppTheme } from '@/theme/use-app-theme';

const SECTION_STAGGER_MS = 110;
const SECTION_REVEAL_DURATION_MS = 360;
const SOURCE_EXPAND_DURATION_MS = 220;
const SOURCE_EXPANDED_MAX_HEIGHT = 420;
const SCORE_PULSE_DURATION_MS = 1200;
const SECTION_COUNT = 6;

const getStrengthLabel = (score: number) => {
  if (score >= 90) {
    return 'Strong Signal';
  }
  if (score >= 80) {
    return 'Stable Signal';
  }
  return 'Emerging Signal';
};

export default function OpportunityDetailScreen() {
  const theme = useAppTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : undefined;
  const signal = useMemo(() => (id ? getIntelligenceSignalById(id) : undefined), [id]);
  const relatedSignals = useMemo(() => (id ? getRelatedIntelligenceSignals(id) : []), [id]);

  const [isSaved, setIsSaved] = useState(false);
  const [interestState, setInterestState] = useState<'none' | 'interested' | 'not-relevant'>('none');
  const [sourceExpanded, setSourceExpanded] = useState(false);

  const sectionAnimations = useRef(Array.from({ length: SECTION_COUNT }, () => new Animated.Value(0))).current;
  const sourceAnimation = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(1)).current;
  const scoreGlow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const reveal = Animated.stagger(
      SECTION_STAGGER_MS,
      sectionAnimations.map((value) =>
        Animated.timing(value, {
          toValue: 1,
          duration: SECTION_REVEAL_DURATION_MS,
          useNativeDriver: true,
        })
      )
    );
    reveal.start();
  }, [sectionAnimations]);

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scoreScale, { toValue: 1.05, duration: SCORE_PULSE_DURATION_MS, useNativeDriver: true }),
          Animated.timing(scoreScale, { toValue: 1, duration: SCORE_PULSE_DURATION_MS, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(scoreGlow, { toValue: 0.8, duration: SCORE_PULSE_DURATION_MS, useNativeDriver: true }),
          Animated.timing(scoreGlow, { toValue: 0.4, duration: SCORE_PULSE_DURATION_MS, useNativeDriver: true }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scoreGlow, scoreScale]);

  useEffect(() => {
    Animated.timing(sourceAnimation, {
      toValue: sourceExpanded ? 1 : 0,
      duration: SOURCE_EXPAND_DURATION_MS,
      useNativeDriver: false,
    }).start();
  }, [sourceAnimation, sourceExpanded]);

  if (!signal) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.md }}>
        <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
        <Card theme={theme} style={{ gap: theme.spacing.md }}>
          <Text style={{ ...theme.typography.h2, color: theme.colors.textPrimary }}>Opportunity not found</Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
            This intelligence report is no longer available in the active feed.
          </Text>
          <Pressable onPress={() => router.back()}>
            {({ pressed }) => (
              <View
                style={{
                  borderRadius: theme.radius.md,
                  backgroundColor: pressed ? `${theme.colors.accentBlue}CC` : theme.colors.accentBlue,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}>
                <Text style={{ ...theme.typography.meta, color: theme.colors.surface }}>Back to feed</Text>
              </View>
            )}
          </Pressable>
        </Card>
      </View>
    );
  }

  const strength = getStrengthLabel(signal.aiMatchScore);
  const sourceHeight = sourceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, SOURCE_EXPANDED_MAX_HEIGHT] });
  const sourceOpacity = sourceAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <Stack.Screen options={{ headerShown: false, animation: 'slide_from_right' }} />
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Animated.View
          style={{
            opacity: sectionAnimations[0],
            transform: [{ translateY: sectionAnimations[0].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
          <Card theme={theme} style={{ gap: theme.spacing.md, borderRadius: theme.radius.lg }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: theme.spacing.sm }}>
              <Pressable onPress={() => router.back()}>
                <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>← Intelligence Feed</Text>
              </Pressable>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
                <LivePulse theme={theme} />
                <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Live intelligence report</Text>
              </View>
            </View>

            <View style={{ gap: 4 }}>
              <Text style={{ ...theme.typography.h2, color: theme.colors.textPrimary }}>{signal.role}</Text>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{signal.company}</Text>
              <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                {signal.location} · {signal.postedAt}
              </Text>
            </View>

            <Animated.View
              style={{
                borderRadius: theme.radius.md,
                borderWidth: StyleSheet.hairlineWidth,
                borderColor: `${theme.colors.accentBlue}88`,
                backgroundColor: `${theme.colors.accentBlue}1F`,
                padding: theme.spacing.sm,
                alignItems: 'center',
                shadowColor: theme.colors.accentBlue,
                shadowOpacity: scoreGlow,
                shadowRadius: 18,
                shadowOffset: { width: 0, height: 8 },
                transform: [{ scale: scoreScale }],
              }}>
              <Text style={{ ...theme.typography.h3, color: theme.colors.accentBlue }}>
                {signal.aiMatchScore}% Match — {strength}
              </Text>
            </Animated.View>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnimations[1],
            transform: [{ translateY: sectionAnimations[1].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
          <Card
            theme={theme}
            style={{
              gap: theme.spacing.sm,
              borderRadius: theme.radius.lg,
              borderColor: `${theme.colors.accentViolet}66`,
              backgroundColor: theme.colors.surfaceElevated,
              shadowColor: theme.colors.accentViolet,
              shadowOpacity: theme.appearance === 'dark' ? 0.34 : 0.14,
              shadowRadius: 18,
            }}>
            <Text style={{ ...theme.typography.meta, color: theme.colors.accentViolet }}>AI Insight Panel</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>{signal.aiSummary}</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{signal.relevanceReason}</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{signal.skillAlignment}</Text>
            <Chip theme={theme} label={`Extraction confidence: ${signal.extractionConfidence}`} variant="violet" />
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnimations[2],
            transform: [{ translateY: sectionAnimations[2].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
          <Card theme={theme} style={{ gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Extracted Structured Data</Text>
            <View style={{ gap: 8 }}>
              <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Skills Detected</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {signal.skillTags.map((skill) => (
                  <Chip key={`${signal.id}-${skill}`} theme={theme} label={skill} />
                ))}
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              <Chip theme={theme} label={`Role Type: ${signal.roleType}`} variant="blue" />
              <Chip theme={theme} label={`Location Mode: ${signal.roleMode}`} />
              <Chip theme={theme} label={`Application: ${signal.applicationStatus}`} variant="warning" />
              <Chip theme={theme} label={`Source Confidence: ${signal.sourceConfidence}`} variant="success" />
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnimations[3],
            transform: [{ translateY: sectionAnimations[3].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
          <Card theme={theme} style={{ gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Actions</Text>
            <Pressable>
              {({ pressed }) => (
                <View
                  style={{
                    borderRadius: theme.radius.md,
                    backgroundColor: pressed ? `${theme.colors.accentBlue}CC` : theme.colors.accentBlue,
                    paddingVertical: 12,
                    alignItems: 'center',
                  }}>
                  <Text style={{ ...theme.typography.meta, color: theme.colors.surface }}>Prepare Assisted Apply</Text>
                </View>
              )}
            </Pressable>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm }}>
              <Pressable onPress={() => setIsSaved((prev) => !prev)}>
                {({ pressed }) => (
                  <Chip
                    theme={theme}
                    label={isSaved ? 'Saved opportunity' : 'Save opportunity'}
                    variant={pressed || isSaved ? 'violet' : 'default'}
                  />
                )}
              </Pressable>
              <Pressable onPress={() => Linking.openURL(signal.sourceUrl)}>
                {({ pressed }) => (
                  <Chip theme={theme} label="Open original source" variant={pressed ? 'blue' : 'default'} />
                )}
              </Pressable>
              <Pressable onPress={() => setInterestState((prev) => (prev === 'interested' ? 'none' : 'interested'))}>
                {({ pressed }) => (
                  <Chip
                    theme={theme}
                    label="Mark as interested"
                    variant={pressed || interestState === 'interested' ? 'success' : 'default'}
                  />
                )}
              </Pressable>
              <Pressable onPress={() => setInterestState((prev) => (prev === 'not-relevant' ? 'none' : 'not-relevant'))}>
                {({ pressed }) => (
                  <Chip
                    theme={theme}
                    label="Mark as not relevant"
                    variant={pressed || interestState === 'not-relevant' ? 'warning' : 'default'}
                  />
                )}
              </Pressable>
            </View>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnimations[4],
            transform: [{ translateY: sectionAnimations[4].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
          <Card theme={theme} style={{ gap: theme.spacing.sm }}>
            <Pressable onPress={() => setSourceExpanded((prev) => !prev)}>
              {({ pressed }) => (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', opacity: pressed ? 0.85 : 1 }}>
                  <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Original Source</Text>
                  <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                    {sourceExpanded ? 'Collapse ▲' : 'Expand ▼'}
                  </Text>
                </View>
              )}
            </Pressable>
            <Animated.View style={{ maxHeight: sourceHeight, opacity: sourceOpacity, overflow: 'hidden', gap: 8 }}>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{signal.originalSourceText}</Text>
              <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>
                {signal.sourceHandle} · {signal.sourceUrl}
              </Text>
              <View style={{ gap: 6 }}>
                {signal.sourceMetadata.map((entry) => (
                  <Text key={`${signal.id}-${entry}`} style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                    • {entry}
                  </Text>
                ))}
              </View>
            </Animated.View>
          </Card>
        </Animated.View>

        <Animated.View
          style={{
            opacity: sectionAnimations[5],
            transform: [{ translateY: sectionAnimations[5].interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
          }}>
          <Card theme={theme} style={{ gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>Related Opportunities</Text>
            <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
              Similar skill-match roles and related company signals.
            </Text>
            <View style={{ gap: theme.spacing.sm }}>
              {relatedSignals.map((related) => (
                <Pressable key={related.id} onPress={() => router.push({ pathname: '/opportunity/[id]', params: { id: related.id } })}>
                  {({ pressed }) => (
                    <View
                      style={{
                        borderRadius: theme.radius.md,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: theme.colors.border,
                        backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surface,
                        padding: theme.spacing.sm,
                        gap: 4,
                      }}>
                      <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{related.role}</Text>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>
                        {related.company} · {related.location}
                      </Text>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>
                        {related.aiMatchScore}% Match · {related.postedAt}
                      </Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </Card>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
