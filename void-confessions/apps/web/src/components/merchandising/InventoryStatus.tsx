'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { InventoryStatusProps } from '@/types/merchandising';

interface DonutSegment {
  value: number;
  color: string;
  label: string;
}

const DonutChart: React.FC<{ segments: DonutSegment[]; size?: number }> = ({
  segments,
  size = 120,
}) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let currentOffset = 0;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={strokeWidth}
      />
      {/* Segments */}
      {segments.map((segment, index) => {
        const percentage = total > 0 ? segment.value / total : 0;
        const dashLength = circumference * percentage;
        const dashOffset = circumference * currentOffset;
        currentOffset += percentage;

        return (
          <motion.circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${dashLength} ${circumference - dashLength}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${circumference}` }}
            animate={{ strokeDasharray: `${dashLength} ${circumference - dashLength}` }}
            transition={{ duration: 0.8, delay: index * 0.1 }}
          />
        );
      })}
    </svg>
  );
};

export const InventoryStatus: React.FC<InventoryStatusProps> = ({
  metrics,
  showChart = true,
  compact = false,
}) => {
  const statusSegments: DonutSegment[] = [
    { value: metrics.inStockCount, color: '#22c55e', label: 'In Stock' },
    { value: metrics.lowStockCount, color: '#f97316', label: 'Low Stock' },
    { value: metrics.outOfStockCount, color: '#f43f5e', label: 'Out of Stock' },
    { value: metrics.overstockCount, color: '#6366f1', label: 'Overstock' },
  ];

  const healthScore = Math.round(
    ((metrics.inStockCount + metrics.overstockCount * 0.7) / metrics.totalProducts) * 100
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  if (compact) {
    return (
      <div className="glass-card p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-relief-500/20">
              <svg className="w-5 h-5 text-relief-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Inventory Health</p>
              <p className="text-xs text-white/50">{metrics.totalProducts} products</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{healthScore}%</p>
            <p className="text-xs text-white/40">Health Score</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4">
          {statusSegments.map((segment) => (
            <div key={segment.label} className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: segment.color }} />
              <span className="text-xs text-white/50">{segment.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-relief-500/20">
            <svg className="w-5 h-5 text-relief-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Inventory Status</h3>
            <p className="text-sm text-white/50">{metrics.totalProducts} total products</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-white">{healthScore}%</p>
          <p className="text-xs text-white/40">Health Score</p>
        </div>
      </div>

      {/* Chart and Legend */}
      {showChart && (
        <div className="flex items-center gap-8 mb-6">
          <div className="relative">
            <DonutChart segments={statusSegments} size={140} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{metrics.totalProducts}</p>
                <p className="text-xs text-white/40">Products</p>
              </div>
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {statusSegments.map((segment) => {
              const percentage = metrics.totalProducts > 0
                ? ((segment.value / metrics.totalProducts) * 100).toFixed(1)
                : '0';
              return (
                <div key={segment.label} className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-white/70">{segment.label}</span>
                      <span className="text-sm font-medium text-white">{segment.value}</span>
                    </div>
                    <div className="h-1 bg-surface-200 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 0.5 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: segment.color }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
        <div className="p-3 rounded-xl bg-surface-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="text-xs text-white/40">Turnover Rate</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {metrics.turnoverRate.toFixed(1)}x
          </p>
          <p className="text-xs text-white/30 mt-1">per month</p>
        </div>

        <div className="p-3 rounded-xl bg-surface-100">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-longing-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-white/40">Avg Days on Shelf</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {metrics.averageDaysOnShelf.toFixed(0)}
          </p>
          <p className="text-xs text-white/30 mt-1">days</p>
        </div>

        <div className="col-span-2 p-3 rounded-xl bg-gradient-to-r from-primary-500/10 to-void-500/10 border border-primary-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/40">Total Inventory Value</p>
              <p className="text-2xl font-bold text-white mt-1">
                {formatCurrency(metrics.totalValue)}
              </p>
            </div>
            <div className="p-2 rounded-lg bg-primary-500/20">
              <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(metrics.outOfStockCount > 0 || metrics.lowStockCount > 5) && (
        <div className="mt-4 p-3 rounded-xl bg-rage-500/10 border border-rage-500/20">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-rage-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm text-rage-400">
              {metrics.outOfStockCount > 0 && `${metrics.outOfStockCount} items out of stock`}
              {metrics.outOfStockCount > 0 && metrics.lowStockCount > 5 && ' • '}
              {metrics.lowStockCount > 5 && `${metrics.lowStockCount} items low stock`}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryStatus;
