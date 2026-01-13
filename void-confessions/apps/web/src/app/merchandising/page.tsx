'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ProductGrid,
  ProductCarousel,
  AIRecommendationPanel,
  InventoryStatus,
  CategoryNav,
} from '@/components/merchandising';
import {
  mockProducts,
  generateMockProducts,
  mockRecommendations,
  mockInventoryMetrics,
  mockSalesMetrics,
  mockCategoryStats,
} from '@/lib/mockMerchandisingData';
import type { ProductCategory, Product } from '@/types/merchandising';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, change, icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="glass-card p-5"
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-white/50">{title}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
        {change !== undefined && (
          <div className="flex items-center gap-1 mt-2">
            <span className={change >= 0 ? 'text-relief-400' : 'text-rage-400'}>
              {change >= 0 ? '↑' : '↓'}
            </span>
            <span className={`text-xs ${change >= 0 ? 'text-relief-400' : 'text-rage-400'}`}>
              {Math.abs(change)}% vs last week
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>{icon}</div>
    </div>
  </motion.div>
);

export default function MerchandisingDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | undefined>();
  const [searchQuery, setSearchQuery] = useState('');

  const allProducts = useMemo(() => generateMockProducts(24), []);

  const filteredProducts = useMemo(() => {
    let products = allProducts;
    if (selectedCategory) {
      products = products.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }
    return products;
  }, [allProducts, selectedCategory, searchQuery]);

  const handleProductSelect = (product: Product) => {
    console.log('Selected product:', product);
  };

  const handleRecommendationAction = (recommendation: any) => {
    console.log('Taking action on:', recommendation);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-xl bg-primary-500/20">
                <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Visual Merchandising AI</h1>
                <p className="text-sm text-white/50">Walmart Ops Dashboard</p>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link href="/merchandising" className="nav-link nav-link-active">
                Dashboard
              </Link>
              <Link href="/merchandising/planogram" className="nav-link">
                Planograms
              </Link>
              <Link href="/merchandising/analytics" className="nav-link">
                Analytics
              </Link>
            </nav>

            <div className="flex items-center gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-premium w-64 pl-10"
                />
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Product
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Key Metrics */}
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Today's Revenue"
              value={formatCurrency(mockSalesMetrics.dailyRevenue)}
              change={12.5}
              icon={
                <svg className="w-5 h-5 text-relief-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="bg-relief-500/20"
            />
            <MetricCard
              title="Units Sold"
              value={mockSalesMetrics.unitsSold.toLocaleString()}
              change={8.3}
              icon={
                <svg className="w-5 h-5 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              }
              color="bg-primary-500/20"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${mockSalesMetrics.conversionRate}%`}
              change={-2.1}
              icon={
                <svg className="w-5 h-5 text-longing-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              }
              color="bg-longing-500/20"
            />
            <MetricCard
              title="AI Recommendations"
              value={mockRecommendations.length}
              icon={
                <svg className="w-5 h-5 text-void-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              }
              color="bg-void-500/20"
            />
          </div>
        </section>

        {/* Featured Products Carousel */}
        <section className="mb-8">
          <ProductCarousel
            products={mockProducts}
            title="Featured Products"
            autoPlay
            interval={6000}
            onProductSelect={handleProductSelect}
          />
        </section>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Categories & Inventory */}
          <aside className="col-span-12 lg:col-span-3 space-y-6">
            <CategoryNav
              categories={mockCategoryStats}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
            <InventoryStatus metrics={mockInventoryMetrics} compact />
          </aside>

          {/* Main Content - Products & Recommendations */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Quick Actions */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-white/50">
                    Showing {filteredProducts.length} products
                    {selectedCategory && ` in ${selectedCategory}`}
                  </span>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(undefined)}
                      className="text-xs text-primary-400 hover:text-primary-300"
                    >
                      Clear filter
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-secondary text-sm py-2 px-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </button>
                  <button className="btn-secondary text-sm py-2 px-3">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGrid
              products={filteredProducts}
              columns={3}
              onProductSelect={handleProductSelect}
            />

            {/* AI Recommendations */}
            <AIRecommendationPanel
              recommendations={mockRecommendations}
              onAction={handleRecommendationAction}
              maxItems={4}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
