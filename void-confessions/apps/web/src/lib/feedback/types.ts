// Phase 5: User Feedback System Types

export type FeedbackCategory =
  | 'report-quality'
  | 'ai-accuracy'
  | 'usability'
  | 'feature-request'
  | 'amazon-warfare'
  | 'visual-merch';

export type FeedbackType = 'bug' | 'feature' | 'complaint' | 'praise' | 'suggestion';

export type FeedbackStatus = 'new' | 'reviewed' | 'in_progress' | 'resolved' | 'wont_fix';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export type SentimentType = 'positive' | 'neutral' | 'negative';

export type SurveyType = 'nps' | 'csat' | 'ces';

export interface Feedback {
  id: string;
  userId?: string;
  userName?: string;
  storeId?: string;
  storeName?: string;
  type: FeedbackType;
  category: FeedbackCategory;
  title: string;
  message: string;
  rating?: number;
  sentiment?: SentimentType;
  status: FeedbackStatus;
  priority: FeedbackPriority;
  tags: string[];
  attachments?: FeedbackAttachment[];
  votes: number;
  votedBy: string[];
  adminResponse?: string;
  adminRespondedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface FeedbackAttachment {
  id: string;
  filename: string;
  url: string;
  type: 'image' | 'document' | 'screenshot';
  size: number;
}

export interface SentenceStarter {
  id: string;
  text: string;
  category: FeedbackCategory;
  type: FeedbackType;
  sentiment: SentimentType;
}

export interface SurveyResponse {
  id: string;
  userId?: string;
  storeId?: string;
  surveyType: SurveyType;
  score: number;
  comment?: string;
  category?: FeedbackCategory;
  createdAt: Date;
}

export interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  status: 'submitted' | 'under_review' | 'planned' | 'in_development' | 'released' | 'declined';
  votes: number;
  votedBy: string[];
  priority: FeedbackPriority;
  estimatedRelease?: string;
  submittedBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueReport {
  id: string;
  title: string;
  description: string;
  category: FeedbackCategory;
  severity: 'minor' | 'moderate' | 'major' | 'critical';
  status: 'open' | 'investigating' | 'confirmed' | 'fixing' | 'resolved' | 'closed';
  stepsToReproduce?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
  browserInfo?: string;
  screenshot?: string;
  reportedBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

export interface FeedbackAnalytics {
  totalFeedback: number;
  newFeedback: number;
  resolvedFeedback: number;
  averageRating: number;
  averageResolutionTime: number; // in hours
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  categoryBreakdown: Record<FeedbackCategory, number>;
  typeBreakdown: Record<FeedbackType, number>;
  trendData: {
    date: string;
    count: number;
    avgRating: number;
  }[];
  topIssues: {
    title: string;
    count: number;
    category: FeedbackCategory;
  }[];
  npsScore: number;
  csatScore: number;
}

// Component Props Types
export interface FeedbackFormProps {
  onSubmit?: (feedback: Partial<Feedback>) => void;
  onCancel?: () => void;
  initialCategory?: FeedbackCategory;
  storeId?: string;
  storeName?: string;
  compact?: boolean;
}

export interface SentenceStartersProps {
  category: FeedbackCategory;
  onSelect: (starter: SentenceStarter) => void;
  selectedId?: string;
}

export interface FeedbackCardProps {
  feedback: Feedback;
  onVote?: (feedbackId: string) => void;
  onStatusChange?: (feedbackId: string, status: FeedbackStatus) => void;
  showAdminActions?: boolean;
  compact?: boolean;
}

export interface FeedbackDashboardProps {
  initialCategory?: FeedbackCategory;
  showFilters?: boolean;
}

export interface RatingStarsProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export interface SurveyModalProps {
  type: SurveyType;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (response: SurveyResponse) => void;
  category?: FeedbackCategory;
}

export interface IssueReporterProps {
  onSubmit?: (issue: Partial<IssueReport>) => void;
  onCancel?: () => void;
  initialCategory?: FeedbackCategory;
}

export interface FeatureRequestCardProps {
  feature: FeatureRequest;
  onVote?: (featureId: string) => void;
  currentUserId?: string;
}

// Category configuration
export const categoryConfig: Record<
  FeedbackCategory,
  { label: string; icon: string; color: string; description: string }
> = {
  'report-quality': {
    label: 'Report Quality',
    icon: '📊',
    color: '#0071CE', // Walmart Blue
    description: 'Feedback on data accuracy and report clarity',
  },
  'ai-accuracy': {
    label: 'AI Accuracy',
    icon: '🤖',
    color: '#7C3AED', // Purple
    description: 'How accurate are the AI predictions and recommendations',
  },
  'usability': {
    label: 'Usability',
    icon: '🖱️',
    color: '#10B981', // Green
    description: 'User experience and interface feedback',
  },
  'feature-request': {
    label: 'Feature Request',
    icon: '💡',
    color: '#FFC220', // Walmart Spark Yellow
    description: 'Suggest new features or improvements',
  },
  'amazon-warfare': {
    label: 'Amazon Warfare',
    icon: '⚔️',
    color: '#EF4444', // Red
    description: 'Competitive intelligence and pricing feedback',
  },
  'visual-merch': {
    label: 'Visual Merchandising',
    icon: '🏪',
    color: '#F59E0B', // Amber
    description: 'Planogram and shelf management feedback',
  },
};

// Status configuration
export const statusConfig: Record<
  FeedbackStatus,
  { label: string; color: string; bgColor: string }
> = {
  new: { label: 'New', color: '#0071CE', bgColor: 'rgba(0, 113, 206, 0.2)' },
  reviewed: { label: 'Reviewed', color: '#7C3AED', bgColor: 'rgba(124, 58, 237, 0.2)' },
  in_progress: { label: 'In Progress', color: '#FFC220', bgColor: 'rgba(255, 194, 32, 0.2)' },
  resolved: { label: 'Resolved', color: '#10B981', bgColor: 'rgba(16, 185, 129, 0.2)' },
  wont_fix: { label: "Won't Fix", color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.2)' },
};

// Priority configuration
export const priorityConfig: Record<
  FeedbackPriority,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: 'Low', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.2)' },
  medium: { label: 'Medium', color: '#FFC220', bgColor: 'rgba(255, 194, 32, 0.2)' },
  high: { label: 'High', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.2)' },
  critical: { label: 'Critical', color: '#EF4444', bgColor: 'rgba(239, 68, 68, 0.2)' },
};
