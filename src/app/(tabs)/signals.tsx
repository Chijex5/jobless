import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

import { Card, LivePulse, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

const TREND_CARDS = [
  {
    id: 'skills',
    title: 'Trending Skills',
    summary: 'Demand concentration in product-facing engineering internships.',
    items: [
      { label: 'React', change: 32, detail: 'UI-heavy internship posts continue to rise across global startup teams.' },
      { label: 'Python', change: 28, detail: 'Data and automation internship roles remain consistently active.' },
      { label: 'AI/ML', change: 41, detail: 'AI research and model-ops internships show the strongest growth this week.' },
    ],
  },
  {
    id: 'companies',
    title: 'Active Companies',
    summary: 'Hiring spikes led by fast-moving startups and AI product teams.',
    items: [
      {
        label: 'Startups (AI-first)',
        change: 35,
        detail: 'Seed to Series B teams are posting internship roles aggressively for product velocity.',
      },
      {
        label: 'Fintech (Nigeria)',
        change: 27,
        detail: 'Lagos and Abuja fintechs are expanding internship hiring across frontend and backend tracks.',
      },
      {
        label: 'Global Big Tech',
        change: 16,
        detail: 'Large platforms are reopening internship cohorts with tighter role requirements.',
      },
    ],
  },
  {
    id: 'movement',
    title: 'Market Movement',
    summary: 'Role patterns indicate a continued shift toward AI-enabled remote work.',
    items: [
      { label: 'Remote internships', change: 24, detail: 'Cross-border internship sourcing is increasing in engineering roles.' },
      {
        label: 'AI internships',
        change: 39,
        detail: 'AI tooling, model evaluation, and applied LLM roles are accelerating fastest.',
      },
      {
        label: 'Traditional roles',
        change: -14,
        detail: 'Generalist non-specialized internship postings are trending downward this cycle.',
      },
    ],
  },
] as const;

const INSIGHTS = [
  {
    id: 'insight-1',
    title: 'AI startups show highest internship activity this week',
    detail: 'Early-stage AI startups now account for the largest share of new internship postings in this monitoring window.',
    confidence: 'High confidence',
  },
  {
    id: 'insight-2',
    title: 'Frontend internships are 18% more competitive',
    detail: 'Applicant-to-opening pressure is strongest in frontend tracks, especially for React + TypeScript profiles.',
    confidence: 'Moderate confidence',
  },
  {
    id: 'insight-3',
    title: 'Remote roles dominate current postings',
    detail: 'Remote internship options continue to lead globally, with Nigeria-origin candidates seeing wider access to international roles.',
    confidence: 'High confidence',
  },
  {
    id: 'insight-4',
    title: 'Nigeria fintech internships continue upward momentum',
    detail: 'Regional signal clustering indicates sustained growth in fintech engineering intern demand across Lagos and Abuja.',
    confidence: 'Moderate confidence',
  },
] as const;

type AppTheme = ReturnType<typeof useAppTheme>;
type TrendItem = (typeof TREND_CARDS)[number]['items'][number];

function AnimatedChange({ value, theme }: { value: number; theme: AppTheme }) {
  const progress = useRef(new Animated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(0);
    const listenerId = progress.addListener(({ value: raw }) => {
      const next = Math.round(raw * value);
      setDisplayValue(next);
    });

    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 760,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });

    animation.start();

    return () => {
      progress.removeListener(listenerId);
      progress.stopAnimation();
    };
  }, [progress, value]);

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', `${Math.min(Math.abs(value), 100)}%`],
  });

  const isPositive = value >= 0;
  const barColor = isPositive ? theme.colors.accentBlue : theme.colors.accentWarning;

  return (
    <View style={{ gap: 6 }}>
      <Text
        style={{
          ...theme.typography.h3,
          color: isPositive ? theme.colors.accentBlue : theme.colors.accentWarning,
        }}>
        {isPositive ? '+' : ''}
        {displayValue}%
      </Text>
      <View
        style={{
          height: 6,
          borderRadius: theme.radius.pill,
          backgroundColor: theme.colors.surfaceStrong,
          overflow: 'hidden',
        }}>
        <Animated.View
          style={{
            height: '100%',
            width,
            backgroundColor: barColor,
            borderRadius: theme.radius.pill,
          }}
        />
      </View>
    </View>
  );
}

function TrendRow({
  item,
  theme,
  expanded,
}: {
  item: TrendItem;
  theme: AppTheme;
  expanded: boolean;
}) {
  return (
    <View
      style={{
        gap: theme.spacing.xs,
        padding: theme.spacing.sm,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        backgroundColor: theme.appearance === 'dark' ? `${theme.colors.surfaceElevated}90` : theme.colors.surface,
      }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, alignItems: 'center' }}>
        <Text style={{ ...theme.typography.body, color: theme.colors.textPrimary, flex: 1 }}>{item.label}</Text>
        <View style={{ minWidth: 92 }}>
          <AnimatedChange value={item.change} theme={theme} />
        </View>
      </View>
      {expanded ? <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>{item.detail}</Text> : null}
    </View>
  );
}

export default function SignalsScreen() {
  const theme = useAppTheme();
  const [expandedCardId, setExpandedCardId] = useState<string | null>(TREND_CARDS[0].id);

  useEffect(() => {
    if (Platform.OS === 'android') {
      UIManager.setLayoutAnimationEnabledExperimental?.(true);
    }
  }, []);

  const topPanelBackground = useMemo(
    () => (theme.appearance === 'dark' ? `${theme.colors.accentBlue}14` : theme.colors.surface),
    [theme.appearance, theme.colors.accentBlue, theme.colors.surface]
  );

  const glowShadow = theme.appearance === 'dark' ? theme.colors.accentBlue : theme.colors.shadow;

  const toggleCard = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedCardId((current) => (current === id ? null : id));
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
            backgroundColor: topPanelBackground,
            shadowColor: glowShadow,
            shadowOpacity: theme.appearance === 'dark' ? 0.32 : 0.12,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 2,
          }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, alignItems: 'center' }}>
            <View style={{ gap: 4, flex: 1 }}>
              <Text style={{ ...theme.typography.h1, color: theme.colors.textPrimary }}>Signals</Text>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                AI-generated internship intelligence trends
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs }}>
              <LivePulse theme={theme} />
              <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>Updated moments ago</Text>
            </View>
          </View>
        </Card>

        <SectionHeader theme={theme} title="Trend Intelligence" subtitle="Patterns across skills, hiring behavior, and market movement" />

        <View style={{ gap: theme.spacing.md }}>
          {TREND_CARDS.map((card) => {
            const expanded = expandedCardId === card.id;
            return (
              <Pressable key={card.id} onPress={() => toggleCard(card.id)}>
                {({ pressed }) => (
                  <Card
                    theme={theme}
                    style={{
                      borderRadius: theme.radius.lg,
                      gap: theme.spacing.sm,
                      borderColor: expanded ? `${theme.colors.accentBlue}7A` : theme.colors.border,
                      shadowColor: expanded ? theme.colors.accentBlue : theme.colors.shadow,
                      shadowOpacity: expanded ? (theme.appearance === 'dark' ? 0.28 : 0.14) : theme.appearance === 'dark' ? 0.2 : 0.1,
                      transform: [{ scale: pressed ? 0.992 : 1 }],
                    }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm, alignItems: 'center' }}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{card.title}</Text>
                        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{card.summary}</Text>
                      </View>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>{expanded ? 'Hide' : 'Expand'}</Text>
                    </View>

                    <View style={{ gap: theme.spacing.sm }}>
                      {card.items.map((item) => (
                        <TrendRow key={`${card.id}-${item.label}`} item={item} theme={theme} expanded={expanded} />
                      ))}
                    </View>
                  </Card>
                )}
              </Pressable>
            );
          })}
        </View>

        <SectionHeader theme={theme} title="AI Insight Reports" subtitle="Generated market interpretations from current internship activity" />

        <View style={{ gap: theme.spacing.md }}>
          {INSIGHTS.map((insight) => (
            <Card
              key={insight.id}
              theme={theme}
              style={{
                borderRadius: theme.radius.lg,
                gap: theme.spacing.xs,
                borderColor: theme.colors.border,
                backgroundColor: theme.appearance === 'dark' ? `${theme.colors.surfaceStrong}D8` : theme.colors.surface,
              }}>
              <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{insight.title}</Text>
              <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{insight.detail}</Text>
              <Text style={{ ...theme.typography.meta, color: theme.colors.accentViolet }}>{insight.confidence}</Text>
            </Card>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
