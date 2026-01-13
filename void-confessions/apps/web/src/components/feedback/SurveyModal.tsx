'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SurveyModalProps, SurveyResponse, SurveyType } from '@/lib/feedback/types';

const surveyConfig: Record<
  SurveyType,
  {
    title: string;
    question: string;
    lowLabel: string;
    highLabel: string;
    maxScore: number;
    description: string;
  }
> = {
  nps: {
    title: 'Net Promoter Score',
    question: 'How likely are you to recommend Walmart Ops to a colleague?',
    lowLabel: 'Not at all likely',
    highLabel: 'Extremely likely',
    maxScore: 10,
    description: 'Help us understand how we\'re doing overall',
  },
  csat: {
    title: 'Customer Satisfaction',
    question: 'How satisfied are you with your experience today?',
    lowLabel: 'Very Dissatisfied',
    highLabel: 'Very Satisfied',
    maxScore: 5,
    description: 'Rate your satisfaction with our platform',
  },
  ces: {
    title: 'Customer Effort Score',
    question: 'How easy was it to accomplish your task today?',
    lowLabel: 'Very Difficult',
    highLabel: 'Very Easy',
    maxScore: 7,
    description: 'Tell us about your experience completing tasks',
  },
};

const getNPSCategory = (score: number): { label: string; color: string } => {
  if (score >= 9) return { label: 'Promoter', color: '#10B981' };
  if (score >= 7) return { label: 'Passive', color: '#FFC220' };
  return { label: 'Detractor', color: '#EF4444' };
};

export const SurveyModal: React.FC<SurveyModalProps> = ({
  type,
  isOpen,
  onClose,
  onSubmit,
  category,
}) => {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const config = surveyConfig[type];

  const handleSubmit = async () => {
    if (score === null) return;

    setIsSubmitting(true);

    const response: SurveyResponse = {
      id: Math.random().toString(36).substring(2, 11),
      surveyType: type,
      score,
      comment: comment.trim() || undefined,
      category,
      createdAt: new Date(),
    };

    try {
      await onSubmit(response);
      setIsComplete(true);
      setTimeout(() => {
        onClose();
        // Reset state after closing
        setTimeout(() => {
          setScore(null);
          setComment('');
          setIsComplete(false);
        }, 300);
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      // Reset state
      setScore(null);
      setComment('');
      setIsComplete(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative glass-card p-6 w-full max-w-lg"
          >
            <AnimatePresence mode="wait">
              {isComplete ? (
                /* Success State */
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-center py-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#10B981]/20 flex items-center justify-center"
                  >
                    <svg
                      className="w-8 h-8 text-[#10B981]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">Thank You!</h3>
                  <p className="text-white/60">Your feedback helps us improve.</p>
                </motion.div>
              ) : (
                /* Survey Form */
                <motion.div
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-[#0071CE]/20 text-[#0071CE]">
                          {config.title}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white">{config.question}</h3>
                      <p className="text-sm text-white/50 mt-1">{config.description}</p>
                    </div>
                    <button
                      onClick={handleClose}
                      className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Score Selection */}
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs text-white/40">
                      <span>{config.lowLabel}</span>
                      <span>{config.highLabel}</span>
                    </div>

                    <div className="flex gap-2">
                      {Array.from({ length: config.maxScore }, (_, i) => i + 1).map((num) => {
                        const isSelected = score === num;
                        let bgColor = 'bg-white/5';
                        let textColor = 'text-white/70';

                        if (isSelected) {
                          if (type === 'nps') {
                            const cat = getNPSCategory(num);
                            bgColor = `bg-[${cat.color}]/20`;
                            textColor = `text-[${cat.color}]`;
                          } else {
                            bgColor = 'bg-[#0071CE]/20';
                            textColor = 'text-[#0071CE]';
                          }
                        }

                        return (
                          <motion.button
                            key={num}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setScore(num)}
                            className={`
                              flex-1 py-3 rounded-xl text-sm font-medium transition-all
                              border ${isSelected
                                ? type === 'nps'
                                  ? `border-[${getNPSCategory(num).color}]/30`
                                  : 'border-[#0071CE]/30'
                                : 'border-white/10 hover:border-white/20 hover:bg-white/10'
                              }
                            `}
                            style={{
                              backgroundColor: isSelected
                                ? type === 'nps'
                                  ? `${getNPSCategory(num).color}20`
                                  : 'rgba(0, 113, 206, 0.2)'
                                : undefined,
                              color: isSelected
                                ? type === 'nps'
                                  ? getNPSCategory(num).color
                                  : '#0071CE'
                                : undefined,
                            }}
                          >
                            {num}
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* NPS Category Label */}
                    {type === 'nps' && score !== null && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center text-sm font-medium"
                        style={{ color: getNPSCategory(score).color }}
                      >
                        {getNPSCategory(score).label}
                      </motion.p>
                    )}
                  </div>

                  {/* Comment */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/70">
                      Additional Comments <span className="text-white/40">(optional)</span>
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us more about your experience..."
                      rows={3}
                      className="input-premium w-full resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleSubmit}
                      disabled={score === null || isSubmitting}
                      className={`
                        flex-1 py-3 px-6 rounded-xl font-medium transition-all
                        flex items-center justify-center gap-2
                        ${score !== null
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
                        'Submit Response'
                      )}
                    </button>
                    <button
                      onClick={handleClose}
                      disabled={isSubmitting}
                      className="py-3 px-6 rounded-xl font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all"
                    >
                      Skip
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SurveyModal;
