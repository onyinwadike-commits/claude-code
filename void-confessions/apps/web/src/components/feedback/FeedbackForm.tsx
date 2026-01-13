'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  FeedbackFormProps,
  Feedback,
  FeedbackCategory,
  FeedbackType,
  SentenceStarter,
} from '@/lib/feedback/types';
import { categoryConfig } from '@/lib/feedback/types';
import { RatingStars } from './RatingStars';
import { SentenceStarters } from './SentenceStarters';

const feedbackTypes: { value: FeedbackType; label: string; icon: string }[] = [
  { value: 'praise', label: 'Praise', icon: '👍' },
  { value: 'suggestion', label: 'Suggestion', icon: '💡' },
  { value: 'complaint', label: 'Complaint', icon: '😕' },
  { value: 'bug', label: 'Bug Report', icon: '🐛' },
  { value: 'feature', label: 'Feature Request', icon: '✨' },
];

export const FeedbackForm: React.FC<FeedbackFormProps> = ({
  onSubmit,
  onCancel,
  initialCategory = 'usability',
  storeId,
  storeName,
  compact = false,
}) => {
  const [step, setStep] = useState<'category' | 'starter' | 'details'>('category');
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [selectedStarter, setSelectedStarter] = useState<SentenceStarter | null>(null);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStarterSelect = (starter: SentenceStarter) => {
    setSelectedStarter(starter);
    if (starter.id !== 'custom') {
      setMessage(starter.text);
      setType(starter.type);
    } else {
      setMessage('');
    }
    setStep('details');
  };

  const handleCategorySelect = (cat: FeedbackCategory) => {
    setCategory(cat);
    setSelectedStarter(null);
    setMessage('');
    setStep('starter');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);

    const feedback: Partial<Feedback> = {
      category,
      type,
      title: title.trim() || message.substring(0, 50) + '...',
      message: message.trim(),
      rating: rating > 0 ? rating : undefined,
      storeId,
      storeName,
      status: 'new',
      priority: 'medium',
      tags: [],
      votes: 0,
      votedBy: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await onSubmit?.(feedback);
      // Reset form
      setStep('category');
      setCategory(initialCategory);
      setSelectedStarter(null);
      setTitle('');
      setMessage('');
      setRating(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = message.trim().length >= 10;

  const categories = useMemo(() => Object.entries(categoryConfig), []);

  return (
    <div className="glass-card p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[#0071CE]/20">
            <svg
              className="w-5 h-5 text-[#0071CE]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Share Feedback</h3>
            <p className="text-sm text-white/50">Help us improve Walmart Ops</p>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {['category', 'starter', 'details'].map((s, i) => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${
                step === s
                  ? 'bg-[#0071CE] w-4'
                  : i < ['category', 'starter', 'details'].indexOf(step)
                  ? 'bg-[#0071CE]/50'
                  : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* Step 1: Category Selection */}
          {step === 'category' && (
            <motion.div
              key="category"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <p className="text-sm text-white/70">
                What area would you like to give feedback on?
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map(([key, config]) => (
                  <motion.button
                    key={key}
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleCategorySelect(key as FeedbackCategory)}
                    className={`
                      p-4 rounded-xl border text-left transition-all
                      ${category === key
                        ? 'bg-[#0071CE]/10 border-[#0071CE]/30'
                        : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                  >
                    <span className="text-2xl mb-2 block">{config.icon}</span>
                    <span className="text-sm font-medium text-white">{config.label}</span>
                    <p className="text-xs text-white/40 mt-1 line-clamp-2">
                      {config.description}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Sentence Starters */}
          {step === 'starter' && (
            <motion.div
              key="starter"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStep('category')}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryConfig[category].icon}</span>
                  <span className="text-sm font-medium text-white">
                    {categoryConfig[category].label}
                  </span>
                </div>
              </div>

              <SentenceStarters
                category={category}
                onSelect={handleStarterSelect}
                selectedId={selectedStarter?.id}
              />
            </motion.div>
          )}

          {/* Step 3: Details */}
          {step === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-5"
            >
              <div className="flex items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={() => setStep('starter')}
                  className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryConfig[category].icon}</span>
                  <span className="text-sm font-medium text-white">
                    {categoryConfig[category].label}
                  </span>
                </div>
              </div>

              {/* Feedback Type */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Feedback Type</label>
                <div className="flex flex-wrap gap-2">
                  {feedbackTypes.map((ft) => (
                    <button
                      key={ft.value}
                      type="button"
                      onClick={() => setType(ft.value)}
                      className={`
                        px-3 py-2 rounded-lg text-sm font-medium transition-all
                        border flex items-center gap-2
                        ${type === ft.value
                          ? 'bg-[#0071CE]/20 border-[#0071CE]/30 text-[#0071CE]'
                          : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                        }
                      `}
                    >
                      <span>{ft.icon}</span>
                      {ft.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title (optional) */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Title <span className="text-white/40">(optional)</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className="input-premium w-full"
                  maxLength={100}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">Your Feedback</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us more about your experience..."
                  rows={4}
                  className="input-premium w-full resize-none"
                  minLength={10}
                  required
                />
                <p className="text-xs text-white/40 text-right">
                  {message.length} / 1000 characters
                </p>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/70">
                  Overall Experience <span className="text-white/40">(optional)</span>
                </label>
                <RatingStars value={rating} onChange={setRating} size="lg" showLabel />
              </div>

              {/* Store Info */}
              {storeName && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-xs text-white/40">Submitting for</p>
                  <p className="text-sm font-medium text-white">{storeName}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                <button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  className={`
                    flex-1 py-3 px-6 rounded-xl font-medium transition-all
                    flex items-center justify-center gap-2
                    ${canSubmit
                      ? 'bg-gradient-to-r from-[#0071CE] to-[#005BA1] text-white hover:shadow-lg hover:shadow-[#0071CE]/25'
                      : 'bg-white/10 text-white/40 cursor-not-allowed'
                    }
                  `}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                        />
                      </svg>
                      Submit Feedback
                    </>
                  )}
                </button>

                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="py-3 px-6 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
};

export default FeedbackForm;
