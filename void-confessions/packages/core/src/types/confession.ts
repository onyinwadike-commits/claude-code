export type ConfessionStatus = 'pending' | 'approved' | 'rejected' | 'redacted';

export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed';

export interface Confession {
  id: string;
  content: string;
  redactedContent?: string;
  status: ConfessionStatus;
  sentiment?: SentimentType;
  sentimentScore?: number;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  rejectedAt?: Date;
  moderatorId?: string;
  moderationNotes?: string;
  viewCount: number;
  reportCount: number;
  tags: string[];
}

export interface CreateConfessionInput {
  content: string;
  tags?: string[];
}

export interface ConfessionFilters {
  status?: ConfessionStatus;
  sentiment?: SentimentType;
  tags?: string[];
  fromDate?: Date;
  toDate?: Date;
}
