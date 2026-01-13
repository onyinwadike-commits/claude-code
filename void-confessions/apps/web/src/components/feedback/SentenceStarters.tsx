'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { SentenceStartersProps, SentenceStarter } from '@/lib/feedback/types';
import { getStartersByCategory } from '@/lib/feedback/sentence-starters';

const sentimentColors: Record<string, { bg: string; border: string; text: string }> = {
  positive: {
    bg: 'bg-[#10B981]/10',
    border: 'border-[#10B981]/30',
    text: 'text-[#10B981]',
  },
  neutral: {
    bg: 'bg-[#0071CE]/10',
    border: 'border-[#0071CE]/30',
    text: 'text-[#0071CE]',
  },
  negative: {
    bg: 'bg-[#EF4444]/10',
    border: 'border-[#EF4444]/30',
    text: 'text-[#EF4444]',
  },
};

const sentimentIcons: Record<string, string> = {
  positive: '😊',
  neutral: '💭',
  negative: '😕',
};

export const SentenceStarters: React.FC<SentenceStartersProps> = ({
  category,
  onSelect,
  selectedId,
}) => {
  const starters = useMemo(() => getStartersByCategory(category), [category]);

  // Group starters by sentiment
  const groupedStarters = useMemo(() => {
    const groups: Record<string, SentenceStarter[]> = {
      positive: [],
      neutral: [],
      negative: [],
    };

    starters.forEach((starter) => {
      groups[starter.sentiment].push(starter);
    });

    return groups;
  }, [starters]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const chipVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1 },
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-white/70">
          Quick starters to help you begin...
        </h4>
        <span className="text-xs text-white/40">{starters.length} prompts</span>
      </div>

      {(['positive', 'neutral', 'negative'] as const).map((sentiment) => {
        const sentimentStarters = groupedStarters[sentiment];
        if (sentimentStarters.length === 0) return null;

        const colors = sentimentColors[sentiment];

        return (
          <div key={sentiment} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm">{sentimentIcons[sentiment]}</span>
              <span className={`text-xs font-medium capitalize ${colors.text}`}>
                {sentiment} feedback
              </span>
            </div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-2"
            >
              {sentimentStarters.map((starter) => {
                const isSelected = selectedId === starter.id;

                return (
                  <motion.button
                    key={starter.id}
                    variants={chipVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onSelect(starter)}
                    className={`
                      px-3 py-2 rounded-xl text-sm text-left transition-all
                      border backdrop-blur-sm
                      ${isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text} ring-2 ring-offset-2 ring-offset-background`
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                      }
                    `}
                    style={{
                      ringColor: isSelected ? colors.text.replace('text-', '') : undefined,
                    }}
                  >
                    <span className="line-clamp-1">{starter.text}</span>
                  </motion.button>
                );
              })}
            </motion.div>
          </div>
        );
      })}

      {/* Custom option */}
      <div className="pt-2 border-t border-white/10">
        <button
          onClick={() =>
            onSelect({
              id: 'custom',
              text: '',
              category,
              type: 'suggestion',
              sentiment: 'neutral',
            })
          }
          className={`
            w-full px-4 py-3 rounded-xl text-sm text-center transition-all
            border border-dashed border-white/20 text-white/50
            hover:border-[#0071CE]/50 hover:text-[#0071CE] hover:bg-[#0071CE]/5
            ${selectedId === 'custom' ? 'border-[#0071CE]/50 text-[#0071CE] bg-[#0071CE]/5' : ''}
          `}
        >
          ✍️ Write your own feedback
        </button>
      </div>
    </div>
  );
};

export default SentenceStarters;
