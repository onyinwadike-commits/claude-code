'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FeedbackCardProps, FeedbackStatus } from '@/lib/feedback/types';
import { categoryConfig, statusConfig, priorityConfig } from '@/lib/feedback/types';
import { RatingStars } from './RatingStars';

const typeIcons: Record<string, string> = {
  praise: '👍',
  suggestion: '💡',
  complaint: '😕',
  bug: '🐛',
  feature: '✨',
};

const sentimentColors: Record<string, string> = {
  positive: 'text-[#10B981]',
  neutral: 'text-[#0071CE]',
  negative: 'text-[#EF4444]',
};

export const FeedbackCard: React.FC<FeedbackCardProps> = ({
  feedback,
  onVote,
  onStatusChange,
  showAdminActions = false,
  compact = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const catConfig = categoryConfig[feedback.category];
  const statConfig = statusConfig[feedback.status];
  const prioConfig = priorityConfig[feedback.priority];

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    return `${weeks}w ago`;
  };

  const handleVote = () => {
    onVote?.(feedback.id);
  };

  const handleStatusChange = async (newStatus: FeedbackStatus) => {
    setIsUpdating(true);
    try {
      await onStatusChange?.(feedback.id, newStatus);
    } finally {
      setIsUpdating(false);
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 hover:border-white/20 transition-all cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          <span className="text-lg">{typeIcons[feedback.type]}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white line-clamp-1">{feedback.title}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-white/40">{catConfig.label}</span>
              <span className="text-xs text-white/20">•</span>
              <span className="text-xs text-white/40">{timeAgo(feedback.createdAt)}</span>
            </div>
          </div>
          <div
            className="px-2 py-1 rounded-lg text-xs font-medium"
            style={{ backgroundColor: statConfig.bgColor, color: statConfig.color }}
          >
            {statConfig.label}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div
        className="p-5 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-4">
          {/* Type Icon & Category */}
          <div className="flex-shrink-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ backgroundColor: catConfig.color + '20' }}
            >
              {typeIcons[feedback.type]}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ backgroundColor: catConfig.color + '20', color: catConfig.color }}
              >
                {catConfig.label}
              </span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/40">{timeAgo(feedback.createdAt)}</span>
              {feedback.sentiment && (
                <>
                  <span className="text-xs text-white/30">•</span>
                  <span className={`text-xs capitalize ${sentimentColors[feedback.sentiment]}`}>
                    {feedback.sentiment}
                  </span>
                </>
              )}
            </div>

            <h4 className="text-base font-semibold text-white mb-2">{feedback.title}</h4>

            <p className={`text-sm text-white/70 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {feedback.message}
            </p>

            {/* Rating if present */}
            {feedback.rating && (
              <div className="mt-3">
                <RatingStars value={feedback.rating} readonly size="sm" />
              </div>
            )}
          </div>

          {/* Status & Actions */}
          <div className="flex flex-col items-end gap-2">
            <div
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ backgroundColor: statConfig.bgColor, color: statConfig.color }}
            >
              {statConfig.label}
            </div>
            <div
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: prioConfig.bgColor, color: prioConfig.color }}
            >
              {prioConfig.label}
            </div>

            {/* Vote Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                handleVote();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-[#FFC220]/30 hover:bg-[#FFC220]/10 transition-all"
            >
              <svg className="w-4 h-4 text-[#FFC220]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 15l7-7 7 7"
                />
              </svg>
              <span className="text-xs font-medium text-white">{feedback.votes}</span>
            </motion.button>

            {/* Expand indicator */}
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              className="text-white/30 mt-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
              {/* User Info */}
              {feedback.userName && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0071CE] to-[#005BA1] flex items-center justify-center text-xs font-bold text-white">
                    {feedback.userName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{feedback.userName}</p>
                    {feedback.storeName && (
                      <p className="text-xs text-white/40">{feedback.storeName}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Tags */}
              {feedback.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {feedback.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/50"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Admin Response */}
              {feedback.adminResponse && (
                <div className="p-4 rounded-xl bg-[#0071CE]/10 border border-[#0071CE]/20">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-4 h-4 text-[#0071CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="text-xs font-medium text-[#0071CE]">Official Response</span>
                    {feedback.adminRespondedAt && (
                      <span className="text-xs text-white/40">
                        • {timeAgo(feedback.adminRespondedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/70">{feedback.adminResponse}</p>
                </div>
              )}

              {/* Admin Actions */}
              {showAdminActions && (
                <div className="pt-4 border-t border-white/5">
                  <p className="text-xs text-white/40 mb-3">Change Status</p>
                  <div className="flex flex-wrap gap-2">
                    {(['new', 'reviewed', 'in_progress', 'resolved', 'wont_fix'] as FeedbackStatus[]).map(
                      (status) => {
                        const config = statusConfig[status];
                        const isActive = feedback.status === status;

                        return (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            disabled={isUpdating || isActive}
                            className={`
                              px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                              ${isActive
                                ? 'ring-2 ring-offset-2 ring-offset-background'
                                : 'hover:opacity-80'
                              }
                              ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                            style={{
                              backgroundColor: config.bgColor,
                              color: config.color,
                              ringColor: isActive ? config.color : undefined,
                            }}
                          >
                            {config.label}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FeedbackCard;
