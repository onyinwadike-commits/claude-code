'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VoidType, WeatherState } from '@void-confessions/core';

interface WeatherDisplayProps {
  weather: WeatherState;
  voidType: VoidType;
}

const WEATHER_CONFIG: Record<
  WeatherState['state'],
  { icon: string; label: string; description: string }
> = {
  calm: {
    icon: '🌙',
    label: 'Calm',
    description: 'The void is peaceful',
  },
  stirring: {
    icon: '🌀',
    label: 'Stirring',
    description: 'Something stirs in the depths',
  },
  turbulent: {
    icon: '🌊',
    label: 'Turbulent',
    description: 'Emotions run high',
  },
  storm: {
    icon: '⚡',
    label: 'Storm',
    description: 'A tempest rages',
  },
  rain: {
    icon: '🌧️',
    label: 'Rain',
    description: 'Tears fall from above',
  },
};

const voidStyles: Record<VoidType, { glow: string; bar: string }> = {
  grief: { glow: 'shadow-grief-500/20', bar: 'bg-grief-400' },
  rage: { glow: 'shadow-rage-500/20', bar: 'bg-rage-400' },
  guilt: { glow: 'shadow-guilt-500/20', bar: 'bg-guilt-400' },
  longing: { glow: 'shadow-longing-500/20', bar: 'bg-longing-400' },
  relief: { glow: 'shadow-relief-500/20', bar: 'bg-relief-400' },
};

export function WeatherDisplay({ weather, voidType }: WeatherDisplayProps) {
  const config = WEATHER_CONFIG[weather.state];
  const styles = voidStyles[voidType];

  // Calculate time until next weather change
  const timeUntilChange = useMemo(() => {
    const remaining = weather.nextChange - Date.now();
    if (remaining <= 0) return null;

    const minutes = Math.floor(remaining / 60000);
    if (minutes < 1) return 'Soon';
    if (minutes < 60) return `${minutes}m`;
    return `${Math.floor(minutes / 60)}h`;
  }, [weather.nextChange]);

  // Intensity indicator bars
  const intensityBars = useMemo(() => {
    const count = 5;
    const filled = Math.round(weather.intensity * count);
    return Array.from({ length: count }, (_, i) => i < filled);
  }, [weather.intensity]);

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className={`
        px-4 py-3 min-w-[180px] rounded-xl
        bg-white/[0.03] backdrop-blur-sm
        border border-white/[0.08]
        ${weather.state === 'storm' ? styles.glow + ' shadow-lg border-white/[0.12]' : ''}
        transition-all duration-300
      `}
    >
      {/* Header with icon and label */}
      <div className="flex items-center gap-3">
        <AnimatePresence mode="wait">
          <motion.span
            key={weather.state}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            className="text-2xl"
          >
            {config.icon}
          </motion.span>
        </AnimatePresence>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-white font-medium text-sm">{config.label}</span>
            {weather.state === 'storm' && (
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 0.5, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-rage-400"
              />
            )}
          </div>
          <p className="text-white/40 text-xs">{config.description}</p>
        </div>
      </div>

      {/* Intensity bar */}
      <div className="mt-3 flex items-center gap-2">
        <span className="text-white/30 text-xs font-medium w-14">Intensity</span>
        <div className="flex gap-1">
          {intensityBars.map((filled, i) => (
            <motion.div
              key={i}
              className={`w-3.5 h-1 rounded-full transition-colors ${
                filled ? styles.bar + ' opacity-80' : 'bg-white/10'
              }`}
              animate={
                filled && weather.state === 'storm'
                  ? { opacity: [0.6, 1, 0.6] }
                  : {}
              }
              transition={{
                duration: 0.8,
                delay: i * 0.1,
                repeat: Infinity,
              }}
            />
          ))}
        </div>
      </div>

      {/* Time until change */}
      {timeUntilChange && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-white/25">
          <svg
            className="w-3 h-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Changes in {timeUntilChange}</span>
        </div>
      )}
    </motion.div>
  );
}
