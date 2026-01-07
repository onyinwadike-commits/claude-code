'use client';

import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { motion, useAnimationControls, AnimatePresence } from 'framer-motion';
import type { Confession, VoidType } from '@void-confessions/core';

interface ConfessionBubbleProps {
  confession: Confession;
  voidType: VoidType;
  onResonate?: (id: string) => void;
  onEcho?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const voidStyles: Record<VoidType, { bg: string; border: string; glow: string; accent: string }> = {
  grief: {
    bg: 'from-grief-900/40 to-grief-950/60',
    border: 'border-grief-500/20',
    glow: 'shadow-grief-500/30',
    accent: '#818cf8',
  },
  rage: {
    bg: 'from-rage-900/40 to-rage-950/60',
    border: 'border-rage-500/20',
    glow: 'shadow-rage-500/30',
    accent: '#fb7185',
  },
  guilt: {
    bg: 'from-guilt-900/40 to-guilt-950/60',
    border: 'border-guilt-500/20',
    glow: 'shadow-guilt-500/30',
    accent: '#2dd4bf',
  },
  longing: {
    bg: 'from-longing-900/40 to-longing-950/60',
    border: 'border-longing-500/20',
    glow: 'shadow-longing-500/30',
    accent: '#fb923c',
  },
  relief: {
    bg: 'from-relief-900/40 to-relief-950/60',
    border: 'border-relief-500/20',
    glow: 'shadow-relief-500/30',
    accent: '#4ade80',
  },
};

export function ConfessionBubble({
  confession,
  voidType,
  onResonate,
  onEcho,
  onRemove,
}: ConfessionBubbleProps) {
  const controls = useAnimationControls();
  const containerRef = useRef<HTMLDivElement>(null);

  // State
  const [isHovered, setIsHovered] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isResonating, setIsResonating] = useState(false);
  const [resonanceProgress, setResonanceProgress] = useState(0);
  const [hasResonated, setHasResonated] = useState(false);
  const [showResonanceFlash, setShowResonanceFlash] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationStartTimeRef = useRef<number>(0);
  const pausedAtRef = useRef<number>(0);

  const styles = voidStyles[voidType];

  // Calculate drift duration based on content length (12-25 seconds)
  const driftDuration = useMemo(() => {
    const baseDuration = 12;
    const lengthBonus = Math.min((confession.content.length / 400) * 13, 13);
    return baseDuration + lengthBonus;
  }, [confession.content.length]);

  // Random horizontal position (15-85% of screen width)
  const horizontalPosition = useMemo(() => {
    return 15 + Math.random() * 70;
  }, []);

  // Random slight horizontal drift
  const horizontalDrift = useMemo(() => {
    return (Math.random() - 0.5) * 10;
  }, []);

  // Start drift animation
  useEffect(() => {
    animationStartTimeRef.current = Date.now();

    controls.start({
      y: '-120vh',
      x: `${horizontalDrift}%`,
      opacity: [0, 1, 1, 1, 0],
      scale: [0.9, 1, 1, 1, 0.95],
      transition: {
        y: {
          duration: driftDuration,
          ease: 'linear',
        },
        x: {
          duration: driftDuration,
          ease: 'easeInOut',
        },
        opacity: {
          duration: driftDuration,
          times: [0, 0.05, 0.7, 0.9, 1],
          ease: 'easeOut',
        },
        scale: {
          duration: driftDuration,
          times: [0, 0.1, 0.8, 0.95, 1],
          ease: 'easeOut',
        },
      },
    });

    // Remove when animation completes
    const timeout = setTimeout(() => {
      onRemove?.(confession.id);
    }, driftDuration * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [controls, driftDuration, horizontalDrift, confession.id, onRemove]);

  // Handle hover pause/resume
  useEffect(() => {
    if (isHovered && !isPaused) {
      pausedAtRef.current = Date.now();
      controls.stop();
      setIsPaused(true);
    } else if (!isHovered && isPaused) {
      const elapsedBeforePause = pausedAtRef.current - animationStartTimeRef.current;
      const remainingDuration = (driftDuration * 1000 - elapsedBeforePause) / 1000;

      if (remainingDuration > 0) {
        controls.start({
          y: '-120vh',
          opacity: 0,
          scale: 0.95,
          transition: {
            y: {
              duration: remainingDuration,
              ease: 'linear',
            },
            opacity: {
              duration: Math.min(remainingDuration, 2),
              delay: Math.max(0, remainingDuration - 2),
              ease: 'easeOut',
            },
            scale: {
              duration: Math.min(remainingDuration, 2),
              delay: Math.max(0, remainingDuration - 2),
              ease: 'easeOut',
            },
          },
        });
      }
      setIsPaused(false);
    }
  }, [isHovered, isPaused, controls, driftDuration]);

  // Long press for resonance (1.5 seconds)
  const handlePressStart = useCallback(() => {
    if (hasResonated) return;

    setIsResonating(true);
    setResonanceProgress(0);

    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 1500, 1);
      setResonanceProgress(progress);
    }, 16);

    longPressTimerRef.current = setTimeout(() => {
      setHasResonated(true);
      setIsResonating(false);
      setShowResonanceFlash(true);
      onResonate?.(confession.id);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      setTimeout(() => setShowResonanceFlash(false), 600);
    }, 1500);
  }, [confession.id, hasResonated, onResonate]);

  const handlePressEnd = useCallback(() => {
    setIsResonating(false);
    setResonanceProgress(0);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  const timeAgo = formatTimeAgo(confession.createdAt);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={controls}
      exit={{
        opacity: 0,
        scale: 0.9,
        filter: 'blur(8px)',
        transition: { duration: 0.4 },
      }}
      className="absolute w-full max-w-sm px-4"
      style={{
        left: `${horizontalPosition}%`,
        bottom: '15%',
        transform: 'translateX(-50%)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        handlePressEnd();
      }}
    >
      <motion.div
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        className={`
          relative p-5 rounded-2xl
          bg-gradient-to-br ${styles.bg}
          ${styles.border}
          backdrop-blur-xl border
          shadow-xl cursor-pointer select-none
          transition-all duration-300
          ${isHovered ? 'scale-[1.02] ' + styles.glow + ' shadow-2xl border-white/[0.15]' : ''}
          ${isResonating ? styles.glow + ' shadow-2xl ring-1 ring-white/20' : ''}
        `}
      >
        {/* Glass highlight */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.08] to-transparent pointer-events-none" />

        {/* Resonance progress ring */}
        {isResonating && (
          <svg
            className="absolute -inset-0.5 w-[calc(100%+4px)] h-[calc(100%+4px)] pointer-events-none"
            style={{ filter: `drop-shadow(0 0 6px ${styles.accent})` }}
          >
            <rect
              x="2"
              y="2"
              width="calc(100% - 4px)"
              height="calc(100% - 4px)"
              rx="16"
              ry="16"
              fill="none"
              stroke={styles.accent}
              strokeWidth="2"
              strokeDasharray={`${resonanceProgress * 100}% 100%`}
              className="transition-all duration-75"
              style={{ opacity: 0.8 }}
            />
          </svg>
        )}

        {/* Resonance flash effect */}
        <AnimatePresence>
          {showResonanceFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.1 }}
              exit={{ opacity: 0, scale: 1.3 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${styles.accent}30 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Pause indicator */}
        <AnimatePresence>
          {isHovered && isPaused && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute -top-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-white/50 text-xs font-medium"
            >
              <div className="flex gap-0.5">
                <span className="w-1 h-3 bg-white/50 rounded-sm" />
                <span className="w-1 h-3 bg-white/50 rounded-sm" />
              </div>
              <span>Paused</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <p className="relative text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
          {confession.content}
        </p>

        {/* Footer */}
        <div className="relative flex items-center justify-between mt-4 text-xs text-white/40">
          <span>{timeAgo}</span>
          <div className="flex items-center gap-3">
            {(confession.resonanceCount ?? 0) > 0 && (
              <motion.span
                className="flex items-center gap-1"
                initial={false}
                animate={{ scale: hasResonated ? [1, 1.2, 1] : 1 }}
              >
                <span>💫</span>
                <span className="font-medium">{confession.resonanceCount}</span>
              </motion.span>
            )}
            {(confession.echoCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <span>🔊</span>
                <span className="font-medium">{confession.echoCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Hold instruction on hover */}
        <AnimatePresence>
          {isHovered && !hasResonated && !isResonating && (
            <motion.div
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 3 }}
              className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-white/40 text-xs whitespace-nowrap font-medium"
            >
              Hold to resonate
            </motion.div>
          )}
        </AnimatePresence>

        {/* Resonated badge */}
        <AnimatePresence>
          {hasResonated && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute -top-2 -right-2 w-7 h-7 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-sm shadow-lg"
            >
              💫
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

function formatTimeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
