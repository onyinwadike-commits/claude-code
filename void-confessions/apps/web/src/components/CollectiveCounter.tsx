'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import type { VoidType } from '@void-confessions/core';

interface CollectiveCounterProps {
  count: number;
  voidType: VoidType;
}

const voidStyles: Record<VoidType, { text: string; glow: string; bar: string }> = {
  grief: { text: 'text-grief-300', glow: 'shadow-grief-500/20', bar: 'bg-grief-400' },
  rage: { text: 'text-rage-300', glow: 'shadow-rage-500/20', bar: 'bg-rage-400' },
  guilt: { text: 'text-guilt-300', glow: 'shadow-guilt-500/20', bar: 'bg-guilt-400' },
  longing: { text: 'text-longing-300', glow: 'shadow-longing-500/20', bar: 'bg-longing-400' },
  relief: { text: 'text-relief-300', glow: 'shadow-relief-500/20', bar: 'bg-relief-400' },
};

export function CollectiveCounter({ count, voidType }: CollectiveCounterProps) {
  const [displayCount, setDisplayCount] = useState(count);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const prevCountRef = useRef(count);
  const styles = voidStyles[voidType];

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
        px-4 py-3 rounded-xl
        bg-white/[0.03] backdrop-blur-sm
        border border-white/[0.08]
        ${isIncreasing ? styles.glow + ' shadow-lg border-white/[0.12]' : ''}
        transition-all duration-300
      `}
    >
      <div className="flex items-center gap-3">
        {/* Pulsing indicator */}
        <div className="relative">
          <motion.div
            className={`w-2.5 h-2.5 rounded-full ${styles.bar} opacity-70`}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.8, 0.5],
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
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 3, opacity: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute inset-0 rounded-full ${styles.bar}`}
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
              className={`text-lg font-semibold tabular-nums ${styles.text}`}
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
                  className="text-relief-400 text-xs font-medium"
                >
                  +1
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <p className="text-white/35 text-xs font-medium">souls in the void</p>
        </div>
      </div>

      {/* Visual representation of activity */}
      <div className="mt-2 flex gap-0.5 justify-end">
        {Array.from({ length: 10 }).map((_, i) => {
          const isActive = i < Math.min(10, Math.floor(count / 10) + 1);
          return (
            <motion.div
              key={i}
              className={`w-0.5 rounded-full transition-colors ${
                isActive ? styles.bar + ' opacity-50' : 'bg-white/10'
              }`}
              style={{ height: 3 + (isActive ? Math.random() * 6 : 0) }}
              animate={
                isActive
                  ? {
                      height: [3 + Math.random() * 6, 3 + Math.random() * 10, 3 + Math.random() * 6],
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
