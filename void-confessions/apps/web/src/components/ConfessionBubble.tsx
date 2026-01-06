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

const voidColors: Record<VoidType, { bg: string; border: string; glow: string; accent: string }> = {
  grief: {
    bg: 'bg-grief-900/50',
    border: 'border-grief-500/40',
    glow: 'shadow-grief-500/40',
    accent: '#6270f2',
  },
  rage: {
    bg: 'bg-rage-900/50',
    border: 'border-rage-500/40',
    glow: 'shadow-rage-500/40',
    accent: '#f83b3b',
  },
  guilt: {
    bg: 'bg-guilt-900/50',
    border: 'border-guilt-500/40',
    glow: 'shadow-guilt-500/40',
    accent: '#5d7a7c',
  },
  longing: {
    bg: 'bg-longing-900/50',
    border: 'border-longing-500/40',
    glow: 'shadow-longing-500/40',
    accent: '#fe8011',
  },
  relief: {
    bg: 'bg-relief-900/50',
    border: 'border-relief-500/40',
    glow: 'shadow-relief-500/40',
    accent: '#16b26c',
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

  const colors = voidColors[voidType];

  // Calculate drift duration based on content length (10-20 seconds)
  const driftDuration = useMemo(() => {
    const baseDuration = 10;
    const lengthBonus = Math.min((confession.content.length / 500) * 10, 10);
    return baseDuration + lengthBonus;
  }, [confession.content.length]);

  // Random horizontal position (20-80% of screen width)
  const horizontalPosition = useMemo(() => {
    return 20 + Math.random() * 60;
  }, []);

  // Start drift animation
  useEffect(() => {
    animationStartTimeRef.current = Date.now();

    controls.start({
      y: '-100vh',
      opacity: [0, 1, 1, 1, 0],
      transition: {
        y: {
          duration: driftDuration,
          ease: 'linear',
        },
        opacity: {
          duration: driftDuration,
          times: [0, 0.05, 0.7, 0.9, 1],
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
  }, [controls, driftDuration, confession.id, onRemove]);

  // Handle hover pause/resume
  useEffect(() => {
    if (isHovered && !isPaused) {
      // Pause animation
      pausedAtRef.current = Date.now();
      controls.stop();
      setIsPaused(true);
    } else if (!isHovered && isPaused) {
      // Resume animation
      const elapsedBeforePause = pausedAtRef.current - animationStartTimeRef.current;
      const remainingDuration = (driftDuration * 1000 - elapsedBeforePause) / 1000;

      if (remainingDuration > 0) {
        controls.start({
          y: '-100vh',
          opacity: 0,
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

    // Progress indicator
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / 1500, 1);
      setResonanceProgress(progress);
    }, 16);

    // Complete resonance after 1.5s
    longPressTimerRef.current = setTimeout(() => {
      setHasResonated(true);
      setIsResonating(false);
      setShowResonanceFlash(true);
      onResonate?.(confession.id);

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      // Hide flash after animation
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
      initial={{ opacity: 0, y: 100, scale: 0.8 }}
      animate={controls}
      exit={{
        opacity: 0,
        scale: 0.9,
        filter: 'blur(10px)',
        transition: { duration: 0.5 }
      }}
      className="absolute w-full max-w-sm px-4"
      style={{
        left: `${horizontalPosition}%`,
        bottom: '20%',
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
          relative p-4 rounded-2xl
          ${colors.bg} ${colors.border}
          backdrop-blur-md border
          shadow-lg cursor-pointer select-none
          transition-all duration-300
          ${isHovered ? 'scale-105 ' + colors.glow + ' shadow-2xl' : ''}
          ${isResonating ? colors.glow + ' shadow-2xl ring-2 ring-white/20' : ''}
        `}
        animate={{
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Resonance progress ring */}
        {isResonating && (
          <svg
            className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] pointer-events-none"
            style={{ filter: `drop-shadow(0 0 8px ${colors.accent})` }}
          >
            <rect
              x="4"
              y="4"
              width="calc(100% - 8px)"
              height="calc(100% - 8px)"
              rx="16"
              ry="16"
              fill="none"
              stroke={colors.accent}
              strokeWidth="2"
              strokeDasharray={`${resonanceProgress * 100}% 100%`}
              className="transition-all duration-75"
            />
          </svg>
        )}

        {/* Resonance flash effect */}
        <AnimatePresence>
          {showResonanceFlash && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{
                background: `radial-gradient(circle, ${colors.accent}40 0%, transparent 70%)`,
              }}
            />
          )}
        </AnimatePresence>

        {/* Pause indicator */}
        {isHovered && isPaused && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-8 left-1/2 -translate-x-1/2 text-white/60 text-xs flex items-center gap-1"
          >
            <span className="w-2 h-2 bg-white/60 rounded-sm" />
            <span className="w-2 h-2 bg-white/60 rounded-sm" />
            <span className="ml-1">Paused</span>
          </motion.div>
        )}

        {/* Content */}
        <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
          {confession.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-white/50">
          <span>{timeAgo}</span>
          <div className="flex items-center gap-3">
            {(confession.resonanceCount ?? 0) > 0 && (
              <motion.span
                className="flex items-center gap-1"
                initial={false}
                animate={{ scale: hasResonated ? [1, 1.2, 1] : 1 }}
              >
                <span>💫</span>
                <span>{confession.resonanceCount}</span>
              </motion.span>
            )}
            {(confession.echoCount ?? 0) > 0 && (
              <span className="flex items-center gap-1">
                <span>🔊</span>
                <span>{confession.echoCount}</span>
              </span>
            )}
          </div>
        </div>

        {/* Hold instruction on hover */}
        {isHovered && !hasResonated && !isResonating && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs whitespace-nowrap"
          >
            Hold to resonate
          </motion.div>
        )}

        {/* Resonated badge */}
        {hasResonated && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute -top-2 -right-2 w-6 h-6 bg-void-600 rounded-full flex items-center justify-center text-sm"
          >
            💫
          </motion.div>
        )}
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
