'use client';

/**
 * Moderation Queue Component
 *
 * Displays the queue of flagged confessions awaiting review.
 * Privacy-first design: NO user identifiers, NO IP addresses.
 */

import { useEffect } from 'react';
import { useModerationStore, type ModerationAction } from '../store';
import { FlaggedItem } from './FlaggedItem';

export function ModerationQueue() {
  const queue = useModerationStore((state) => state.queue);
  const isLoading = useModerationStore((state) => state.isLoading);
  const error = useModerationStore((state) => state.error);
  const fetchQueue = useModerationStore((state) => state.fetchQueue);
  const submitAction = useModerationStore((state) => state.submitAction);

  useEffect(() => {
    fetchQueue();

    // Refresh queue every 30 seconds
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  const handleAction = async (
    queueId: string,
    action: ModerationAction,
    note?: string
  ) => {
    await submitAction(queueId, action, note);
  };

  if (isLoading && queue.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-void-600 mb-4" />
          <p className="text-gray-500">Loading moderation queue...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-lg border border-red-200 p-6">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-red-700 font-medium">Failed to load queue</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
        <button
          onClick={fetchQueue}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-12">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Queue is clear!
          </h3>
          <p className="text-gray-500 max-w-sm">
            No flagged confessions awaiting review. New items will appear here
            automatically.
          </p>
        </div>
      </div>
    );
  }

  // Sort queue: sensitive topics first, then by flag score, then by time
  const sortedQueue = [...queue].sort((a, b) => {
    // Sensitive topics always first
    if (a.flagReason === 'sensitive_topic' && b.flagReason !== 'sensitive_topic') return -1;
    if (b.flagReason === 'sensitive_topic' && a.flagReason !== 'sensitive_topic') return 1;

    // Then by flag score (higher = more urgent)
    if (a.flagScore !== b.flagScore) return b.flagScore - a.flagScore;

    // Then by time (older first)
    return a.flaggedAt - b.flaggedAt;
  });

  return (
    <div className="space-y-4">
      {/* Queue header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Flagged for Review
          </h2>
          <span className="px-2.5 py-0.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
            {queue.length}
          </span>
        </div>

        <button
          onClick={fetchQueue}
          disabled={isLoading}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>

      {/* Priority notice for sensitive content */}
      {sortedQueue.some((item) => item.flagReason === 'sensitive_topic') && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-purple-600 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <p className="text-purple-800 font-medium text-sm">
              Sensitive content in queue
            </p>
            <p className="text-purple-600 text-sm">
              Items flagged for sensitive topics are prioritized. Please review with care
              and take breaks as needed.
            </p>
          </div>
        </div>
      )}

      {/* Queue items */}
      <div className="space-y-4">
        {sortedQueue.map((item) => (
          <FlaggedItem
            key={item.queueId}
            item={item}
            onAction={handleAction}
            isProcessing={isLoading}
          />
        ))}
      </div>

      {/* Privacy footer */}
      <div className="text-center py-4">
        <p className="text-xs text-gray-400">
          🔒 All content shown is scrubbed of personally identifiable information.
          <br />
          User IPs and identifiers are never exposed to moderators.
        </p>
      </div>
    </div>
  );
}
