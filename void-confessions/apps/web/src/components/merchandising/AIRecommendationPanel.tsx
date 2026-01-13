'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { AIRecommendationPanelProps, AIRecommendation, AIRecommendationType } from '@/types/merchandising';

const recommendationTypeConfig: Record<
  AIRecommendationType,
  { label: string; icon: React.ReactNode; color: string; bg: string }
> = {
  restock: {
    label: 'Restock',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    color: 'text-relief-400',
    bg: 'bg-relief-500/20',
  },
  markdown: {
    label: 'Markdown',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    color: 'text-longing-400',
    bg: 'bg-longing-500/20',
  },
  reposition: {
    label: 'Reposition',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    color: 'text-primary-400',
    bg: 'bg-primary-500/20',
  },
  bundle: {
    label: 'Bundle',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
      </svg>
    ),
    color: 'text-guilt-400',
    bg: 'bg-guilt-500/20',
  },
  promote: {
    label: 'Promote',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
    color: 'text-void-400',
    bg: 'bg-void-500/20',
  },
  discontinue: {
    label: 'Discontinue',
    icon: (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    color: 'text-rage-400',
    bg: 'bg-rage-500/20',
  },
};

const priorityConfig: Record<string, { color: string; pulse: boolean }> = {
  low: { color: 'bg-white/20', pulse: false },
  medium: { color: 'bg-longing-500', pulse: false },
  high: { color: 'bg-rage-500', pulse: false },
  critical: { color: 'bg-rage-500', pulse: true },
};

interface RecommendationCardProps {
  recommendation: AIRecommendation;
  onAction?: (recommendation: AIRecommendation) => void;
  onDismiss?: (recommendationId: string) => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  onAction,
  onDismiss,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const typeConfig = recommendationTypeConfig[recommendation.type];
  const priority = priorityConfig[recommendation.priority];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="glass-card overflow-hidden"
    >
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {/* Priority indicator */}
          <div className="relative mt-1">
            <div
              className={`w-2 h-2 rounded-full ${priority.color} ${
                priority.pulse ? 'animate-pulse' : ''
              }`}
            />
          </div>

          {/* Type icon */}
          <div className={`flex-shrink-0 p-2 rounded-lg ${typeConfig.bg}`}>
            <span className={typeConfig.color}>{typeConfig.icon}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium ${typeConfig.color}`}>
                {typeConfig.label}
              </span>
              <span className="text-xs text-white/30">•</span>
              <span className="text-xs text-white/40">{timeAgo(recommendation.createdAt)}</span>
            </div>
            <p className="text-sm text-white font-medium line-clamp-2">
              {recommendation.message}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-relief-400">
                +{formatCurrency(recommendation.estimatedRevenue)} potential
              </span>
              <span className="text-xs text-white/40">
                {recommendation.confidence}% confidence
              </span>
            </div>
          </div>

          {/* Expand indicator */}
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            className="flex-shrink-0 text-white/30"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-2 border-t border-white/5">
              {/* Product info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-100 mb-4">
                <img
                  src={recommendation.product.imageUrl}
                  alt={recommendation.product.name}
                  className="w-12 h-12 rounded-lg object-cover bg-surface-200"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {recommendation.product.name}
                  </p>
                  <p className="text-xs text-white/40">SKU: {recommendation.product.sku}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary-400">
                    ${recommendation.product.price.toFixed(2)}
                  </p>
                  <p className="text-xs text-white/40">
                    {recommendation.product.stockQuantity} in stock
                  </p>
                </div>
              </div>

              {/* Impact description */}
              <div className="mb-4">
                <p className="text-xs text-white/40 mb-1">Impact</p>
                <p className="text-sm text-white/70">{recommendation.impact}</p>
              </div>

              {/* Confidence meter */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white/40">AI Confidence</span>
                  <span className="text-white">{recommendation.confidence}%</span>
                </div>
                <div className="h-1.5 bg-surface-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${recommendation.confidence}%` }}
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAction?.(recommendation);
                  }}
                  className="btn-primary flex-1 text-sm py-2"
                >
                  Take Action
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss?.(recommendation.id);
                  }}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const AIRecommendationPanel: React.FC<AIRecommendationPanelProps> = ({
  recommendations,
  onAction,
  onDismiss,
  maxItems = 5,
}) => {
  const [filter, setFilter] = useState<AIRecommendationType | 'all'>('all');

  const filteredRecommendations = recommendations
    .filter((r) => filter === 'all' || r.type === filter)
    .slice(0, maxItems);

  const totalPotentialRevenue = recommendations.reduce(
    (sum, r) => sum + r.estimatedRevenue,
    0
  );

  const criticalCount = recommendations.filter((r) => r.priority === 'critical').length;
  const highCount = recommendations.filter((r) => r.priority === 'high').length;

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary-500/20">
            <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Recommendations</h3>
            <p className="text-sm text-white/50">{recommendations.length} suggestions</p>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex items-center gap-2">
          {criticalCount > 0 && (
            <div className="px-2 py-1 rounded-lg bg-rage-500/20 border border-rage-500/30">
              <span className="text-xs font-medium text-rage-400">
                {criticalCount} Critical
              </span>
            </div>
          )}
          {highCount > 0 && (
            <div className="px-2 py-1 rounded-lg bg-longing-500/20 border border-longing-500/30">
              <span className="text-xs font-medium text-longing-400">
                {highCount} High
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Potential revenue */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-relief-500/10 to-relief-600/10 border border-relief-500/20 mb-6">
        <p className="text-xs text-relief-400 mb-1">Total Potential Revenue</p>
        <p className="text-2xl font-bold text-white">
          ${totalPotentialRevenue.toLocaleString()}
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 no-scrollbar">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
            filter === 'all'
              ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
              : 'bg-surface-100 text-white/50 border border-transparent hover:text-white/70'
          }`}
        >
          All ({recommendations.length})
        </button>
        {Object.entries(recommendationTypeConfig).map(([type, config]) => {
          const count = recommendations.filter((r) => r.type === type).length;
          if (count === 0) return null;
          return (
            <button
              key={type}
              onClick={() => setFilter(type as AIRecommendationType)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                filter === type
                  ? `${config.bg} ${config.color} border border-current/30`
                  : 'bg-surface-100 text-white/50 border border-transparent hover:text-white/70'
              }`}
            >
              {config.icon}
              {config.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Recommendations list */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredRecommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
              onAction={onAction}
              onDismiss={onDismiss}
            />
          ))}
        </AnimatePresence>

        {filteredRecommendations.length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-surface-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm text-white/40">No recommendations in this category</p>
          </div>
        )}
      </div>

      {/* View all link */}
      {recommendations.length > maxItems && (
        <button className="w-full mt-4 py-3 text-sm text-primary-400 hover:text-primary-300 transition-colors">
          View all {recommendations.length} recommendations
        </button>
      )}
    </div>
  );
};

export default AIRecommendationPanel;
