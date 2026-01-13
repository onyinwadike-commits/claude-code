'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { InventoryStatus, CategoryNav, ProductCard } from '@/components/merchandising';
import {
  mockInventoryMetrics,
  mockSalesMetrics,
  mockCategoryStats,
  mockProducts,
} from '@/lib/mockMerchandisingData';

interface ChartBarProps {
  value: number;
  maxValue: number;
  label: string;
  color: string;
}

const ChartBar: React.FC<ChartBarProps> = ({ value, maxValue, label, color }) => {
  const percentage = (value / maxValue) * 100;
  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`w-full rounded-t-lg ${color}`}
          style={{ minHeight: '8px' }}
        />
      </div>
      <span className="text-xs text-white/40 w-8 text-center">{label}</span>
    </div>
  );
};

interface TimeRangeOption {
  label: string;
  value: string;
}

const timeRangeOptions: TimeRangeOption[] = [
  { label: 'Today', value: 'today' },
  { label: '7 Days', value: '7d' },
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: 'YTD', value: 'ytd' },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState<'revenue' | 'units' | 'margin'>('revenue');

  // Mock chart data
  const dailyData = [
    { day: 'Mon', revenue: 145230, units: 2156, margin: 28.5 },
    { day: 'Tue', revenue: 132450, units: 1987, margin: 27.2 },
    { day: 'Wed', revenue: 156780, units: 2345, margin: 29.1 },
    { day: 'Thu', revenue: 148920, units: 2234, margin: 28.8 },
    { day: 'Fri', revenue: 178450, units: 2678, margin: 30.2 },
    { day: 'Sat', revenue: 198760, units: 3012, margin: 31.5 },
    { day: 'Sun', revenue: 167890, units: 2567, margin: 29.8 },
  ];

  const maxValue = Math.max(...dailyData.map((d) => d[selectedMetric]));

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const topPerformers = [...mockProducts].sort((a, b) => b.aiScore - a.aiScore).slice(0, 5);
  const needsAttention = [...mockProducts]
    .filter((p) => p.stockStatus === 'low_stock' || p.stockStatus === 'out_of_stock')
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-primary-500/20">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Analytics Dashboard</h1>
                <p className="text-sm text-white/50">Performance Insights & Trends</p>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link href="/merchandising" className="nav-link">
                Dashboard
              </Link>
              <Link href="/merchandising/planogram" className="nav-link">
                Planograms
              </Link>
              <Link href="/merchandising/analytics" className="nav-link nav-link-active">
                Analytics
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-100 rounded-xl p-1">
                {timeRangeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      timeRange === option.value
                        ? 'bg-primary-500/20 text-primary-400'
                        : 'text-white/50 hover:text-white'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <button className="btn-secondary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Summary Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">Total Revenue</span>
              <span className="text-xs text-relief-400 bg-relief-500/20 px-2 py-0.5 rounded">+12.5%</span>
            </div>
            <p className="text-3xl font-bold text-white">{formatCurrency(mockSalesMetrics.monthlyRevenue)}</p>
            <p className="text-xs text-white/40 mt-2">This month</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">Avg Transaction</span>
              <span className="text-xs text-relief-400 bg-relief-500/20 px-2 py-0.5 rounded">+5.2%</span>
            </div>
            <p className="text-3xl font-bold text-white">${mockSalesMetrics.averageTransactionValue.toFixed(2)}</p>
            <p className="text-xs text-white/40 mt-2">Per customer</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">Conversion Rate</span>
              <span className="text-xs text-rage-400 bg-rage-500/20 px-2 py-0.5 rounded">-2.1%</span>
            </div>
            <p className="text-3xl font-bold text-white">{mockSalesMetrics.conversionRate}%</p>
            <p className="text-xs text-white/40 mt-2">View to purchase</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-white/50">AI Utilization</span>
              <span className="text-xs text-primary-400 bg-primary-500/20 px-2 py-0.5 rounded">Active</span>
            </div>
            <p className="text-3xl font-bold text-white">94%</p>
            <p className="text-xs text-white/40 mt-2">Recommendations followed</p>
          </motion.div>
        </section>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Charts */}
          <div className="col-span-12 lg:col-span-8 space-y-6">
            {/* Revenue Chart */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-white">Performance Trend</h3>
                  <p className="text-sm text-white/50">Last 7 days</p>
                </div>
                <div className="flex items-center gap-2">
                  {(['revenue', 'units', 'margin'] as const).map((metric) => (
                    <button
                      key={metric}
                      onClick={() => setSelectedMetric(metric)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                        selectedMetric === metric
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'bg-surface-100 text-white/50 hover:text-white'
                      }`}
                    >
                      {metric}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-64 flex items-end gap-4">
                {dailyData.map((day, index) => (
                  <div key={day.day} className="flex-1 h-full flex flex-col justify-end">
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day[selectedMetric] / maxValue) * 100}%` }}
                      transition={{ duration: 0.5, delay: index * 0.05 }}
                      className="w-full rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 relative group cursor-pointer"
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg bg-black/90 text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
                        {selectedMetric === 'revenue'
                          ? formatCurrency(day.revenue)
                          : selectedMetric === 'units'
                          ? `${day.units.toLocaleString()} units`
                          : `${day.margin}%`}
                      </div>
                    </motion.div>
                    <span className="text-xs text-white/40 text-center mt-2">{day.day}</span>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-white/5">
                <div>
                  <p className="text-xs text-white/40">Weekly Total</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {formatCurrency(dailyData.reduce((sum, d) => sum + d.revenue, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Total Units</p>
                  <p className="text-lg font-semibold text-white mt-1">
                    {dailyData.reduce((sum, d) => sum + d.units, 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/40">Avg Margin</p>
                  <p className="text-lg font-semibold text-relief-400 mt-1">
                    {(dailyData.reduce((sum, d) => sum + d.margin, 0) / dailyData.length).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Category Performance */}
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Category Performance</h3>
              <div className="space-y-4">
                {mockCategoryStats.slice(0, 6).map((cat, index) => {
                  const maxRevenue = Math.max(...mockCategoryStats.map((c) => c.revenue));
                  const percentage = (cat.revenue / maxRevenue) * 100;

                  return (
                    <motion.div
                      key={cat.category}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white capitalize">{cat.category}</span>
                          <span className="text-xs text-white/40">({cat.productCount} products)</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(cat.revenue)}
                          </span>
                          <span
                            className={`text-xs font-medium ${
                              cat.growth >= 0 ? 'text-relief-400' : 'text-rage-400'
                            }`}
                          >
                            {cat.growth >= 0 ? '+' : ''}{cat.growth}%
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.5, delay: index * 0.05 }}
                          className={`h-full rounded-full ${
                            cat.growth >= 0
                              ? 'bg-gradient-to-r from-relief-600 to-relief-400'
                              : 'bg-gradient-to-r from-longing-600 to-longing-400'
                          }`}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="col-span-12 lg:col-span-4 space-y-6">
            {/* Inventory Status */}
            <InventoryStatus metrics={mockInventoryMetrics} showChart />

            {/* Top Performers */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Top AI Performers</h3>
              <div className="space-y-3">
                {topPerformers.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-surface-50 hover:bg-surface-100 transition-all"
                  >
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary-500/20 text-xs font-bold text-primary-400">
                      {index + 1}
                    </div>
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-surface-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{product.name}</p>
                      <p className="text-xs text-white/40">${product.price.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary-400">{product.aiScore}</p>
                      <p className="text-[10px] text-white/40">AI Score</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Needs Attention */}
            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-2 h-2 rounded-full bg-rage-500 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">Needs Attention</h3>
              </div>
              <div className="space-y-3">
                {needsAttention.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-3 p-2 rounded-lg bg-rage-500/5 border border-rage-500/20"
                  >
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-10 h-10 rounded-lg object-cover bg-surface-200"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white truncate">{product.name}</p>
                      <p className={`text-xs ${
                        product.stockStatus === 'out_of_stock' ? 'text-rage-400' : 'text-longing-400'
                      }`}>
                        {product.stockStatus === 'out_of_stock' ? 'Out of Stock' : 'Low Stock'}
                      </p>
                    </div>
                    <button className="px-2 py-1 text-xs font-medium text-rage-400 bg-rage-500/20 rounded-lg hover:bg-rage-500/30 transition-all">
                      Restock
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
