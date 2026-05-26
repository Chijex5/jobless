export type NotificationState = 'new' | 'watching' | 'resolved';

export type InternshipOpportunity = {
  id: string;
  role: string;
  company: string;
  location: string;
  sourceHandle: string;
  postedAt: string;
  aiMatchScore: number;
  aiSummary: string;
  tags: string[];
  queueState: 'review' | 'ready' | 'applied';
  notificationState: NotificationState;
};

export const internshipOpportunities: InternshipOpportunity[] = [
  {
    id: 'sig-204',
    role: 'Product Design Intern',
    company: 'Notion Labs',
    location: 'San Francisco, CA · Hybrid',
    sourceHandle: '@notionhq',
    postedAt: '12m ago',
    aiMatchScore: 92,
    aiSummary:
      'Portfolio-friendly design systems internship with direct product mentorship and clear ownership scope.',
    tags: ['Figma', 'UX Research', 'Design Systems'],
    queueState: 'review',
    notificationState: 'new',
  },
  {
    id: 'sig-198',
    role: 'Machine Learning Intern',
    company: 'Databricks',
    location: 'Seattle, WA · Onsite',
    sourceHandle: '@databricks',
    postedAt: '34m ago',
    aiMatchScore: 88,
    aiSummary:
      'Strong fit for candidates with model evaluation and Python stack confidence; high growth potential.',
    tags: ['Python', 'Pandas', 'Modeling'],
    queueState: 'ready',
    notificationState: 'watching',
  },
  {
    id: 'sig-192',
    role: 'Software Engineering Intern',
    company: 'Stripe',
    location: 'Remote · US',
    sourceHandle: '@stripe',
    postedAt: '1h ago',
    aiMatchScore: 85,
    aiSummary:
      'Backend internship signal emphasizes API quality and developer tooling, with practical mentorship cadence.',
    tags: ['TypeScript', 'APIs', 'Distributed Systems'],
    queueState: 'review',
    notificationState: 'new',
  },
  {
    id: 'sig-181',
    role: 'Data Analyst Intern',
    company: 'Canva',
    location: 'Austin, TX · Hybrid',
    sourceHandle: '@canva',
    postedAt: '2h ago',
    aiMatchScore: 79,
    aiSummary:
      'Good analytical track for dashboard-focused candidates; requires SQL confidence and storytelling clarity.',
    tags: ['SQL', 'Looker', 'A/B Testing'],
    queueState: 'applied',
    notificationState: 'resolved',
  },
];

export const monitorFeed = [
  {
    id: 'm-1',
    title: 'Hiring velocity increased',
    detail: 'AI detected a 23% rise in internship-related posts in the last 48 hours.',
    timestamp: 'Now',
    severity: 'high' as const,
  },
  {
    id: 'm-2',
    title: 'Remote roles downshift',
    detail: 'Remote-only opportunities are trending 9% lower this week.',
    timestamp: '11m ago',
    severity: 'medium' as const,
  },
  {
    id: 'm-3',
    title: 'Product roles warming up',
    detail: 'Design and PM internship mentions are climbing in Bay Area hubs.',
    timestamp: '27m ago',
    severity: 'low' as const,
  },
];

export const queueStats = [
  { id: 'q1', label: 'Ready to apply', value: 9 },
  { id: 'q2', label: 'Needs review', value: 14 },
  { id: 'q3', label: 'Submitted', value: 6 },
];

