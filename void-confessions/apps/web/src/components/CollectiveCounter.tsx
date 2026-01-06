'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import type { VoidType } from '@void-confessions/core';

interface CollectiveCounterProps {
  count: number;
  voidType: VoidType;
}

const voidColors: Record<VoidType, { text: string; glow: string }> = {
  grief: { text: 'text-grief-300', glow: 'shadow-grief-500/30' },
  rage: { text: 'text-rage-300', glow: 'shadow-rage-500/30' },
  guilt: { text: 'text-guilt-300', glow: 'shadow-guilt-500/30' },
  longing: { text: 'text-longing-300', glow: 'shadow-longing-500/30' },
  relief: { text: 'text-relief-300', glow: 'shadow-relief-500/30' },
};

export function CollectiveCounter({ count, voidType }: CollectiveCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const prevCountRef = useRef(count);
  const colors = voidColors[voidType];

  // Animated counter
  const springCount = useSpring(count, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useEffect(() => {
    const unsubscribe = springCount.on('change', (latest) => {
      setDisplayCount(Math.round(latest));
    });
    return unsubscribe;
  }, [springCount]);

  // Detect count changes
  useEffect(() => {
    if (count > prevCountRef.current) {
      setIsIncreasing(true);
      setTimeout(() => setIsIncreasing(false), 500);
    }
    prevCountRef.current = count;
    springCount.set(count);
  }, [count, springCount]);

  // Format large numbers
  const formatCount = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
      className={`
        glass-card px-4 py-3
        ${isIncreasing ? colors.glow + ' shadow-lg' : ''}
        transition-shadow duration-300
      `}
    >
      <div className="flex items-center gap-3">
        {/* Pulsing indicator */}
        <div className="relative">
          <motion.div
            className="w-3 h-3 rounded-full bg-white/60"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          {/* Ripple effect on increase */}
          <AnimatePresence>
            {isIncreasing && (
              <motion.div
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 rounded-full bg-white"
              />
            )}
          </AnimatePresence>
        </div>

        {/* Count display */}
        <div className="text-right">
          <div className="flex items-baseline gap-1">
            <motion.span
              key={displayCount}
              initial={isIncreasing ? { y: -10, opacity: 0 } : false}
              animate={{ y: 0, opacity: 1 }}
              className={`text-xl font-bold tabular-nums ${colors.text}`}
            >
              {formatCount(displayCount)}
            </motion.span>

            {/* Increase indicator */}
            <AnimatePresence>
              {isIncreasing && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="text-relief-400 text-xs"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-white/40 text-xs">souls in the void</p>
        </div>
      </div>

      {/* Visual representation of activity */}
      <div className="mt-2 flex gap-0.5 justify-end">
        {Array.from({ length: 12 }).map((_, i) => {
          const isActive = i < Math.min(12, Math.floor(count / 10) + 1);
          return (
            <motion.div
              key={i}
              className={`w-1 rounded-full ${
                isActive ? 'bg-white/40' : 'bg-white/10'
              }`}
              style={{ height: 4 + (isActive ? Math.random() * 8 : 0) }}
              animate={
                isActive
                  ? {
                      height: [4 + Math.random() * 8, 4 + Math.random() * 12, 4 + Math.random() * 8],
                    }
                  : {}
              }
              transition={{
                duration: 1 + Math.random(),
                repeat: Infinity,
                delay: i * 0.1,
              }}
            />
          );
        })}
      </div>
    </motion.div>
  );
}
