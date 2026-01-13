'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlanogramViewerProps, ShelfSlot, HeatMapIntensity } from '@/types/merchandising';

const heatMapColors: Record<HeatMapIntensity, string> = {
  cold: 'from-grief-600/30 to-grief-800/30',
  cool: 'from-grief-500/40 to-primary-600/40',
  warm: 'from-longing-500/50 to-longing-600/50',
  hot: 'from-longing-400/60 to-rage-500/60',
  critical: 'from-rage-500/70 to-rage-600/70',
};

const heatMapBorders: Record<HeatMapIntensity, string> = {
  cold: 'border-grief-500/30',
  cool: 'border-primary-500/40',
  warm: 'border-longing-500/50',
  hot: 'border-longing-400/60',
  critical: 'border-rage-500/70',
};

interface SlotCardProps {
  slot: ShelfSlot;
  showHeatMap: boolean;
  onSlotClick?: (slot: ShelfSlot) => void;
  isSelected: boolean;
}

const SlotCard: React.FC<SlotCardProps> = ({ slot, showHeatMap, onSlotClick, isSelected }) => {
  const heatGradient = heatMapColors[slot.heatIntensity];
  const heatBorder = heatMapBorders[slot.heatIntensity];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02, zIndex: 10 }}
      onClick={() => onSlotClick?.(slot)}
      className={`
        relative rounded-xl overflow-hidden cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-background' : ''}
        ${showHeatMap ? `bg-gradient-to-br ${heatGradient} ${heatBorder}` : 'bg-surface-100'}
        border border-white/10 hover:border-white/20
      `}
      style={{
        gridColumn: `span ${slot.position.width}`,
        gridRow: `span ${slot.position.height}`,
      }}
    >
      {slot.product ? (
        <div className="h-full p-2 flex flex-col">
          <div className="relative flex-1 bg-surface-200 rounded-lg overflow-hidden mb-2">
            <img
              src={slot.product.imageUrl}
              alt={slot.product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-product.png';
              }}
            />
            {slot.facings > 1 && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/60 backdrop-blur rounded text-[10px] text-white font-medium">
                x{slot.facings}
              </div>
            )}
          </div>
          <div className="min-h-0">
            <p className="text-xs text-white font-medium truncate">{slot.product.name}</p>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-primary-400 font-semibold">
                ${slot.product.price.toFixed(2)}
              </span>
              {showHeatMap && (
                <span className="text-[10px] text-white/50">{slot.performance}%</span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center p-4">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-surface-200 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-white/30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-[10px] text-white/30">Empty Slot</p>
          </div>
        </div>
      )}

      {/* Performance indicator */}
      {showHeatMap && slot.product && (
        <div className="absolute top-1 right-1">
          <div
            className={`w-2 h-2 rounded-full ${
              slot.heatIntensity === 'critical'
                ? 'bg-rage-500 animate-pulse'
                : slot.heatIntensity === 'hot'
                ? 'bg-longing-500'
                : slot.heatIntensity === 'warm'
                ? 'bg-longing-400'
                : slot.heatIntensity === 'cool'
                ? 'bg-primary-500'
                : 'bg-grief-500'
            }`}
          />
        </div>
      )}
    </motion.div>
  );
};

export const PlanogramViewer: React.FC<PlanogramViewerProps> = ({
  planogram,
  showHeatMap = false,
  editable = false,
  onSlotClick,
  onProductDrop,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const gridSlots = useMemo(() => {
    // Create a 2D grid representation
    const grid: (ShelfSlot | null)[][] = Array(planogram.rows)
      .fill(null)
      .map(() => Array(planogram.columns).fill(null));

    planogram.slots.forEach((slot) => {
      const { row, column } = slot.position;
      if (row < planogram.rows && column < planogram.columns) {
        grid[row][column] = slot;
      }
    });

    return grid;
  }, [planogram]);

  const handleSlotClick = (slot: ShelfSlot) => {
    setSelectedSlot(selectedSlot === slot.id ? null : slot.id);
    onSlotClick?.(slot);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!editable) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, slotId: string) => {
    if (!editable) return;
    e.preventDefault();
    setIsDragOver(false);
    const productId = e.dataTransfer.getData('productId');
    if (productId) {
      onProductDrop?.(productId, slotId);
    }
  };

  const performanceStats = useMemo(() => {
    const slotsWithProducts = planogram.slots.filter((s) => s.product);
    const avgPerformance =
      slotsWithProducts.length > 0
        ? slotsWithProducts.reduce((sum, s) => sum + s.performance, 0) / slotsWithProducts.length
        : 0;
    const filledSlots = slotsWithProducts.length;
    const totalSlots = planogram.slots.length;
    const occupancyRate = totalSlots > 0 ? (filledSlots / totalSlots) * 100 : 0;

    return { avgPerformance, filledSlots, totalSlots, occupancyRate };
  }, [planogram]);

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">{planogram.name}</h3>
          <p className="text-sm text-white/50">
            {planogram.aisle} - {planogram.section}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {planogram.aiOptimized && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/20 border border-primary-500/30">
              <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="text-xs font-medium text-primary-400">AI Optimized</span>
            </div>
          )}
          <div className="text-right">
            <p className="text-2xl font-bold text-white">{planogram.performanceScore}</p>
            <p className="text-xs text-white/40">Performance Score</p>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 mb-6 p-4 rounded-xl bg-surface-100">
        <div>
          <p className="text-xs text-white/40">Slots Filled</p>
          <p className="text-lg font-semibold text-white">
            {performanceStats.filledSlots}/{performanceStats.totalSlots}
          </p>
        </div>
        <div>
          <p className="text-xs text-white/40">Occupancy Rate</p>
          <p className="text-lg font-semibold text-relief-400">
            {performanceStats.occupancyRate.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-white/40">Avg Performance</p>
          <p className="text-lg font-semibold text-primary-400">
            {performanceStats.avgPerformance.toFixed(1)}%
          </p>
        </div>
        <div>
          <p className="text-xs text-white/40">Last Updated</p>
          <p className="text-sm font-medium text-white/70">
            {new Date(planogram.lastUpdated).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Heat Map Legend */}
      {showHeatMap && (
        <div className="flex items-center gap-6 mb-4 px-4 py-2 rounded-lg bg-surface-50">
          <span className="text-xs text-white/50">Performance:</span>
          <div className="flex items-center gap-4">
            {(['cold', 'cool', 'warm', 'hot', 'critical'] as HeatMapIntensity[]).map((intensity) => (
              <div key={intensity} className="flex items-center gap-1.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    intensity === 'critical'
                      ? 'bg-rage-500'
                      : intensity === 'hot'
                      ? 'bg-longing-500'
                      : intensity === 'warm'
                      ? 'bg-longing-400'
                      : intensity === 'cool'
                      ? 'bg-primary-500'
                      : 'bg-grief-500'
                  }`}
                />
                <span className="text-[10px] text-white/50 capitalize">{intensity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shelf Grid */}
      <div
        className={`
          relative rounded-xl border-2 border-dashed transition-colors p-4
          ${isDragOver ? 'border-primary-500 bg-primary-500/5' : 'border-white/10'}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {/* Shelf labels */}
        <div className="absolute -left-8 top-0 bottom-0 flex flex-col justify-around text-xs text-white/30">
          {Array(planogram.rows)
            .fill(null)
            .map((_, i) => (
              <span key={i}>R{i + 1}</span>
            ))}
        </div>

        {/* Grid */}
        <div
          className="grid gap-3"
          style={{
            gridTemplateColumns: `repeat(${planogram.columns}, minmax(100px, 1fr))`,
            gridTemplateRows: `repeat(${planogram.rows}, minmax(120px, 1fr))`,
          }}
        >
          <AnimatePresence>
            {planogram.slots.map((slot) => (
              <SlotCard
                key={slot.id}
                slot={slot}
                showHeatMap={showHeatMap}
                onSlotClick={handleSlotClick}
                isSelected={selectedSlot === slot.id}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Slot Details */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            {(() => {
              const slot = planogram.slots.find((s) => s.id === selectedSlot);
              if (!slot?.product) return null;
              return (
                <div className="p-4 rounded-xl bg-surface-100 border border-white/10">
                  <div className="flex items-start gap-4">
                    <img
                      src={slot.product.imageUrl}
                      alt={slot.product.name}
                      className="w-20 h-20 rounded-lg object-cover bg-surface-200"
                    />
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{slot.product.name}</h4>
                      <p className="text-sm text-white/50 mt-1">{slot.product.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-primary-400 font-semibold">
                          ${slot.product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-white/40">
                          SKU: {slot.product.sku}
                        </span>
                        <span className="text-xs text-white/40">
                          {slot.facings} facing{slot.facings > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-white">{slot.performance}%</div>
                      <p className="text-xs text-white/40">Performance</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PlanogramViewer;
