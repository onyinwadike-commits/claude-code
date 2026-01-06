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
