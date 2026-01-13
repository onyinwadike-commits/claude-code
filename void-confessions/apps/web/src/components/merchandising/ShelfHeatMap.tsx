'use client';

import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import type { ShelfHeatMapProps, HeatMapIntensity, HeatMapData } from '@/types/merchandising';

const intensityColors: Record<HeatMapIntensity, { bg: string; text: string; gradient: string }> = {
  cold: {
    bg: 'bg-grief-600/60',
    text: 'text-grief-300',
    gradient: 'from-grief-700 to-grief-900',
  },
  cool: {
    bg: 'bg-grief-500/60',
    text: 'text-grief-200',
    gradient: 'from-grief-600 to-grief-800',
  },
  warm: {
    bg: 'bg-longing-500/60',
    text: 'text-longing-200',
    gradient: 'from-longing-600 to-longing-800',
  },
  hot: {
    bg: 'bg-longing-400/70',
    text: 'text-longing-100',
    gradient: 'from-longing-500 to-rage-600',
  },
  critical: {
    bg: 'bg-rage-500/80',
    text: 'text-rage-100',
    gradient: 'from-rage-500 to-rage-700',
  },
};

const metricLabels: Record<string, { label: string; unit: string }> = {
  sales: { label: 'Sales Volume', unit: 'units' },
  views: { label: 'Customer Views', unit: 'views' },
  pickups: { label: 'Pick-ups', unit: 'picks' },
  returns: { label: 'Returns', unit: 'returns' },
};

export const ShelfHeatMap: React.FC<ShelfHeatMapProps> = ({
  planogram,
  heatData,
  metric = 'sales',
  showLegend = true,
}) => {
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState(metric);

  const heatDataMap = useMemo(() => {
    const map = new Map<string, HeatMapData>();
    heatData
      .filter((d) => d.metric === selectedMetric)
      .forEach((d) => map.set(d.slotId, d));
    return map;
  }, [heatData, selectedMetric]);

  const maxValue = useMemo(() => {
    return Math.max(...heatData.filter((d) => d.metric === selectedMetric).map((d) => d.value), 1);
  }, [heatData, selectedMetric]);

  const getIntensityFromValue = (value: number): HeatMapIntensity => {
    const ratio = value / maxValue;
    if (ratio >= 0.8) return 'critical';
    if (ratio >= 0.6) return 'hot';
    if (ratio >= 0.4) return 'warm';
    if (ratio >= 0.2) return 'cool';
    return 'cold';
  };

  const stats = useMemo(() => {
    const values = heatData.filter((d) => d.metric === selectedMetric).map((d) => d.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = values.length > 0 ? sum / values.length : 0;
    const max = Math.max(...values, 0);
    const min = Math.min(...values, 0);
    return { sum, avg, max, min };
  }, [heatData, selectedMetric]);

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Shelf Performance Heat Map</h3>
          <p className="text-sm text-white/50">{planogram.name}</p>
        </div>

        {/* Metric selector */}
        <div className="flex items-center gap-2">
          {Object.entries(metricLabels).map(([key, { label }]) => (
            <button
              key={key}
              onClick={() => setSelectedMetric(key as typeof selectedMetric)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedMetric === key
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-surface-100 text-white/50 hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-3 rounded-xl bg-surface-100">
          <p className="text-xs text-white/40">Total</p>
          <p className="text-lg font-semibold text-white">
            {stats.sum.toLocaleString()} {metricLabels[selectedMetric].unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-surface-100">
          <p className="text-xs text-white/40">Average</p>
          <p className="text-lg font-semibold text-primary-400">
            {stats.avg.toFixed(1)} {metricLabels[selectedMetric].unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-surface-100">
          <p className="text-xs text-white/40">Highest</p>
          <p className="text-lg font-semibold text-relief-400">
            {stats.max.toLocaleString()} {metricLabels[selectedMetric].unit}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-surface-100">
          <p className="text-xs text-white/40">Lowest</p>
          <p className="text-lg font-semibold text-rage-400">
            {stats.min.toLocaleString()} {metricLabels[selectedMetric].unit}
          </p>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="relative p-4 rounded-xl bg-surface-50 border border-white/5">
        {/* Row labels */}
        <div className="absolute -left-6 top-4 bottom-4 flex flex-col justify-around text-xs text-white/30 font-mono">
          {Array(planogram.rows)
            .fill(null)
            .map((_, i) => (
              <span key={i}>R{i + 1}</span>
            ))}
        </div>

        {/* Column labels */}
        <div className="flex justify-around mb-2 px-2 text-xs text-white/30 font-mono">
          {Array(planogram.columns)
            .fill(null)
            .map((_, i) => (
              <span key={i}>C{i + 1}</span>
            ))}
        </div>

        {/* Grid */}
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${planogram.columns}, 1fr)`,
            gridTemplateRows: `repeat(${planogram.rows}, minmax(60px, 1fr))`,
          }}
        >
          {planogram.slots.map((slot) => {
            const data = heatDataMap.get(slot.id);
            const intensity = data
              ? getIntensityFromValue(data.value)
              : slot.heatIntensity;
            const colors = intensityColors[intensity];
            const isHovered = hoveredSlot === slot.id;

            return (
              <motion.div
                key={slot.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, zIndex: 10 }}
                onMouseEnter={() => setHoveredSlot(slot.id)}
                onMouseLeave={() => setHoveredSlot(null)}
                className={`
                  relative rounded-lg overflow-hidden cursor-pointer
                  bg-gradient-to-br ${colors.gradient}
                  border border-white/10 hover:border-white/20
                  transition-all duration-200
                `}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                  {slot.product ? (
                    <>
                      <span className="text-xs font-medium text-white/90 text-center line-clamp-1">
                        {slot.product.name.split(' ').slice(0, 2).join(' ')}
                      </span>
                      {data && (
                        <span className={`text-lg font-bold ${colors.text} mt-1`}>
                          {data.value}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-white/30">Empty</span>
                  )}
                </div>

                {/* Tooltip */}
                {isHovered && slot.product && data && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 z-20 p-3 rounded-lg bg-black/90 backdrop-blur border border-white/10 whitespace-nowrap"
                  >
                    <p className="text-xs font-medium text-white">{slot.product.name}</p>
                    <p className="text-sm text-primary-400 mt-1">
                      {data.value.toLocaleString()} {metricLabels[selectedMetric].unit}
                    </p>
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-black/90 border-r border-b border-white/10" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-white/5">
          <span className="text-xs text-white/40">Performance Level:</span>
          {(['cold', 'cool', 'warm', 'hot', 'critical'] as HeatMapIntensity[]).map((intensity) => (
            <div key={intensity} className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded ${intensityColors[intensity].bg}`} />
              <span className="text-xs text-white/50 capitalize">{intensity}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShelfHeatMap;
