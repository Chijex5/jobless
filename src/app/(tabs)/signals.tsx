import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card, SectionHeader } from '@/components/ui';
import { useAppTheme } from '@/theme/use-app-theme';

type NotificationCategory =
  | 'High Match Opportunity'
  | 'Trending Opportunity'
  | 'Deadline Alert'
  | 'AI Insight Alert'
  | 'System Activity'
  | 'Queue Reminder';

type NotificationPriority = 'high' | 'medium' | 'low';

type NotificationItem = {
  id: string;
  section: 'Today' | 'Earlier This Week' | 'Intelligence Updates' | 'Opportunity Alerts' | 'System Activity';
  title: string;
  context: string;
  time: string;
  category: NotificationCategory;
  priority: NotificationPriority;
  matchScore?: number;
  urgency?: string;
  actions: string[];
};

const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    section: 'Today',
    title: 'New frontend internship detected — 94% match',
    context: 'Signal mapped your React + TypeScript profile to a remote startup role with strong mentor coverage.',
    time: '9:14 AM',
    category: 'High Match Opportunity',
    priority: 'high',
    matchScore: 94,
    actions: ['Save', 'Open', 'Mark important', 'Mute similar'],
  },
  {
    id: 'n2',
    section: 'Today',
    title: 'Application deadline approaching in 24 hours',
    context: 'Berlin AI product internship closes tomorrow. You marked it as interested on May 24.',
    time: '8:02 AM',
    category: 'Deadline Alert',
    priority: 'high',
    urgency: '24h',
    actions: ['Open', 'Save', 'Dismiss'],
  },
  {
    id: 'n3',
    section: 'Today',
    title: 'This AI startup internship is gaining attention quickly',
    context: 'View velocity is up 38% since yesterday among candidates with frontend + LLM stack keywords.',
    time: '7:47 AM',
    category: 'Trending Opportunity',
    priority: 'medium',
    actions: ['Open', 'Mark important', 'Mute similar'],
  },
  {
    id: 'n4',
    section: 'Earlier This Week',
    title: 'You marked this role as interested 3 days ago',
    context: 'Remote frontend internship at a seed-stage fintech startup has not been submitted yet.',
    time: 'Mon · 4:42 PM',
    category: 'Queue Reminder',
    priority: 'medium',
    actions: ['Open', 'Dismiss'],
  },
  {
    id: 'n5',
    section: 'Intelligence Updates',
    title: 'React internships increased 21% this week',
    context: 'Growth is concentrated in product-led AI companies hiring interns for web interface and workflow tooling.',
    time: 'Mon · 11:10 AM',
    category: 'AI Insight Alert',
    priority: 'high',
    actions: ['Open', 'Save'],
  },
  {
    id: 'n6',
    section: 'Opportunity Alerts',
    title: '3 new remote internships match your interests',
    context: 'All three roles mention modern frontend stack + AI collaboration features in their internship scope.',
    time: 'Sun · 3:20 PM',
    category: 'High Match Opportunity',
    priority: 'high',
    matchScore: 89,
    actions: ['Open', 'Save', 'Mute similar'],
  },
  {
    id: 'n7',
    section: 'System Activity',
    title: 'Twitter scanner detected 12 new opportunities',
    context: 'Signal ingested startup internship posts and filtered 4 as potential high-signal matches for your profile.',
    time: 'Sun · 10:32 AM',
    category: 'System Activity',
    priority: 'low',
    actions: ['Dismiss'],
  },
];

const SECTION_ORDER: NotificationItem['section'][] = [
  'Today',
  'Earlier This Week',
  'Intelligence Updates',
  'Opportunity Alerts',
  'System Activity',
];

export default function SignalsScreen() {
  const theme = useAppTheme();
  const [importantIds, setImportantIds] = useState<string[]>([]);

  const grouped = useMemo(() => {
    const map = new Map<NotificationItem['section'], NotificationItem[]>();
    for (const section of SECTION_ORDER) {
      map.set(section, []);
    }
    for (const item of NOTIFICATIONS) {
      map.get(item.section)?.push(item);
    }
    return map;
  }, []);

  const priorityStyles = (priority: NotificationPriority) => {
    if (priority === 'high') {
      return {
        borderColor: `${theme.colors.accentViolet}7A`,
        glow: theme.appearance === 'dark' ? 0.32 : 0.14,
        tint: theme.appearance === 'dark' ? `${theme.colors.accentBlue}18` : `${theme.colors.accentBlue}10`,
      };
    }

    if (priority === 'medium') {
      return {
        borderColor: theme.colors.border,
        glow: theme.appearance === 'dark' ? 0.2 : 0.08,
        tint: theme.appearance === 'dark' ? `${theme.colors.surfaceElevated}66` : theme.colors.surface,
      };
    }

    return {
      borderColor: theme.colors.border,
      glow: 0.05,
      tint: theme.appearance === 'dark' ? `${theme.colors.surface}D9` : theme.colors.surfaceStrong,
    };
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.lg,
          paddingBottom: theme.spacing.xxl,
          gap: theme.spacing.lg,
        }}>
        <Card theme={theme} style={{ gap: theme.spacing.sm, borderRadius: theme.radius.lg }}>
          <Text style={{ ...theme.typography.h1, color: theme.colors.textPrimary }}>Signal Notifications</Text>
          <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>
            Quiet intelligence alerts for internships: high-signal, low-noise, and timed for action.
          </Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm }}>
            <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>Push tone: calm and concise</Text>
            <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>7 meaningful alerts this week</Text>
          </View>
        </Card>

        {SECTION_ORDER.map((section) => {
          const items = grouped.get(section) ?? [];
          if (items.length === 0) {
            return null;
          }

          return (
            <View key={section} style={{ gap: theme.spacing.sm }}>
              <SectionHeader
                theme={theme}
                title={section}
                subtitle={section === 'Today' ? 'Important updates surfaced in real time' : 'Prioritized by relevance and urgency'}
              />
              {items.map((item) => {
                const priority = priorityStyles(item.priority);
                const isImportant = importantIds.includes(item.id);

                return (
                  <Card
                    key={item.id}
                    theme={theme}
                    style={{
                      gap: theme.spacing.xs,
                      borderRadius: theme.radius.lg,
                      borderColor: priority.borderColor,
                      backgroundColor: priority.tint,
                      shadowOpacity: priority.glow,
                      shadowColor: theme.colors.accentBlue,
                    }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.xs, alignItems: 'center' }}>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.accentViolet }}>{item.category}</Text>
                      <Text style={{ ...theme.typography.meta, color: theme.colors.textMuted }}>{item.time}</Text>
                    </View>

                    <Text style={{ ...theme.typography.h3, color: theme.colors.textPrimary }}>{item.title}</Text>
                    <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>{item.context}</Text>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs }}>
                      {typeof item.matchScore === 'number' ? (
                        <View style={{ borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: `${theme.colors.accentBlue}22` }}>
                          <Text style={{ ...theme.typography.meta, color: theme.colors.accentBlue }}>Match {item.matchScore}%</Text>
                        </View>
                      ) : null}
                      {item.urgency ? (
                        <View style={{ borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: `${theme.colors.accentWarning}22` }}>
                          <Text style={{ ...theme.typography.meta, color: theme.colors.accentWarning }}>Urgency {item.urgency}</Text>
                        </View>
                      ) : null}
                      <View style={{ borderRadius: theme.radius.pill, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: `${theme.colors.accentViolet}1F` }}>
                        <Text style={{ ...theme.typography.meta, color: theme.colors.accentViolet }}>
                          {item.priority === 'high' ? 'High priority' : item.priority === 'medium' ? 'Medium priority' : 'Low priority'}
                        </Text>
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs, paddingTop: 2 }}>
                      {item.actions.map((action) => (
                        <Pressable
                          key={`${item.id}-${action}`}
                          onPress={() => {
                            if (action === 'Mark important') {
                              setImportantIds((current) =>
                                current.includes(item.id) ? current.filter((entry) => entry !== item.id) : [...current, item.id]
                              );
                            }
                          }}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 6,
                            borderRadius: theme.radius.pill,
                            borderWidth: 1,
                            borderColor: action === 'Mark important' && isImportant ? theme.colors.accentBlue : theme.colors.border,
                            backgroundColor: action === 'Mark important' && isImportant ? `${theme.colors.accentBlue}20` : 'transparent',
                          }}>
                          <Text style={{ ...theme.typography.meta, color: theme.colors.textSecondary }}>{action}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </Card>
                );
              })}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}
