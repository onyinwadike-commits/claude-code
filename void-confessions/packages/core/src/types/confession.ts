import type { VoidType, ReleaseStyle, Echo } from './void';

/**
 * Status of a confession in the moderation pipeline
 */
export type ConfessionStatus = 'pending' | 'approved' | 'rejected' | 'redacted' | 'expired';

/**
 * Sentiment analysis result from the sentiment service
 */
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

/**
 * A confession released into the void
 */
export interface Confession {
  /** Unique identifier */
  id: string;
  /** The confession content text */
  content: string;
  /** Content after PII redaction (if applicable) */
  redactedContent?: string;
  /** The emotional void type this confession belongs to */
  voidType: VoidType;
  /** Visual style used when releasing the confession */
  releaseStyle: ReleaseStyle;
  /** When the confession was created/released */
  createdAt: Date;
  /** When the confession expires and fades from the void */
  expiresAt: Date;
  /** Number of times others have resonated with this confession */
  resonanceCount: number;
  /** Echo responses from other users */
  echoes: Echo[];
  /** Moderation status */
  status: ConfessionStatus;
  /** Sentiment analysis result */
  sentiment?: SentimentType;
  /** Sentiment score (-1 to 1) */
  sentimentScore?: number;
  /** When the confession was last updated */
  updatedAt: Date;
  /** When approved by moderator */
  approvedAt?: Date;
  /** When rejected by moderator */
  rejectedAt?: Date;
  /** ID of moderator who reviewed */
  moderatorId?: string;
  /** Notes from moderation */
  moderationNotes?: string;
  /** Number of times viewed */
  viewCount: number;
  /** Number of reports received */
  reportCount: number;
  /** User-assigned tags */
  tags: string[];
  /** Whether the confession has been "released" with animation */
  isReleased: boolean;
  /** Anonymous session identifier (not user-identifiable) */
  sessionHash?: string;
}

/**
 * Input for creating a new confession
 */
export interface CreateConfessionInput {
  /** The confession text content */
  content: string;
  /** The emotional void type */
  voidType: VoidType;
  /** Preferred release animation style */
  releaseStyle?: ReleaseStyle;
  /** Optional tags */
  tags?: string[];
  /** Time in hours until expiration (default: 24) */
  expiresInHours?: number;
}

/**
 * Input for adding an echo to a confession
 */
export interface AddEchoInput {
  confessionId: string;
  word: Echo['word'];
}

/**
 * Filters for querying confessions
 */
export interface ConfessionFilters {
  /** Filter by moderation status */
  status?: ConfessionStatus;
  /** Filter by void type */
  voidType?: VoidType;
  /** Filter by sentiment */
  sentiment?: SentimentType;
  /** Filter by tags */
  tags?: string[];
  /** Filter confessions created after this date */
  fromDate?: Date;
  /** Filter confessions created before this date */
  toDate?: Date;
  /** Only include non-expired confessions */
  activeOnly?: boolean;
  /** Minimum resonance count */
  minResonance?: number;
}

/**
 * Summary statistics for confessions
 */
export interface ConfessionStats {
  /** Total confessions by void type */
  byVoidType: Record<VoidType, number>;
  /** Total echoes by word */
  echoDistribution: Record<Echo['word'], number>;
  /** Average resonance count */
  averageResonance: number;
  /** Most used release styles */
  popularReleaseStyles: ReleaseStyle[];
  /** Total active (non-expired) confessions */
  activeCount: number;
}
