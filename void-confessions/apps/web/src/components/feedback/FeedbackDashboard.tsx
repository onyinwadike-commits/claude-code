'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  FeedbackDashboardProps,
  FeedbackCategory,
  FeedbackStatus,
  FeedbackType,
  Feedback,
} from '@/lib/feedback/types';
import { categoryConfig, statusConfig } from '@/lib/feedback/types';
import { FeedbackCard } from './FeedbackCard';

// Mock data for demonstration
const mockFeedback: Feedback[] = [
  {
    id: '1',
    userId: 'user-1',
    userName: 'Sarah Johnson',
    storeId: 'store-001',
    storeName: 'Market 396 - Store #4158',
    type: 'suggestion',
    category: 'ai-accuracy',
    title: 'AI restock recommendations are getting more accurate',
    message: 'I followed the AI suggestion and it resulted in a 15% increase in sales for the beverage aisle. The timing of the recommendation was perfect - right before the weekend rush.',
    rating: 5,
    sentiment: 'positive',
    status: 'reviewed',
    priority: 'medium',
    tags: ['ai', 'inventory', 'positive-outcome'],
    votes: 24,
    votedBy: [],
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
  {
    id: '2',
    userName: 'Mike Chen',
    storeId: 'store-002',
    storeName: 'Market 396 - Store #4201',
    type: 'bug',
    category: 'visual-merch',
    title: 'Planogram viewer not loading product images',
    message: 'I can\'t seem to update the product placement for aisle 7. The images in the planogram viewer are showing as broken, and when I try to drag products, the interface freezes.',
    sentiment: 'negative',
    status: 'in_progress',
    priority: 'high',
    tags: ['bug', 'planogram', 'ui'],
    votes: 18,
    votedBy: [],
    adminResponse: 'We\'ve identified the issue and our team is working on a fix. This should be resolved in the next update.',
    adminRespondedAt: new Date(Date.now() - 30 * 60 * 1000),
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: '3',
    userName: 'Emily Davis',
    type: 'feature',
    category: 'amazon-warfare',
    title: 'Need real-time Amazon price alerts',
    message: 'It would be amazing if we could get push notifications when Amazon drops prices on our key battleground items. Currently, by the time I check the dashboard, we\'ve already lost some sales.',
    sentiment: 'neutral',
    status: 'new',
    priority: 'critical',
    tags: ['feature', 'pricing', 'alerts'],
    votes: 45,
    votedBy: [],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    userName: 'James Wilson',
    storeId: 'store-003',
    storeName: 'Market 396 - Store #4322',
    type: 'praise',
    category: 'report-quality',
    title: 'The new dashboard metrics are incredibly helpful',
    message: 'The trend analysis helped me understand our weekly patterns better. I love how quickly I can now identify which products need attention. Great job on this feature!',
    rating: 5,
    sentiment: 'positive',
    status: 'resolved',
    priority: 'low',
    tags: ['praise', 'dashboard', 'analytics'],
    votes: 12,
    votedBy: [],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    userName: 'Lisa Martinez',
    type: 'complaint',
    category: 'usability',
    title: 'Too many clicks to access daily reports',
    message: 'I found it difficult to navigate to the daily sales report. It takes too many clicks to get there from the main dashboard. Could we have a quick access button or shortcut?',
    rating: 2,
    sentiment: 'negative',
    status: 'new',
    priority: 'medium',
    tags: ['ux', 'navigation', 'reports'],
    votes: 31,
    votedBy: [],
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
];

type SortOption = 'newest' | 'oldest' | 'most_votes' | 'highest_rated';

export const FeedbackDashboard: React.FC<FeedbackDashboardProps> = ({
  initialCategory,
  showFilters = true,
}) => {
  const [feedback] = useState<Feedback[]>(mockFeedback);
  const [selectedCategory, setSelectedCategory] = useState<FeedbackCategory | 'all'>(
    initialCategory || 'all'
  );
  const [selectedStatus, setSelectedStatus] = useState<FeedbackStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<FeedbackType | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and sort feedback
  const filteredFeedback = useMemo(() => {
    let result = [...feedback];

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((f) => f.category === selectedCategory);
    }

    // Status filter
    if (selectedStatus !== 'all') {
      result = result.filter((f) => f.status === selectedStatus);
    }

    // Type filter
    if (selectedType !== 'all') {
      result = result.filter((f) => f.type === selectedType);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(query) ||
          f.message.toLowerCase().includes(query) ||
          f.userName?.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'most_votes':
        result.sort((a, b) => b.votes - a.votes);
        break;
      case 'highest_rated':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [feedback, selectedCategory, selectedStatus, selectedType, sortBy, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const total = feedback.length;
    const newCount = feedback.filter((f) => f.status === 'new').length;
    const resolvedCount = feedback.filter((f) => f.status === 'resolved').length;
    const avgRating =
      feedback.filter((f) => f.rating).reduce((sum, f) => sum + (f.rating || 0), 0) /
        feedback.filter((f) => f.rating).length || 0;

    return { total, newCount, resolvedCount, avgRating };
  }, [feedback]);

  const handleVote = (feedbackId: string) => {
    console.log('Vote for:', feedbackId);
    // In a real app, this would call an API
  };

  const handleStatusChange = (feedbackId: string, status: FeedbackStatus) => {
    console.log('Change status:', feedbackId, status);
    // In a real app, this would call an API
  };

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-white/40 mb-1">Total Feedback</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-white/40 mb-1">New</p>
          <p className="text-2xl font-bold text-[#0071CE]">{stats.newCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-white/40 mb-1">Resolved</p>
          <p className="text-2xl font-bold text-[#10B981]">{stats.resolvedCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-4"
        >
          <p className="text-xs text-white/40 mb-1">Avg Rating</p>
          <p className="text-2xl font-bold text-[#FFC220]">{stats.avgRating.toFixed(1)}</p>
        </motion.div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="glass-card p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search feedback..."
              className="input-premium w-full pl-10"
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as FeedbackCategory | 'all')}
                className="input-premium py-1.5 px-3 text-sm"
              >
                <option value="all">All Categories</option>
                {Object.entries(categoryConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.icon} {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as FeedbackStatus | 'all')}
                className="input-premium py-1.5 px-3 text-sm"
              >
                <option value="all">All Statuses</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/40">Type:</span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as FeedbackType | 'all')}
                className="input-premium py-1.5 px-3 text-sm"
              >
                <option value="all">All Types</option>
                <option value="praise">👍 Praise</option>
                <option value="suggestion">💡 Suggestion</option>
                <option value="complaint">😕 Complaint</option>
                <option value="bug">🐛 Bug Report</option>
                <option value="feature">✨ Feature Request</option>
              </select>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-white/40">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="input-premium py-1.5 px-3 text-sm"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="most_votes">Most Votes</option>
                <option value="highest_rated">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Feedback List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-white/50">
            Showing {filteredFeedback.length} of {feedback.length} feedback items
          </p>
        </div>

        <AnimatePresence mode="popLayout">
          {filteredFeedback.map((item) => (
            <FeedbackCard
              key={item.id}
              feedback={item}
              onVote={handleVote}
              onStatusChange={handleStatusChange}
              showAdminActions
            />
          ))}
        </AnimatePresence>

        {filteredFeedback.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="text-white/50">No feedback found matching your filters</p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSelectedType('all');
                setSearchQuery('');
              }}
              className="mt-4 text-sm text-[#0071CE] hover:text-[#0071CE]/80"
            >
              Clear all filters
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default FeedbackDashboard;
