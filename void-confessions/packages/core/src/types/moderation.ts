import type { Confession } from './confession';
import type { User } from './user';

export type ModerationAction = 'approve' | 'reject' | 'flag' | 'redact';

export interface ModerationLog {
  id: string;
  confessionId: string;
  moderatorId: string;
  action: ModerationAction;
  reason?: string;
  createdAt: Date;
}

export interface ModerationQueueItem {
  confession: Confession;
  priority: number;
  assignedTo?: User;
  assignedAt?: Date;
}

export interface ModerationStats {
  pending: number;
  approvedToday: number;
  rejectedToday: number;
  averageResponseTime: number;
}

/**
 * Automated moderation flag reasons
 */
export type AutoModerationFlag =
  | 'hate_speech'
  | 'threat'
  | 'doxxing'
  | 'pii_detected'
  | 'spam'
  | 'multiple_violations';

/**
 * Result of automated moderation
 */
export interface AutoModerationResult {
  /** Whether content passed automated checks */
  passed: boolean;
  /** Auto-generated flags */
  flags: AutoModerationFlag[];
  /** Confidence scores by category */
  scores: {
    hateSpeech: number;
    threat: number;
    doxxing: number;
  };
  /** Scrubbed text (PII removed) */
  scrubbedText: string;
  /** Whether human review is required */
  needsHumanReview: boolean;
  /** Whether to auto-block */
  autoBlock: boolean;
  /** Processing timestamp */
  processedAt: Date;
}

/**
 * Aggregated automated moderation stats
 */
export interface AutoModerationStats {
  /** Total confessions processed */
  totalProcessed: number;
  /** Auto-approved count */
  autoApproved: number;
  /** Auto-blocked count */
  autoBlocked: number;
  /** Flagged for review count */
  flaggedForReview: number;
  /** Breakdown by flag type */
  flagBreakdown: Record<AutoModerationFlag, number>;
  /** Average processing time (ms) */
  avgProcessingTime: number;
  /** Time period */
  periodStart: Date;
  periodEnd: Date;
}
