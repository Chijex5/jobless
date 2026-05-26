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

export type IntelligenceSignal = {
  id: string;
  role: string;
  company: string;
  location: string;
  aiMatchScore: number;
  postedAt: string;
  aiSummary: string;
  skillTags: string[];
  sourcePostPreview: string;
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

export const intelligenceSignals: IntelligenceSignal[] = [
  {
    id: 'intel-1',
    role: 'Frontend Engineering Intern',
    company: 'Paystack',
    location: 'Lagos, Nigeria · Hybrid',
    aiMatchScore: 94,
    postedAt: '6m ago',
    aiSummary:
      'Strong match for React-focused frontend developers with portfolio experience and responsive UI execution.',
    skillTags: ['React', 'TypeScript', 'UI Engineering'],
    sourcePostPreview:
      'We are opening internship slots for frontend engineers who can ship polished product surfaces quickly.',
  },
  {
    id: 'intel-2',
    role: 'Backend Intern',
    company: 'Moniepoint',
    location: 'Abuja, Nigeria · Onsite',
    aiMatchScore: 86,
    postedAt: '18m ago',
    aiSummary:
      'Good fit for API-first candidates comfortable with scalable backend systems and production debugging.',
    skillTags: ['Node.js', 'PostgreSQL', 'APIs'],
    sourcePostPreview:
      'Hiring backend interns to support transaction APIs, reliability tooling, and internal platform services.',
  },
  {
    id: 'intel-3',
    role: 'AI Engineering Intern',
    company: 'Hugging Face',
    location: 'Remote · Global',
    aiMatchScore: 91,
    postedAt: '29m ago',
    aiSummary:
      'High alignment for Python builders with model experimentation skills and open-source collaboration habits.',
    skillTags: ['Python', 'LLMs', 'MLOps'],
    sourcePostPreview:
      'Looking for AI engineering interns to prototype model workflows and contribute to tooling used by the community.',
  },
  {
    id: 'intel-4',
    role: 'Data Science Intern',
    company: 'Andela',
    location: 'Remote · Africa',
    aiMatchScore: 82,
    postedAt: '47m ago',
    aiSummary:
      'Relevant for data-focused applicants who can turn noisy datasets into clear business signals for teams.',
    skillTags: ['Python', 'SQL', 'Experimentation'],
    sourcePostPreview:
      'Data internship opening focused on analytics pipelines, forecasting, and experimentation support.',
  },
  {
    id: 'intel-5',
    role: 'Software Engineering Intern',
    company: 'Flutterwave',
    location: 'Lagos, Nigeria · Hybrid',
    aiMatchScore: 78,
    postedAt: '1h ago',
    aiSummary:
      'Moderate match for full-stack candidates with shipping experience and strong communication in cross-team projects.',
    skillTags: ['React', 'Go', 'Testing'],
    sourcePostPreview:
      'Internship applications now open for engineers interested in fintech infrastructure and developer productivity.',
  },
  {
    id: 'intel-6',
    role: 'Frontend Intern',
    company: 'Vercel',
    location: 'Remote · Global',
    aiMatchScore: 89,
    postedAt: '1h 22m ago',
    aiSummary:
      'Very strong for frontend candidates who already build high-performance React interfaces and care about DX.',
    skillTags: ['React', 'Next.js', 'Performance'],
    sourcePostPreview:
      'Seeking frontend interns excited by web performance, product polish, and collaborative experimentation.',
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
