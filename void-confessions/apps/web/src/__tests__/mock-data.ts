// Mock data for testing
import type {
  Feedback,
  FeedbackCategory,
  FeatureRequest,
  IssueReport,
  SurveyResponse,
  SentenceStarter,
  FeedbackAnalytics,
} from '@/lib/feedback/types';

// Mock Feedback Items
export const mockFeedback: Feedback[] = [
  {
    id: 'feedback-1',
    userId: 'user-1',
    userName: 'Test User 1',
    storeId: 'store-001',
    storeName: 'Market 396 - Store #4158',
    type: 'suggestion',
    category: 'ai-accuracy',
    title: 'AI recommendations are helpful',
    message: 'The AI-powered recommendations have improved our inventory management significantly.',
    rating: 5,
    sentiment: 'positive',
    status: 'reviewed',
    priority: 'medium',
    tags: ['ai', 'inventory'],
    votes: 15,
    votedBy: ['user-2', 'user-3'],
    createdAt: new Date('2024-01-15T10:00:00Z'),
    updatedAt: new Date('2024-01-16T14:30:00Z'),
  },
  {
    id: 'feedback-2',
    userName: 'Test User 2',
    type: 'bug',
    category: 'visual-merch',
    title: 'Planogram not loading',
    message: 'The planogram viewer shows a blank screen when I try to view aisle 7.',
    sentiment: 'negative',
    status: 'in_progress',
    priority: 'high',
    tags: ['bug', 'planogram'],
    votes: 8,
    votedBy: [],
    adminResponse: 'We are investigating this issue.',
    adminRespondedAt: new Date('2024-01-17T09:00:00Z'),
    createdAt: new Date('2024-01-16T08:00:00Z'),
    updatedAt: new Date('2024-01-17T09:00:00Z'),
  },
  {
    id: 'feedback-3',
    userName: 'Test User 3',
    type: 'feature',
    category: 'amazon-warfare',
    title: 'Real-time price alerts',
    message: 'We need push notifications when Amazon changes prices on competitive items.',
    sentiment: 'neutral',
    status: 'new',
    priority: 'critical',
    tags: ['feature', 'pricing'],
    votes: 42,
    votedBy: [],
    createdAt: new Date('2024-01-14T15:00:00Z'),
    updatedAt: new Date('2024-01-14T15:00:00Z'),
  },
];

// Mock Feature Requests
export const mockFeatureRequests: FeatureRequest[] = [
  {
    id: 'feature-1',
    title: 'AI-Powered Shelf Analysis',
    description: 'Use computer vision to analyze shelf photos and detect compliance issues.',
    category: 'visual-merch',
    status: 'in_development',
    votes: 234,
    votedBy: ['user-1', 'user-2'],
    priority: 'critical',
    estimatedRelease: 'Q1 2026',
    submittedBy: 'Test User',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-15T00:00:00Z'),
  },
  {
    id: 'feature-2',
    title: 'Custom Dashboard Widgets',
    description: 'Allow users to create custom dashboard layouts with draggable widgets.',
    category: 'usability',
    status: 'planned',
    votes: 156,
    votedBy: [],
    priority: 'high',
    estimatedRelease: 'Q2 2026',
    submittedBy: 'Another User',
    createdAt: new Date('2024-01-05T00:00:00Z'),
    updatedAt: new Date('2024-01-10T00:00:00Z'),
  },
];

// Mock Issue Reports
export const mockIssueReports: IssueReport[] = [
  {
    id: 'issue-1',
    title: 'Dashboard loading slowly',
    description: 'The main dashboard takes over 10 seconds to load.',
    category: 'usability',
    severity: 'major',
    status: 'investigating',
    stepsToReproduce: ['Open browser', 'Navigate to dashboard', 'Wait for load'],
    expectedBehavior: 'Dashboard should load in under 3 seconds',
    actualBehavior: 'Dashboard takes 10+ seconds to load',
    browserInfo: 'Chrome 120.0.0.0',
    reportedBy: 'Test User',
    createdAt: new Date('2024-01-16T00:00:00Z'),
    updatedAt: new Date('2024-01-17T00:00:00Z'),
  },
];

// Mock Survey Responses
export const mockSurveyResponses: SurveyResponse[] = [
  {
    id: 'survey-1',
    userId: 'user-1',
    surveyType: 'nps',
    score: 9,
    comment: 'Great platform!',
    createdAt: new Date('2024-01-15T00:00:00Z'),
  },
  {
    id: 'survey-2',
    userId: 'user-2',
    surveyType: 'csat',
    score: 4,
    createdAt: new Date('2024-01-16T00:00:00Z'),
  },
];

// Mock Sentence Starters
export const mockSentenceStarters: SentenceStarter[] = [
  {
    id: 'starter-1',
    text: 'The AI recommendation helped me...',
    category: 'ai-accuracy',
    type: 'praise',
    sentiment: 'positive',
  },
  {
    id: 'starter-2',
    text: 'I found an issue with...',
    category: 'usability',
    type: 'bug',
    sentiment: 'negative',
  },
  {
    id: 'starter-3',
    text: 'It would be great if...',
    category: 'feature-request',
    type: 'feature',
    sentiment: 'neutral',
  },
];

// Mock Analytics
export const mockAnalytics: FeedbackAnalytics = {
  totalFeedback: 150,
  newFeedback: 12,
  resolvedFeedback: 98,
  averageRating: 4.2,
  averageResolutionTime: 18.5,
  sentimentBreakdown: {
    positive: 78,
    neutral: 45,
    negative: 27,
  },
  categoryBreakdown: {
    'report-quality': 25,
    'ai-accuracy': 35,
    'usability': 40,
    'feature-request': 20,
    'amazon-warfare': 15,
    'visual-merch': 15,
  },
  typeBreakdown: {
    praise: 30,
    suggestion: 45,
    complaint: 25,
    bug: 20,
    feature: 30,
  },
  trendData: [
    { date: '2024-01-10', count: 12, avgRating: 4.1 },
    { date: '2024-01-11', count: 15, avgRating: 4.3 },
    { date: '2024-01-12', count: 8, avgRating: 3.9 },
    { date: '2024-01-13', count: 20, avgRating: 4.5 },
    { date: '2024-01-14', count: 18, avgRating: 4.2 },
  ],
  topIssues: [
    { title: 'Dashboard loading', count: 15, category: 'usability' },
    { title: 'AI accuracy', count: 12, category: 'ai-accuracy' },
    { title: 'Price tracking', count: 8, category: 'amazon-warfare' },
  ],
  npsScore: 42,
  csatScore: 4.2,
};

// Helper functions
export const createMockFeedback = (overrides: Partial<Feedback> = {}): Feedback => ({
  id: `feedback-${Date.now()}`,
  userName: 'Mock User',
  type: 'suggestion',
  category: 'usability',
  title: 'Mock Feedback Title',
  message: 'This is a mock feedback message for testing purposes.',
  sentiment: 'neutral',
  status: 'new',
  priority: 'medium',
  tags: [],
  votes: 0,
  votedBy: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockFeatureRequest = (overrides: Partial<FeatureRequest> = {}): FeatureRequest => ({
  id: `feature-${Date.now()}`,
  title: 'Mock Feature Request',
  description: 'This is a mock feature request for testing.',
  category: 'usability',
  status: 'submitted',
  votes: 0,
  votedBy: [],
  priority: 'medium',
  submittedBy: 'Mock User',
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const allCategories: FeedbackCategory[] = [
  'report-quality',
  'ai-accuracy',
  'usability',
  'feature-request',
  'amazon-warfare',
  'visual-merch',
];
