'use client';

/**
 * Flagged Item Component
 *
 * Displays a single flagged confession for review.
 * Privacy-first: Shows ONLY scrubbed text, flag reason, and timestamp.
 * NO user identifiers, NO IP addresses.
 */

import { useState } from 'react';
import {
  type FlaggedConfession,
  type ModerationAction,
  FLAG_REASON_LABELS,
  FLAG_REASON_COLORS,
} from '../store/moderationStore';

interface FlaggedItemProps {
  item: FlaggedConfession;
  onAction: (queueId: string, action: ModerationAction, note?: string) => void;
  isProcessing?: boolean;
}

export function FlaggedItem({ item, onAction, isProcessing }: FlaggedItemProps) {
  const [showActions, setShowActions] = useState(false);
  const [note, setNote] = useState('');

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleAction = (action: ModerationAction) => {
    onAction(item.queueId, action, note || undefined);
    setNote('');
    setShowActions(false);
  };

  const confidencePercent = Math.round(item.flagScore * 100);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Flag reason badge */}
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-medium ${FLAG_REASON_COLORS[item.flagReason]}`}
          >
            {FLAG_REASON_LABELS[item.flagReason]}
          </span>

          {/* Confidence score */}
          <div className="flex items-center gap-1.5">
            <div className="w-16 bg-gray-200 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full ${
                  item.flagScore >= 0.8
                    ? 'bg-red-500'
                    : item.flagScore >= 0.5
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${confidencePercent}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{confidencePercent}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span title="Time flagged">
            Flagged {formatTimestamp(item.flaggedAt)}
          </span>
          <span className="text-gray-300">•</span>
          <span title="Original confession time">
            Posted {formatTimestamp(item.confessionTimestamp)}
          </span>
        </div>
      </div>

      {/* Content - ONLY scrubbed text */}
      <div className="p-4">
        <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">
          {item.scrubbedText}
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clipRule="evenodd"
            />
          </svg>
          Privacy protected: No user identifiers or IP addresses shown
        </p>
      </div>

      {/* Actions */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        {showActions ? (
          <div className="space-y-3">
            {/* Optional note */}
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Moderation note (optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for audit log..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-void-500"
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Approve
              </button>
              <button
                onClick={() => handleAction('block')}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Block
              </button>
              <button
                onClick={() => handleAction('escalate')}
                disabled={isProcessing}
                className="flex-1 py-2 px-4 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Escalate
              </button>
              <button
                onClick={() => setShowActions(false)}
                disabled={isProcessing}
                className="py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowActions(true)}
            className="w-full py-2 px-4 bg-void-600 hover:bg-void-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            Review & Take Action
          </button>
        )}
      </div>
    </div>
  );
}
