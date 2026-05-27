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

export  type PipelineStage = {
  "new" : string;
  saved : string;
  applied : string;
  interviewing : string;
  offered : string;
  rejected : string;
}

export type IntelligenceSignal = {
  id: string;
  role: string;
  company: string;
  location: string;
  aiMatchScore: number;
  status?:  string;
  postedAt: string;
  aiSummary: string;
  skillTags: string[];
  sourcePostPreview: string;
  sourceHandle: string;
  sourceUrl: string;
  relevanceReason: string;
  skillAlignment: string;
  extractionConfidence: 'High' | 'Medium' | 'Low';
  roleType: string;
  roleMode: 'Remote' | 'Hybrid' | 'On-site';
  applicationStatus: 'Open' | 'Closing soon' | 'Unknown';
  sourceConfidence: 'High' | 'Medium' | 'Low';
  originalSourceText: string;
  platform?: string | null;
  sourceMetadata: string[];
  relatedIds: string[];
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
    sourceHandle: '@paystack',
    sourceUrl: 'https://x.com/paystack/status/198001120111',
    relevanceReason:
      'Matches your frontend profile and portfolio-first track with direct product feature ownership expectations.',
    skillAlignment:
      'Role emphasis maps to your React, TypeScript, and API integration strengths with component architecture depth.',
    extractionConfidence: 'High',
    roleType: 'Frontend Engineering Intern',
    roleMode: 'Hybrid',
    applicationStatus: 'Open',
    sourceConfidence: 'High',
    originalSourceText:
      'Paystack internship cycle is now open for frontend engineering interns. Looking for builders who can ship polished interfaces, collaborate with design, and work on production-ready components.',
    sourceMetadata: ['X/Twitter', 'Hiring post', 'Engagement: 1.3K views', 'Detected via Signal Radar v2'],
    relatedIds: ['intel-6', 'intel-5', 'intel-2'],
    sourcePostPreview:
      'We are opening internship slots for frontend engineers who can ship polished product surfaces quickly.',
  },
  {
    id: 'intel-2',
    role: 'Backend Intern',
    company: 'Moniepoint',
    location: 'Abuja, Nigeria · On-site',
    aiMatchScore: 86,
    postedAt: '18m ago',
    aiSummary:
      'Good fit for API-first candidates comfortable with scalable backend systems and production debugging.',
    skillTags: ['Node.js', 'PostgreSQL', 'APIs'],
    sourceHandle: '@moniepoint',
    sourceUrl: 'https://x.com/moniepoint/status/198002551100',
    relevanceReason:
      'Backend internship aligns with your systems track and interest in fintech reliability and platform engineering.',
    skillAlignment:
      'Strong overlap on Node APIs and data persistence patterns with practical debugging and service ownership requirements.',
    extractionConfidence: 'High',
    roleType: 'Backend Engineering Intern',
    roleMode: 'On-site',
    applicationStatus: 'Open',
    sourceConfidence: 'High',
    originalSourceText:
      'Moniepoint is hiring backend interns to work on transaction APIs, database performance, and internal tooling for engineering teams.',
    sourceMetadata: ['X/Twitter', 'Hiring thread', 'Engagement: 980 views', 'Matched from fintech cluster'],
    relatedIds: ['intel-5', 'intel-1', 'intel-4'],
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
    sourceHandle: '@huggingface',
    sourceUrl: 'https://x.com/huggingface/status/198003772340',
    relevanceReason:
      'Directly relevant to your AI exploration goals with hands-on model evaluation and open collaboration workflows.',
    skillAlignment:
      'Clear fit for Python, experimentation, and AI tooling foundations with emphasis on reproducible model pipelines.',
    extractionConfidence: 'High',
    roleType: 'AI Engineering Intern',
    roleMode: 'Remote',
    applicationStatus: 'Closing soon',
    sourceConfidence: 'High',
    originalSourceText:
      'We are looking for AI engineering interns to prototype model workflows, evaluate LLM quality, and contribute to open-source tooling.',
    sourceMetadata: ['X/Twitter', 'Career update', 'Engagement: 2.1K views', 'AI domain cluster match'],
    relatedIds: ['intel-4', 'intel-6', 'intel-1'],
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
    sourceHandle: '@andela',
    sourceUrl: 'https://x.com/andela/status/198004002200',
    relevanceReason:
      'Strong data-fit role aligned with experimentation and analytics storytelling, useful for broad product-facing exposure.',
    skillAlignment:
      'SQL and Python requirements map to your analytics stack and your project work on experimentation workflows.',
    extractionConfidence: 'Medium',
    roleType: 'Data Science Intern',
    roleMode: 'Remote',
    applicationStatus: 'Unknown',
    sourceConfidence: 'Medium',
    originalSourceText:
      'Andela has a data science internship opening focused on forecasting, analytics pipelines, and experiment insight reporting.',
    sourceMetadata: ['X/Twitter', 'Opportunity mention', 'Engagement: 640 views', 'Cross-validated with company careers page'],
    relatedIds: ['intel-3', 'intel-2', 'intel-5'],
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
    sourceHandle: '@flutterwave',
    sourceUrl: 'https://x.com/flutterwave/status/198004771900',
    relevanceReason:
      'Relevant if you want balanced frontend/backend scope with fintech product context and real delivery timelines.',
    skillAlignment:
      'Role overlaps with React foundations and system-level thinking, while requiring stronger backend execution depth.',
    extractionConfidence: 'Medium',
    roleType: 'Software Engineering Intern',
    roleMode: 'Hybrid',
    applicationStatus: 'Open',
    sourceConfidence: 'Medium',
    originalSourceText:
      'Flutterwave internship applications are open for software engineering interns interested in fintech infrastructure and developer productivity projects.',
    sourceMetadata: ['X/Twitter', 'Company update', 'Engagement: 1.0K views', 'Regional hiring signal'],
    relatedIds: ['intel-1', 'intel-2', 'intel-6'],
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
    sourceHandle: '@vercel',
    sourceUrl: 'https://x.com/vercel/status/198005100811',
    relevanceReason:
      'Highly relevant to your frontend performance interests and modern React ecosystem depth goals.',
    skillAlignment:
      'Excellent overlap on React architecture, Next.js workflows, and web performance optimization expectations.',
    extractionConfidence: 'High',
    roleType: 'Frontend Intern',
    roleMode: 'Remote',
    applicationStatus: 'Open',
    sourceConfidence: 'High',
    originalSourceText:
      'Vercel is seeking frontend interns excited by web performance, polished product experiences, and developer tooling collaboration.',
    sourceMetadata: ['X/Twitter', 'Hiring post', 'Engagement: 2.8K views', 'High-confidence frontend signal'],
    relatedIds: ['intel-1', 'intel-3', 'intel-5'],
    sourcePostPreview:
      'Seeking frontend interns excited by web performance, product polish, and collaborative experimentation.',
  },
];

export const getIntelligenceSignalById = (id: string) => intelligenceSignals.find((signal) => signal.id === id);

export const getRelatedIntelligenceSignals = (id: string) => {
  const source = getIntelligenceSignalById(id);
  if (!source) {
    return [];
  }
  return source.relatedIds.map((relatedId) => getIntelligenceSignalById(relatedId)).filter(Boolean) as IntelligenceSignal[];
};

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
