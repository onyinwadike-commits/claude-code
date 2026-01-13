'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  FeedbackForm,
  FeedbackDashboard,
  SurveyModal,
  IssueReporter,
  FeatureRequestCard,
  mockFeatureRequests,
} from '@/components/feedback';
import type { Feedback, SurveyResponse, IssueReport } from '@/lib/feedback/types';

type TabType = 'submit' | 'browse' | 'features' | 'issues';

export default function FeedbackPage() {
  const [activeTab, setActiveTab] = useState<TabType>('submit');
  const [showSurvey, setShowSurvey] = useState(false);
  const [surveyType, setSurveyType] = useState<'nps' | 'csat' | 'ces'>('nps');

  const handleFeedbackSubmit = async (feedback: Partial<Feedback>) => {
    console.log('Submitting feedback:', feedback);
    // In production, call the API
    // await fetch('/api/feedback', { method: 'POST', body: JSON.stringify(feedback) });

    // Show success and switch to browse tab
    setActiveTab('browse');
  };

  const handleSurveySubmit = async (response: SurveyResponse) => {
    console.log('Survey response:', response);
    // In production, send to analytics service
  };

  const handleIssueSubmit = async (issue: Partial<IssueReport>) => {
    console.log('Issue report:', issue);
    // In production, call the API
    setActiveTab('browse');
  };

  const handleFeatureVote = (featureId: string) => {
    console.log('Vote for feature:', featureId);
    // In production, call the API
  };

  const openSurvey = (type: 'nps' | 'csat' | 'ces') => {
    setSurveyType(type);
    setShowSurvey(true);
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    {
      id: 'submit',
      label: 'Submit Feedback',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
      ),
    },
    {
      id: 'browse',
      label: 'Browse Feedback',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
    },
    {
      id: 'features',
      label: 'Feature Requests',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: 'issues',
      label: 'Report Issue',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-[#0071CE]/20">
                <svg className="w-6 h-6 text-[#0071CE]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Feedback Center</h1>
                <p className="text-sm text-white/50">Help us improve Walmart Ops</p>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link href="/merchandising" className="nav-link">
                Dashboard
              </Link>
              <Link href="/merchandising/planogram" className="nav-link">
                Planograms
              </Link>
              <Link href="/merchandising/analytics" className="nav-link">
                Analytics
              </Link>
              <Link href="/feedback" className="nav-link nav-link-active">
                Feedback
              </Link>
            </nav>

            {/* Survey Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => openSurvey('nps')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#0071CE]/10 text-[#0071CE] hover:bg-[#0071CE]/20 transition-all"
              >
                NPS Survey
              </button>
              <button
                onClick={() => openSurvey('csat')}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#FFC220]/10 text-[#FFC220] hover:bg-[#FFC220]/20 transition-all"
              >
                Satisfaction
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-8 p-1 rounded-xl bg-white/5 w-fit">
          {tabs.map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`
                flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-[#0071CE] text-white shadow-lg shadow-[#0071CE]/25'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
                }
              `}
            >
              {tab.icon}
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'submit' && (
            <motion.div
              key="submit"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8">
                  <FeedbackForm onSubmit={handleFeedbackSubmit} />
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                  {/* Quick Tips */}
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                      <span className="text-[#FFC220]">💡</span>
                      Tips for Great Feedback
                    </h3>
                    <ul className="space-y-3 text-sm text-white/60">
                      <li className="flex items-start gap-2">
                        <span className="text-[#0071CE] mt-0.5">•</span>
                        Be specific about what you experienced
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0071CE] mt-0.5">•</span>
                        Include examples or screenshots if possible
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0071CE] mt-0.5">•</span>
                        Mention the store or feature involved
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-[#0071CE] mt-0.5">•</span>
                        Describe impact on your workflow
                      </li>
                    </ul>
                  </div>

                  {/* Recent Activity */}
                  <div className="glass-card p-5">
                    <h3 className="text-sm font-semibold text-white mb-4">Recent Activity</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                        <span className="text-white/60">AI accuracy feedback reviewed</span>
                        <span className="text-xs text-white/30 ml-auto">2h ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-[#FFC220]" />
                        <span className="text-white/60">Feature request in development</span>
                        <span className="text-xs text-white/30 ml-auto">5h ago</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-[#0071CE]" />
                        <span className="text-white/60">New planogram suggestion</span>
                        <span className="text-xs text-white/30 ml-auto">1d ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'browse' && (
            <motion.div
              key="browse"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <FeedbackDashboard showFilters />
            </motion.div>
          )}

          {activeTab === 'features' && (
            <motion.div
              key="features"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Feature Requests</h2>
                  <p className="text-sm text-white/50">Vote for features you want to see</p>
                </div>
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-4 py-2 rounded-xl bg-[#0071CE] text-white text-sm font-medium hover:bg-[#0071CE]/90 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Request Feature
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {mockFeatureRequests.map((feature) => (
                  <FeatureRequestCard
                    key={feature.id}
                    feature={feature}
                    onVote={handleFeatureVote}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'issues' && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-2xl"
            >
              <IssueReporter onSubmit={handleIssueSubmit} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Survey Modal */}
      <SurveyModal
        type={surveyType}
        isOpen={showSurvey}
        onClose={() => setShowSurvey(false)}
        onSubmit={handleSurveySubmit}
      />

      {/* Floating Feedback Button (for other pages) */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-[#0071CE] to-[#005BA1] text-white shadow-lg shadow-[#0071CE]/30 flex items-center justify-center z-40"
        onClick={() => setActiveTab('submit')}
        style={{ display: activeTab === 'submit' ? 'none' : 'flex' }}
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </motion.button>
    </div>
  );
}
