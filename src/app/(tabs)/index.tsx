import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Card, Chip, LivePulse } from '@/components/ui';
import { intelligenceSignals } from '@/data/mock';
import { useAppTheme } from '@/theme/use-app-theme';

const CARD_STAGGER_DELAY_MS = 90;
const CARD_ANIMATION_DURATION_MS = 420;
const LOADING_STATE_INTERVAL_MS = 1900;
type Signal = (typeof intelligenceSignals)[number];

const FILTER_STRATEGIES: Record<string, (signal: Signal) => boolean> = {
  Frontend: (item) => item.role.toLowerCase().includes('frontend'),
  Backend: (item) => item.role.toLowerCase().includes('backend'),
  AI: (item) =>
    item.role.toLowerCase().includes('ai') || item.skillTags.some((tag) => tag.toLowerCase().includes('llm') || tag.toLowerCase().includes('ai')),
  Data: (item) => item.role.toLowerCase().includes('data'),
  Remote: (item) => item.location.toLowerCase().includes('remote'),
  Nigeria: (item) => item.location.toLowerCase().includes('nigeria'),
  Global: (item) => item.location.toLowerCase().includes('global'),
  React: (item) => item.skillTags.some((tag) => tag.toLowerCase().includes('react')),
  Python: (item) => item.skillTags.some((tag) => tag.toLowerCase().includes('python')),
};

export default function IntelligenceScreen() {
  const theme = useAppTheme();
  const [activeFilter, setActiveFilter] = useState('AI');
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const [expandedDetailId, setExpandedDetailId] = useState<string | null>(null);
  const [loaderIndex, setLoaderIndex] = useState(0);
  const cardAnimations = useRef<Record<string, Animated.Value>>({}).current;

  const loadingStates = ['Analyzing internship signals', 'Ranking opportunities', 'Scanning Twitter/X'];
  const filters = ['Frontend', 'Backend', 'AI', 'Data', 'Remote', 'Nigeria', 'Global', 'React', 'Python'];
  const opportunityCount = intelligenceSignals.length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const getCardAnimation = useCallback(
    (id: string) => {
      if (!cardAnimations[id]) {
        cardAnimations[id] = new Animated.Value(0);
      }
      return cardAnimations[id];
    },
    [cardAnimations]
  );
  const filteredSignals = useMemo(() => {
    const strategy = FILTER_STRATEGIES[activeFilter];
    return intelligenceSignals.filter((item) => (strategy ? strategy(item) : true));
  }, [activeFilter]);

  useEffect(() => {
    const sequence = Animated.stagger(
      CARD_STAGGER_DELAY_MS,
      filteredSignals.map((signal) => {
        const animation = getCardAnimation(signal.id);
        animation.setValue(0);
        return Animated.timing(animation, {
          toValue: 1,
          duration: CARD_ANIMATION_DURATION_MS,
          useNativeDriver: true,
        });
      })
    );
    sequence.start();
  }, [filteredSignals, getCardAnimation]);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoaderIndex((prev) => (prev + 1) % loadingStates.length);
    }, LOADING_STATE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadingStates.length]);

  const toggleSave = (id: string) => {
    setSavedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const handleViewDetails = (id: string) => {
    setExpandedDetailId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}
        showsVerticalScrollIndicator={false}>
        <Card
          theme={theme}
          style={{
            gap: theme.spacing.md,
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colors.surface,
            shadowOpacity: theme.appearance === 'dark' ? 0.38 : 0.14,
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{greeting}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <LivePulse theme={theme} />
              <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>Live scan</Text>
            </View>
          </View>
          <Text style={{ ...theme.typography.h2, color: theme.colors.textPrimary }}>
            {opportunityCount} new internship signals detected today
          </Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
            AI interpretation prioritized. Raw source confidence is continuously recalculated.
          </Text>
          <View style={{ flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' }}>
            <Chip theme={theme} label={loadingStates[loaderIndex]} variant="blue" />
            <Chip theme={theme} label={`${opportunityCount} opportunities`} variant="violet" />
          </View>
        </Card>

        <View
          style={{
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radius.lg,
            borderWidth: StyleSheet.hairlineWidth,
            borderColor: theme.colors.border,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            shadowColor: theme.colors.accentBlue,
            shadowOpacity: theme.appearance === 'dark' ? 0.22 : 0.12,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 2,
          }}>
          <Text style={{ ...theme.typography.body, color: theme.colors.textMuted }}>
            ✦ Ask AI: “Find React internships in Nigeria with strong portfolio fit”
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: theme.spacing.sm }}>
          {filters.map((filter) => {
            const selected = activeFilter === filter;
            return (
              <Pressable key={filter} onPress={() => setActiveFilter(filter)}>
                {({ pressed }) => (
                  <View
                    style={{
                      borderRadius: theme.radius.pill,
                      paddingHorizontal: theme.spacing.sm,
                      paddingVertical: 9,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: selected ? theme.colors.accentBlue : theme.colors.border,
                      backgroundColor: selected
                        ? `${theme.colors.accentBlue}28`
                        : pressed
                          ? theme.colors.surfaceElevated
                          : theme.colors.surface,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    }}>
                    <Text
                      style={{
                        ...theme.typography.meta,
                        color: selected ? theme.colors.accentBlue : theme.colors.textSecondary,
                      }}>
                      {filter}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={{ gap: theme.spacing.md }}>
          {filteredSignals.map((item) => {
            const animation = getCardAnimation(item.id);
            const sourceExpanded = expandedSourceId === item.id;
            const detailsExpanded = expandedDetailId === item.id;
            const saved = Boolean(savedIds[item.id]);
            return (
              <Animated.View
                key={item.id}
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
                }}>
                <Card theme={theme} style={{ gap: theme.spacing.md, borderRadius: theme.radius.lg }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{item.role}</Text>
                      <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                        {item.company} · {item.location}
                      </Text>
                    </View>
                    <Chip theme={theme} label={`${item.aiMatchScore}% match`} variant="violet" />
                  </View>

                  <View
                    style={{
                      borderRadius: theme.radius.md,
                      backgroundColor: `${theme.colors.accentBlue}14`,
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: `${theme.colors.accentBlue}66`,
                      padding: theme.spacing.sm,
                    }}>
                    <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary }}>{item.aiSummary}</Text>
                  </View>

                  <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Detected {item.postedAt}</Text>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {item.skillTags.map((tag) => (
                      <Chip key={`${item.id}-${tag}`} theme={theme} label={tag} />
                    ))}
                  </View>

                  {detailsExpanded ? (
                    <View
                      style={{
                        borderRadius: theme.radius.md,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: theme.colors.border,
                        padding: theme.spacing.sm,
                        backgroundColor: theme.colors.surfaceStrong,
                      }}>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                        {item.company} · {item.location}
                      </Text>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                        AI match score: {item.aiMatchScore}% · Detected {item.postedAt}
                      </Text>
                    </View>
                  ) : null}

                  <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
                    <Pressable onPress={() => toggleSave(item.id)} style={{ flex: 1 }}>
                      {({ pressed }) => (
                        <View
                          style={{
                            alignItems: 'center',
                            borderRadius: theme.radius.md,
                            paddingVertical: 10,
                            borderWidth: StyleSheet.hairlineWidth,
                            borderColor: theme.colors.border,
                            backgroundColor: pressed ? theme.colors.surfaceElevated : theme.colors.surfaceStrong,
                            transform: [{ scale: pressed ? 0.985 : 1 }],
                          }}>
                          <Text style={{ ...theme.typography.meta, color: theme.colors.textPrimary }}>
                            {saved ? 'Saved' : 'Save'}
                          </Text>
                        </View>
                      )}
                    </Pressable>
                    <Pressable onPress={() => handleViewDetails(item.id)} style={{ flex: 1 }}>
                      {({ pressed }) => (
                        <View
                          style={{
                            alignItems: 'center',
                            borderRadius: theme.radius.md,
                            paddingVertical: 10,
                            backgroundColor: pressed ? `${theme.colors.accentBlue}CC` : theme.colors.accentBlue,
                            transform: [{ scale: pressed ? 0.985 : 1 }],
                          }}>
                          <Text style={{ ...theme.typography.meta, color: theme.colors.surface }}>View details</Text>
                        </View>
                      )}
                    </Pressable>
                  </View>

                  <Pressable onPress={() => setExpandedSourceId(sourceExpanded ? null : item.id)}>
                    {({ pressed }) => (
                      <View style={{ gap: 6, opacity: pressed ? 0.85 : 1 }}>
                        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>
                          Raw source {sourceExpanded ? '▲' : '▼'}
                        </Text>
                        {sourceExpanded ? (
                          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                            {item.sourcePostPreview}
                          </Text>
                        ) : null}
                      </View>
                    )}
                  </Pressable>
                </Card>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
