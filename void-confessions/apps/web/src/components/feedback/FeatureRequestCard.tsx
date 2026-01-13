'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { FeatureRequestCardProps, FeatureRequest } from '@/lib/feedback/types';
import { categoryConfig } from '@/lib/feedback/types';

const statusConfig: Record<
  FeatureRequest['status'],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  submitted: {
    label: 'Submitted',
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.2)',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
  },
  under_review: {
    label: 'Under Review',
    color: '#0071CE',
    bg: 'rgba(0, 113, 206, 0.2)',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
  },
  planned: {
    label: 'Planned',
    color: '#7C3AED',
    bg: 'rgba(124, 58, 237, 0.2)',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  in_development: {
    label: 'In Development',
    color: '#FFC220',
    bg: 'rgba(255, 194, 32, 0.2)',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    ),
  },
  released: {
    label: 'Released',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.2)',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  declined: {
    label: 'Declined',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
};

// Mock feature requests for demonstration
export const mockFeatureRequests: FeatureRequest[] = [
  {
    id: '1',
    title: 'Real-time Amazon Price Alerts',
    description: 'Push notifications when Amazon drops prices on battleground items. This would help us respond faster to competitive pricing moves.',
    category: 'amazon-warfare',
    status: 'planned',
    votes: 156,
    votedBy: [],
    priority: 'high',
    estimatedRelease: 'Q2 2026',
    submittedBy: 'Emily Davis',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'AI-Powered Shelf Image Analysis',
    description: 'Use phone camera to capture shelf images and automatically detect compliance issues, out-of-stocks, and planogram deviations.',
    category: 'visual-merch',
    status: 'in_development',
    votes: 234,
    votedBy: [],
    priority: 'critical',
    estimatedRelease: 'Q1 2026',
    submittedBy: 'James Wilson',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Custom Report Builder',
    description: 'Allow users to create their own reports with drag-and-drop widgets. Save templates and schedule automatic delivery.',
    category: 'report-quality',
    status: 'under_review',
    votes: 89,
    votedBy: [],
    priority: 'medium',
    submittedBy: 'Sarah Johnson',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    title: 'Dark Mode Toggle',
    description: 'Add ability to switch between dark and light themes based on user preference.',
    category: 'usability',
    status: 'released',
    votes: 312,
    votedBy: [],
    priority: 'low',
    submittedBy: 'Mike Chen',
    createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

export const FeatureRequestCard: React.FC<FeatureRequestCardProps> = ({
  feature,
  onVote,
  currentUserId,
}) => {
  const catConfig = categoryConfig[feature.category];
  const statConfig = statusConfig[feature.status];
  const hasVoted = currentUserId ? feature.votedBy.includes(currentUserId) : false;

  const timeAgo = (date: Date) => {
    const days = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="glass-card overflow-hidden"
    >
      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Vote Section */}
          <div className="flex flex-col items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onVote?.(feature.id)}
              className={`
                w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all
                ${hasVoted
                  ? 'bg-[#FFC220]/20 border border-[#FFC220]/30'
                  : 'bg-white/5 border border-white/10 hover:border-[#FFC220]/30 hover:bg-[#FFC220]/10'
                }
              `}
            >
              <svg
                className={`w-5 h-5 ${hasVoted ? 'text-[#FFC220]' : 'text-white/50'}`}
                fill={hasVoted ? 'currentColor' : 'none'}
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className={`text-sm font-bold ${hasVoted ? 'text-[#FFC220]' : 'text-white'}`}>
                {feature.votes}
              </span>
            </motion.button>
            <span className="text-[10px] text-white/40 mt-1">votes</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium"
                style={{ backgroundColor: catConfig.color + '20', color: catConfig.color }}
              >
                {catConfig.icon} {catConfig.label}
              </span>
              <span
                className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
                style={{ backgroundColor: statConfig.bg, color: statConfig.color }}
              >
                {statConfig.icon}
                {statConfig.label}
              </span>
            </div>

            {/* Title */}
            <h4 className="text-base font-semibold text-white mb-2">{feature.title}</h4>

            {/* Description */}
            <p className="text-sm text-white/60 line-clamp-2 mb-3">{feature.description}</p>

            {/* Footer */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-white/40">
                <span>by {feature.submittedBy}</span>
                <span>•</span>
                <span>{timeAgo(feature.createdAt)}</span>
              </div>

              {feature.estimatedRelease && (
                <span className="px-2 py-1 rounded-lg bg-white/5 text-xs text-white/60">
                  📅 {feature.estimatedRelease}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress bar for in_development status */}
      {feature.status === 'in_development' && (
        <div className="h-1 bg-[#FFC220]/20">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '65%' }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[#FFC220] to-[#F59E0B]"
          />
        </div>
      )}
    </motion.div>
  );
};

export default FeatureRequestCard;
