/**
 * Moderation Store
 *
 * Manages the flagged confession queue.
 * Privacy-first: NO user identifiers, NO IP addresses.
 * Only stores scrubbed text, flag reason, and timestamp.
 */

import { create } from 'zustand';

export type FlagReason =
  | 'auto_flagged'      // ML/keyword detection
  | 'user_reported'     // Community reports (anonymous)
  | 'high_toxicity'     // Toxicity score threshold
  | 'sensitive_topic'   // Mental health, self-harm keywords
  | 'spam_detected'     // Spam pattern detection
  | 'explicit_content'; // Adult content detection

export type ModerationAction = 'approve' | 'block' | 'escalate';

export interface FlaggedConfession {
  // Minimal identifier - NOT linked to user
  queueId: string;

  // Scrubbed content only - PII removed
  scrubbedText: string;

  // Flag information
  flagReason: FlagReason;
  flagScore: number; // 0-1 confidence score

  // Timestamps only - no user data
  flaggedAt: number;
  confessionTimestamp: number;

  // Moderation state
  assignedTo: string | null;
  reviewStartedAt: number | null;
}

interface ModerationState {
  queue: FlaggedConfession[];
  currentItem: FlaggedConfession | null;
  isLoading: boolean;
  error: string | null;

  // Stats (no user data)
  stats: {
    pendingCount: number;
    approvedToday: number;
    blockedToday: number;
    avgReviewTime: number;
  };

  // Actions
  fetchQueue: () => Promise<void>;
  claimItem: (queueId: string) => void;
  releaseItem: () => void;
  submitAction: (queueId: string, action: ModerationAction, note?: string) => Promise<void>;
  refreshStats: () => void;
}

// Mock flagged confessions for development
const MOCK_FLAGGED: FlaggedConfession[] = [
  {
    queueId: 'flag_001',
    scrubbedText: 'I feel like nobody understands what I\'m going through. Every day is a struggle.',
    flagReason: 'sensitive_topic',
    flagScore: 0.72,
    flaggedAt: Date.now() - 1000 * 60 * 15,
    confessionTimestamp: Date.now() - 1000 * 60 * 20,
    assignedTo: null,
    reviewStartedAt: null,
  },
  {
    queueId: 'flag_002',
    scrubbedText: '[Content flagged for review] - Potentially harmful language detected.',
    flagReason: 'high_toxicity',
    flagScore: 0.85,
    flaggedAt: Date.now() - 1000 * 60 * 30,
    confessionTimestamp: Date.now() - 1000 * 60 * 35,
    assignedTo: null,
    reviewStartedAt: null,
  },
  {
    queueId: 'flag_003',
    scrubbedText: 'I secretly took credit for my coworker\'s idea and got promoted. They still don\'t know.',
    flagReason: 'user_reported',
    flagScore: 0.45,
    flaggedAt: Date.now() - 1000 * 60 * 45,
    confessionTimestamp: Date.now() - 1000 * 60 * 60,
    assignedTo: null,
    reviewStartedAt: null,
  },
  {
    queueId: 'flag_004',
    scrubbedText: 'Check out my profile for exclusive content! Link in bio! 💰💰💰',
    flagReason: 'spam_detected',
    flagScore: 0.95,
    flaggedAt: Date.now() - 1000 * 60 * 5,
    confessionTimestamp: Date.now() - 1000 * 60 * 8,
    assignedTo: null,
    reviewStartedAt: null,
  },
  {
    queueId: 'flag_005',
    scrubbedText: 'I\'ve been having really dark thoughts lately. Not sure how much longer I can handle this.',
    flagReason: 'sensitive_topic',
    flagScore: 0.91,
    flaggedAt: Date.now() - 1000 * 60 * 2,
    confessionTimestamp: Date.now() - 1000 * 60 * 5,
    assignedTo: null,
    reviewStartedAt: null,
  },
];

export const useModerationStore = create<ModerationState>((set, get) => ({
  queue: [],
  currentItem: null,
  isLoading: false,
  error: null,
  stats: {
    pendingCount: 0,
    approvedToday: 0,
    blockedToday: 0,
    avgReviewTime: 0,
  },

  fetchQueue: async () => {
    set({ isLoading: true, error: null });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));

      // In production, this would fetch from a secure admin API
      // that returns only scrubbed content with no user identifiers
      set({
        queue: MOCK_FLAGGED,
        isLoading: false,
        stats: {
          pendingCount: MOCK_FLAGGED.length,
          approvedToday: 23,
          blockedToday: 7,
          avgReviewTime: 45, // seconds
        },
      });
    } catch {
      set({
        isLoading: false,
        error: 'Failed to fetch moderation queue',
      });
    }
  },

  claimItem: (queueId: string) => {
    const { queue } = get();
    const item = queue.find((i) => i.queueId === queueId);

    if (item) {
      set({
        currentItem: {
          ...item,
          reviewStartedAt: Date.now(),
        },
      });
    }
  },

  releaseItem: () => {
    set({ currentItem: null });
  },

  submitAction: async (queueId: string, action: ModerationAction, note?: string) => {
    set({ isLoading: true });

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300));

      // In production, this would:
      // 1. Log the action with moderator ID and timestamp
      // 2. Update confession status
      // 3. NOT log any user data or IPs

      console.log(`Moderation action: ${action} for ${queueId}`, note ? `Note: ${note}` : '');

      // Remove from queue
      const { queue, stats } = get();
      const newQueue = queue.filter((i) => i.queueId !== queueId);

      set({
        queue: newQueue,
        currentItem: null,
        isLoading: false,
        stats: {
          ...stats,
          pendingCount: newQueue.length,
          approvedToday: action === 'approve' ? stats.approvedToday + 1 : stats.approvedToday,
          blockedToday: action === 'block' ? stats.blockedToday + 1 : stats.blockedToday,
        },
      });
    } catch {
      set({
        isLoading: false,
        error: 'Failed to submit moderation action',
      });
    }
  },

  refreshStats: () => {
    const { queue } = get();
    set((state) => ({
      stats: {
        ...state.stats,
        pendingCount: queue.length,
      },
    }));
  },
}));

// Selectors
export const selectPendingCount = (state: ModerationState) => state.stats.pendingCount;
export const selectCurrentItem = (state: ModerationState) => state.currentItem;

// Helper: Get flag reason display text
export const FLAG_REASON_LABELS: Record<FlagReason, string> = {
  auto_flagged: 'Auto-Flagged',
  user_reported: 'User Reported',
  high_toxicity: 'High Toxicity',
  sensitive_topic: 'Sensitive Topic',
  spam_detected: 'Spam Detected',
  explicit_content: 'Explicit Content',
};

// Helper: Get flag reason severity color
export const FLAG_REASON_COLORS: Record<FlagReason, string> = {
  auto_flagged: 'bg-gray-100 text-gray-700',
  user_reported: 'bg-yellow-100 text-yellow-700',
  high_toxicity: 'bg-red-100 text-red-700',
  sensitive_topic: 'bg-purple-100 text-purple-700',
  spam_detected: 'bg-orange-100 text-orange-700',
  explicit_content: 'bg-red-100 text-red-700',
};
