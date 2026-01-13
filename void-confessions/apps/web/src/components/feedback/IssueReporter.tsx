'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { IssueReporterProps, IssueReport, FeedbackCategory } from '@/lib/feedback/types';
import { categoryConfig } from '@/lib/feedback/types';

type Severity = 'minor' | 'moderate' | 'major' | 'critical';

const severityConfig: Record<Severity, { label: string; color: string; bg: string; description: string }> = {
  minor: {
    label: 'Minor',
    color: '#6B7280',
    bg: 'rgba(107, 114, 128, 0.2)',
    description: 'Small inconvenience, workaround available',
  },
  moderate: {
    label: 'Moderate',
    color: '#FFC220',
    bg: 'rgba(255, 194, 32, 0.2)',
    description: 'Noticeable issue affecting workflow',
  },
  major: {
    label: 'Major',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.2)',
    description: 'Significant impact on operations',
  },
  critical: {
    label: 'Critical',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    description: 'Blocking issue, unable to proceed',
  },
};

export const IssueReporter: React.FC<IssueReporterProps> = ({
  onSubmit,
  onCancel,
  initialCategory = 'usability',
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<FeedbackCategory>(initialCategory);
  const [severity, setSeverity] = useState<Severity>('moderate');
  const [stepsToReproduce, setStepsToReproduce] = useState(['']);
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddStep = () => {
    setStepsToReproduce([...stepsToReproduce, '']);
  };

  const handleRemoveStep = (index: number) => {
    setStepsToReproduce(stepsToReproduce.filter((_, i) => i !== index));
  };

  const handleStepChange = (index: number, value: string) => {
    const newSteps = [...stepsToReproduce];
    newSteps[index] = value;
    setStepsToReproduce(newSteps);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    setIsSubmitting(true);

    const issue: Partial<IssueReport> = {
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      stepsToReproduce: stepsToReproduce.filter((s) => s.trim()),
      expectedBehavior: expectedBehavior.trim() || undefined,
      actualBehavior: actualBehavior.trim() || undefined,
      browserInfo: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      await onSubmit?.(issue);
      // Reset form
      setTitle('');
      setDescription('');
      setStepsToReproduce(['']);
      setExpectedBehavior('');
      setActualBehavior('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = title.trim().length >= 5 && description.trim().length >= 20;

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-[#EF4444]/20">
          <svg className="w-5 h-5 text-[#EF4444]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Report an Issue</h3>
          <p className="text-sm text-white/50">Help us identify and fix problems</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            Issue Title <span className="text-[#EF4444]">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            className="input-premium w-full"
            required
            minLength={5}
          />
        </div>

        {/* Category & Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as FeedbackCategory)}
              className="input-premium w-full"
            >
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.icon} {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Severity</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as Severity)}
              className="input-premium w-full"
            >
              {Object.entries(severityConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Severity Description */}
        <div
          className="p-3 rounded-xl border text-sm"
          style={{
            backgroundColor: severityConfig[severity].bg,
            borderColor: severityConfig[severity].color + '30',
            color: severityConfig[severity].color,
          }}
        >
          <span className="font-medium">{severityConfig[severity].label}:</span>{' '}
          {severityConfig[severity].description}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-white/70">
            Detailed Description <span className="text-[#EF4444]">*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue in detail. What happened? When did it start?"
            rows={4}
            className="input-premium w-full resize-none"
            required
            minLength={20}
          />
        </div>

        {/* Steps to Reproduce */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/70">Steps to Reproduce</label>
            <button
              type="button"
              onClick={handleAddStep}
              className="text-xs text-[#0071CE] hover:text-[#0071CE]/80 flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Step
            </button>
          </div>
          <div className="space-y-2">
            {stepsToReproduce.map((step, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-white/40 w-6">{index + 1}.</span>
                <input
                  type="text"
                  value={step}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                  placeholder={`Step ${index + 1}`}
                  className="input-premium flex-1"
                />
                {stepsToReproduce.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveStep(index)}
                    className="p-2 rounded-lg hover:bg-white/10 text-white/40 hover:text-white/70"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expected vs Actual Behavior */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Expected Behavior</label>
            <textarea
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              placeholder="What should have happened?"
              rows={3}
              className="input-premium w-full resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/70">Actual Behavior</label>
            <textarea
              value={actualBehavior}
              onChange={(e) => setActualBehavior(e.target.value)}
              placeholder="What actually happened?"
              rows={3}
              className="input-premium w-full resize-none"
            />
          </div>
        </div>

        {/* Browser Info */}
        <div className="p-3 rounded-xl bg-white/5 border border-white/10">
          <p className="text-xs text-white/40 mb-1">Browser Information (auto-detected)</p>
          <p className="text-xs text-white/60 truncate">
            {typeof navigator !== 'undefined' ? navigator.userAgent : 'Not available'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className={`
              flex-1 py-3 px-6 rounded-xl font-medium transition-all
              flex items-center justify-center gap-2
              ${canSubmit
                ? 'bg-gradient-to-r from-[#EF4444] to-[#DC2626] text-white hover:shadow-lg hover:shadow-[#EF4444]/25'
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
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                Submit Issue Report
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
      </form>
    </div>
  );
};

export default IssueReporter;
