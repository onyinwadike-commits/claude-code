'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { CategoryNavProps, ProductCategory } from '@/types/merchandising';

const categoryIcons: Record<ProductCategory, React.ReactNode> = {
  grocery: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  electronics: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  ),
  clothing: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.29 2L2 6.29v11.42L6.29 22h11.42L22 17.71V6.29L17.71 2H6.29z" />
    </svg>
  ),
  home: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  toys: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  beauty: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  ),
  pharmacy: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  automotive: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m-8 4h8m-4 4v-4M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
    </svg>
  ),
  garden: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  sports: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
};

const categoryColors: Record<ProductCategory, { bg: string; text: string; border: string }> = {
  grocery: { bg: 'bg-relief-500/20', text: 'text-relief-400', border: 'border-relief-500/30' },
  electronics: { bg: 'bg-grief-500/20', text: 'text-grief-400', border: 'border-grief-500/30' },
  clothing: { bg: 'bg-void-500/20', text: 'text-void-400', border: 'border-void-500/30' },
  home: { bg: 'bg-longing-500/20', text: 'text-longing-400', border: 'border-longing-500/30' },
  toys: { bg: 'bg-rage-500/20', text: 'text-rage-400', border: 'border-rage-500/30' },
  beauty: { bg: 'bg-primary-500/20', text: 'text-primary-400', border: 'border-primary-500/30' },
  pharmacy: { bg: 'bg-guilt-500/20', text: 'text-guilt-400', border: 'border-guilt-500/30' },
  automotive: { bg: 'bg-grief-600/20', text: 'text-grief-300', border: 'border-grief-500/30' },
  garden: { bg: 'bg-relief-600/20', text: 'text-relief-300', border: 'border-relief-500/30' },
  sports: { bg: 'bg-longing-600/20', text: 'text-longing-300', border: 'border-longing-500/30' },
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatGrowth = (value: number) => {
    const prefix = value >= 0 ? '+' : '';
    return `${prefix}${value.toFixed(1)}%`;
  };

  return (
    <div className="glass-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-sm font-semibold text-white">Categories</h3>
        <span className="text-xs text-white/40">({categories.length})</span>
      </div>

      <div className="space-y-2">
        {categories.map((stat) => {
          const isSelected = selectedCategory === stat.category;
          const colors = categoryColors[stat.category];

          return (
            <motion.button
              key={stat.category}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategorySelect?.(stat.category)}
              className={`
                w-full flex items-center gap-3 p-3 rounded-xl transition-all
                ${isSelected
                  ? `${colors.bg} border ${colors.border}`
                  : 'bg-surface-50 border border-transparent hover:bg-surface-100'
                }
              `}
            >
              <div className={`p-2 rounded-lg ${isSelected ? colors.bg : 'bg-surface-200'}`}>
                <span className={isSelected ? colors.text : 'text-white/50'}>
                  {categoryIcons[stat.category]}
                </span>
              </div>

              <div className="flex-1 text-left">
                <p className={`text-sm font-medium capitalize ${isSelected ? 'text-white' : 'text-white/70'}`}>
                  {stat.category}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-white/40">{stat.productCount} products</span>
                  <span className="text-xs text-white/20">•</span>
                  <span className="text-xs text-white/40">{formatCurrency(stat.revenue)}</span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`text-xs font-medium ${
                    stat.growth >= 0 ? 'text-relief-400' : 'text-rage-400'
                  }`}
                >
                  {formatGrowth(stat.growth)}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/40">Total Revenue</span>
          <span className="text-white font-medium">
            {formatCurrency(categories.reduce((sum, c) => sum + c.revenue, 0))}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs mt-2">
          <span className="text-white/40">Total Products</span>
          <span className="text-white font-medium">
            {categories.reduce((sum, c) => sum + c.productCount, 0).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryNav;
