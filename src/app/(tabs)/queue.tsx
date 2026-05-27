import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { ScreenShell } from '@/components/screen-shell';
import { Card, Chip, EmptyState } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

const pipelineStages = ['saved', 'reviewed', 'interested', 'preparing', 'applied', 'ignored'] as const;
type PipelineStage = (typeof pipelineStages)[number];

type QueueOpportunity = {
  id: string;
  role: string;
  company: string;
  matchScore?: number;
  status: PipelineStage;
  addedAt: string;
  aiSummary: string;
  aiHint?: string;
};

const queueItems: QueueOpportunity[] = [
  {
    id: 'q-01',
    role: 'Frontend Engineering Intern',
    company: 'Vercel',
    matchScore: 91,
    status: 'saved',
    addedAt: '2h ago',
    aiSummary: 'Design-system heavy role with strong React performance focus.',
    aiHint: 'Similar opportunities found at Linear and Framer.',
  },
  {
    id: 'q-02',
    role: 'AI Product Intern',
    company: 'Perplexity',
    matchScore: 94,
    status: 'interested',
    addedAt: '5h ago',
    aiSummary: 'High portfolio fit for retrieval UX and experimentation loops.',
    aiHint: 'High priority — apply within 3 days.',
  },
  {
    id: 'q-03',
    role: 'Backend Intern',
    company: 'Retool',
    matchScore: 83,
    status: 'reviewed',
    addedAt: '1d ago',
    aiSummary: 'API and workflow engine intern role with hands-on ownership.',
  },
  {
    id: 'q-04',
    role: 'Machine Learning Intern',
    company: 'Cohere',
    matchScore: 89,
    status: 'preparing',
    addedAt: '1d ago',
    aiSummary: 'Strong fit for eval pipelines and prompt iteration workflows.',
    aiHint: 'AI suggests preparing resume for this role.',
  },
  {
    id: 'q-05',
    role: 'Software Engineering Intern',
    company: 'Stripe',
    matchScore: 87,
    status: 'applied',
    addedAt: '2d ago',
    aiSummary: 'Application submitted; waiting on recruiter timeline update.',
  },
  {
    id: 'q-06',
    role: 'Full Stack Intern',
    company: 'Stealth Fintech',
    matchScore: 62,
    status: 'ignored',
    addedAt: '3d ago',
    aiSummary: 'Scope mismatch with your current frontend and AI internship track.',
  },
];

const labels: Record<PipelineStage, string> = {
  saved: 'Saved',
  reviewed: 'Reviewed',
  interested: 'Interested',
  preparing: 'Preparing',
  applied: 'Applied',
  ignored: 'Ignored',
};

export default function QueueScreen() {
  const theme = useAppTheme();
  const [activeStage, setActiveStage] = useState<PipelineStage>('saved');
  const pulse = useRef(new Animated.Value(0.8)).current;

  const stageColors = {
    saved: theme.colors.accentBlue,
    reviewed: '#69A6FF',
    interested: theme.colors.accentViolet,
    preparing: theme.colors.accentWarning,
    applied: theme.colors.accentSuccess,
    ignored: theme.colors.textMuted,
  };

  const stageItems = useMemo(
    () => queueItems.filter((item) => item.status === activeStage),
    [activeStage],
  );

  const stats = {
    totalSaved: queueItems.filter((item) => item.status === 'saved').length,
    activeApplications: queueItems.filter((item) => item.status === 'preparing' || item.status === 'applied').length,
    pendingActions: queueItems.filter((item) => item.status !== 'applied' && item.status !== 'ignored').length,
  };

  useEffect(() => {
    if (activeStage !== 'preparing') {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.8, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();

    return () => loop.stop();
  }, [activeStage, pulse]);

  return (
    <ScreenShell theme={theme} title="Queue" subtitle="Your opportunity pipeline">
      <Card theme={theme}>
        <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Pipeline Status</Text>
        <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
          <PipelineStat theme={theme} label="Saved" value={stats.totalSaved} />
          <PipelineStat theme={theme} label="Active" value={stats.activeApplications} />
          <PipelineStat theme={theme} label="Pending" value={stats.pendingActions} />
        </View>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
        {pipelineStages.map((stage) => (
          <Pressable key={stage} onPress={() => setActiveStage(stage)}>
            <Chip
              theme={theme}
              label={`${labels[stage]} (${queueItems.filter((item) => item.status === stage).length})`}
              variant={activeStage === stage ? 'violet' : 'default'}
            />
          </Pressable>
        ))}
      </View>

      {stageItems.length === 0 ? (
        <EmptyState
          theme={theme}
          title={`No ${labels[activeStage].toLowerCase()} opportunities yet`}
          body="AI is still scanning Twitter for matches."
        />
      ) : (
        stageItems.map((item) => {
          const preparingPulse = item.status === 'preparing' ? { transform: [{ scale: pulse }] } : undefined;

          return (
            <Animated.View
              key={item.id}
              style={[
                preparingPulse,
                {
                  borderRadius: theme.radius.md,
                  shadowColor: stageColors[item.status],
                  shadowOpacity: theme.appearance === 'dark' ? 0.24 : 0.1,
                  shadowRadius: 14,
                  shadowOffset: { width: 0, height: 8 },
                },
              ]}>
              <Card
                theme={theme}
                style={{
                  borderColor: stageColors[item.status],
                  backgroundColor: theme.colors.surface,
                }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <View style={{ flexShrink: 1 }}>
                    <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{item.role}</Text>
                    <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{item.company}</Text>
                  </View>
                  <Chip theme={theme} label={labels[item.status]} variant="default" />
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>Added {item.addedAt}</Text>
                  <Text style={{ ...theme.typography.meta, color: stageColors[item.status] }}>
                    {item.matchScore ? `${item.matchScore}% match` : 'Match pending'}
                  </Text>
                </View>

                <Text numberOfLines={1} style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
                  {item.aiSummary}
                </Text>

                {item.aiHint ? (
                  <View
                    style={{
                      borderRadius: theme.radius.sm,
                      borderWidth: 1,
                      borderColor: theme.colors.border,
                      padding: theme.spacing.xs,
                      backgroundColor: theme.colors.surfaceStrong,
                    }}>
                    <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>{item.aiHint}</Text>
                  </View>
                ) : null}

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                  <Chip theme={theme} label="Move to next" variant="blue" />
                  <Chip theme={theme} label="Mark as applied" variant="success" />
                  <Chip theme={theme} label="View details" variant="default" />
                  <Chip theme={theme} label="Remove" variant="default" />
                </View>
              </Card>
            </Animated.View>
          );
        })
      )}
    </ScreenShell>
  );
}

function PipelineStat({ theme, label, value }: { theme: ReturnType<typeof useAppTheme>; label: string; value: number }) {
  return (
    <View
      style={{
        flex: 1,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.surfaceStrong,
        padding: theme.spacing.sm,
      }}>
      <Text style={{ ...theme.typography.h2, color: theme.colors.textPrimary }}>{value}</Text>
      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{label}</Text>
    </View>
  );
}
