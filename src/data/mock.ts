export type InternshipSignal = {
  id: string;
  company: string;
  role: string;
  location: string;
  postSource: string;
  postedAt: string;
  aiMatchScore: number;
  aiSummary: string;
  skillTags: string[];
  notificationState: 'new' | 'tracked' | 'muted';
};

export const internshipSignals: InternshipSignal[] = [
  {
    id: 'sig-1',
    company: 'Stripe',
    role: 'Software Engineering Intern',
    location: 'Remote (US)',
    postSource: '@stripeeng',
    postedAt: '12m ago',
    aiMatchScore: 93,
    aiSummary: 'High alignment with TypeScript + API tooling. Early-stage posting velocity suggests fast fill.',
    skillTags: ['TypeScript', 'APIs', 'React Native'],
    notificationState: 'new',
  },
  {
    id: 'sig-2',
    company: 'Datadog',
    role: 'Product Analytics Intern',
    location: 'New York, NY',
    postSource: '@datadog',
    postedAt: '37m ago',
    aiMatchScore: 87,
    aiSummary: 'Strong analytics fit and repeated hiring language indicates multiple intern openings.',
    skillTags: ['SQL', 'Python', 'Analytics'],
    notificationState: 'tracked',
  },
  {
    id: 'sig-3',
    company: 'Notion',
    role: 'Design Systems Intern',
    location: 'San Francisco, CA',
    postSource: '@NotionHQ',
    postedAt: '1h ago',
    aiMatchScore: 84,
    aiSummary: 'Design-token experience and prototyping strengths map well to role descriptors.',
    skillTags: ['Figma', 'UI Systems', 'Prototyping'],
    notificationState: 'tracked',
  },
];
