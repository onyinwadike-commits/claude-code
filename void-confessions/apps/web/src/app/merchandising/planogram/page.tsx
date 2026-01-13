'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { PlanogramViewer, ShelfHeatMap, ProductCard } from '@/components/merchandising';
import {
  mockPlanogram,
  mockHeatMapData,
  generateHeatMapData,
  mockProducts,
} from '@/lib/mockMerchandisingData';
import type { ShelfSlot, Planogram } from '@/types/merchandising';

// Generate additional planograms for the sidebar
const additionalPlanograms: Partial<Planogram>[] = [
  { id: 'plan-1', name: 'Snacks & Chips', aisle: 'Aisle 3', section: 'Section B', performanceScore: 85 },
  { id: 'plan-2', name: 'Dairy & Refrigerated', aisle: 'Aisle 1', section: 'Section A', performanceScore: 72 },
  { id: 'plan-3', name: 'Cleaning Supplies', aisle: 'Aisle 12', section: 'Section C', performanceScore: 91 },
  { id: 'plan-4', name: 'Pet Food', aisle: 'Aisle 15', section: 'Section A', performanceScore: 68 },
  { id: 'plan-5', name: 'Baby Products', aisle: 'Aisle 8', section: 'Section B', performanceScore: 79 },
];

export default function PlanogramPage() {
  const [selectedPlanogram, setSelectedPlanogram] = useState(mockPlanogram);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<ShelfSlot | null>(null);
  const [viewMode, setViewMode] = useState<'planogram' | 'heatmap'>('planogram');

  const allHeatMapData = [
    ...generateHeatMapData(mockPlanogram, 'sales'),
    ...generateHeatMapData(mockPlanogram, 'views'),
    ...generateHeatMapData(mockPlanogram, 'pickups'),
    ...generateHeatMapData(mockPlanogram, 'returns'),
  ];

  const handleSlotClick = (slot: ShelfSlot) => {
    setSelectedSlot(slot);
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Planogram Management</h1>
                <p className="text-sm text-white/50">AI-Optimized Shelf Layouts</p>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link href="/merchandising" className="nav-link">
                Dashboard
              </Link>
              <Link href="/merchandising/planogram" className="nav-link nav-link-active">
                Planograms
              </Link>
              <Link href="/merchandising/analytics" className="nav-link">
                Analytics
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="flex items-center bg-surface-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('planogram')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'planogram'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Layout View
                </button>
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    viewMode === 'heatmap'
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'text-white/50 hover:text-white'
                  }`}
                >
                  Heat Map
                </button>
              </div>
              <button className="btn-primary flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Planogram
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* Planogram List Sidebar */}
          <aside className="col-span-12 lg:col-span-3 space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">Planograms</h3>
                <span className="text-xs text-white/40">{additionalPlanograms.length + 1} total</span>
              </div>

              <div className="space-y-2">
                {/* Current planogram */}
                <motion.button
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedPlanogram(mockPlanogram)}
                  className={`w-full p-3 rounded-xl text-left transition-all ${
                    selectedPlanogram.id === mockPlanogram.id
                      ? 'bg-primary-500/20 border border-primary-500/30'
                      : 'bg-surface-50 hover:bg-surface-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{mockPlanogram.name}</p>
                      <p className="text-xs text-white/40 mt-0.5">{mockPlanogram.aisle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary-400">{mockPlanogram.performanceScore}</p>
                      <p className="text-[10px] text-white/40">Score</p>
                    </div>
                  </div>
                </motion.button>

                {/* Other planograms */}
                {additionalPlanograms.map((plan) => (
                  <motion.button
                    key={plan.id}
                    whileHover={{ x: 4 }}
                    className="w-full p-3 rounded-xl text-left bg-surface-50 hover:bg-surface-100 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/70">{plan.name}</p>
                        <p className="text-xs text-white/40 mt-0.5">{plan.aisle}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-white/50">{plan.performanceScore}</p>
                        <p className="text-[10px] text-white/40">Score</p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Quick Stats */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Total Slots</span>
                  <span className="text-sm font-medium text-white">{selectedPlanogram.slots.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Filled Slots</span>
                  <span className="text-sm font-medium text-relief-400">
                    {selectedPlanogram.slots.filter((s) => s.product).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">Empty Slots</span>
                  <span className="text-sm font-medium text-longing-400">
                    {selectedPlanogram.slots.filter((s) => !s.product).length}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-white/50">AI Optimized</span>
                  <span className={`text-sm font-medium ${selectedPlanogram.aiOptimized ? 'text-relief-400' : 'text-white/40'}`}>
                    {selectedPlanogram.aiOptimized ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Available Products */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-semibold text-white mb-4">Available Products</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                {mockProducts.slice(0, 5).map((product) => (
                  <div
                    key={product.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('productId', product.id)}
                    className="p-2 rounded-lg bg-surface-100 cursor-grab hover:bg-surface-200 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover bg-surface-200"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-white/40">${product.price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {viewMode === 'planogram' ? (
              <PlanogramViewer
                planogram={selectedPlanogram}
                showHeatMap={showHeatMap}
                editable
                onSlotClick={handleSlotClick}
              />
            ) : (
              <ShelfHeatMap
                planogram={selectedPlanogram}
                heatData={allHeatMapData}
                showLegend
              />
            )}

            {/* Selected Slot Details */}
            {selectedSlot && selectedSlot.product && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Slot Details</h3>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="p-2 rounded-lg bg-surface-100 text-white/50 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <ProductCard product={selectedSlot.product} variant="detailed" />
                  </div>
                  <div className="col-span-2 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-surface-100">
                        <p className="text-xs text-white/40">Position</p>
                        <p className="text-lg font-semibold text-white mt-1">
                          R{selectedSlot.position.row + 1}, C{selectedSlot.position.column + 1}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-100">
                        <p className="text-xs text-white/40">Facings</p>
                        <p className="text-lg font-semibold text-primary-400 mt-1">
                          {selectedSlot.facings}
                        </p>
                      </div>
                      <div className="p-4 rounded-xl bg-surface-100">
                        <p className="text-xs text-white/40">Performance</p>
                        <p className="text-lg font-semibold text-relief-400 mt-1">
                          {selectedSlot.performance}%
                        </p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-surface-100">
                      <p className="text-xs text-white/40 mb-2">AI Insights</p>
                      <ul className="space-y-2 text-sm text-white/70">
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-relief-500" />
                          Product performs 23% above average for this slot type
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                          Consider increasing facings to 3 for optimal visibility
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-longing-500" />
                          Cross-sell opportunity with adjacent products
                        </li>
                      </ul>
                    </div>

                    <div className="flex items-center gap-3">
                      <button className="btn-primary flex-1">Optimize Slot</button>
                      <button className="btn-secondary">Replace Product</button>
                      <button className="btn-secondary">View History</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
