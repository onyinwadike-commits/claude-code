'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, useAnimation } from 'framer-motion';
import type { Confession, VoidType } from '@void-confessions/core';

interface ConfessionBubbleProps {
  confession: Confession;
  voidType: VoidType;
  onResonate?: (id: string) => void;
  onEcho?: (id: string) => void;
  onRemove?: (id: string) => void;
}

const voidColors: Record<VoidType, { bg: string; border: string; glow: string }> = {
  grief: {
    bg: 'bg-grief-900/40',
    border: 'border-grief-600/30',
    glow: 'shadow-grief-500/20',
  },
  rage: {
    bg: 'bg-rage-900/40',
    border: 'border-rage-600/30',
    glow: 'shadow-rage-500/20',
  },
  guilt: {
    bg: 'bg-guilt-900/40',
    border: 'border-guilt-600/30',
    glow: 'shadow-guilt-500/20',
  },
  longing: {
    bg: 'bg-longing-900/40',
    border: 'border-longing-600/30',
    glow: 'shadow-longing-500/20',
  },
  relief: {
    bg: 'bg-relief-900/40',
    border: 'border-relief-600/30',
    glow: 'shadow-relief-500/20',
  },
};

export function ConfessionBubble({
  confession,
  voidType,
  onResonate,
  onEcho,
  onRemove,
}: ConfessionBubbleProps) {
  const controls = useAnimation();
  const [isResonating, setIsResonating] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [hasResonated, setHasResonated] = useState(false);

  const colors = voidColors[voidType];

  // Calculate drift duration based on content length
  const driftDuration = 20 + (confession.content.length / 100) * 10;

  // Start drift animation
  useEffect(() => {
    controls.start({
      y: '-100vh',
      opacity: [1, 1, 0],
      transition: {
        duration: driftDuration,
        ease: 'linear',
      },
    });

    // Remove when animation completes
    const timeout = setTimeout(() => {
      onRemove?.(confession.id);
    }, driftDuration * 1000);

    return () => clearTimeout(timeout);
  }, [controls, driftDuration, confession.id, onRemove]);

  // Long press for resonance
  const handlePressStart = useCallback(() => {
    if (hasResonated) return;

    setIsResonating(true);
    const timer = setTimeout(() => {
      setHasResonated(true);
      onResonate?.(confession.id);
      setIsResonating(false);
    }, 1500);
    setLongPressTimer(timer);
  }, [confession.id, hasResonated, onResonate]);

  const handlePressEnd = useCallback(() => {
    setIsResonating(false);
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  }, [longPressTimer]);

  // Format timestamp
  const timeAgo = formatTimeAgo(confession.createdAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={controls}
      className={`
        absolute left-1/2 bottom-0
        max-w-md w-full px-4
        -translate-x-1/2
      `}
      style={{
        left: `${30 + Math.random() * 40}%`,
      }}
    >
      <motion.div
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd}
        onTouchStart={handlePressStart}
        onTouchEnd={handlePressEnd}
        className={`
          relative p-4 rounded-2xl
          ${colors.bg} ${colors.border}
          backdrop-blur-sm border
          shadow-lg ${isResonating ? colors.glow + ' shadow-xl' : ''}
          cursor-pointer select-none
          transition-shadow duration-300
        `}
        whileHover={{ scale: 1.02 }}
      >
        {/* Resonance progress indicator */}
        {isResonating && (
          <motion.div
            className="absolute inset-0 rounded-2xl overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-1 bg-white/30"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.5, ease: 'linear' }}
              style={{ transformOrigin: 'left' }}
            />
          </motion.div>
        )}

        {/* Content */}
        <p className="text-white/90 text-sm leading-relaxed">{confession.content}</p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-white/40">
          <span>{timeAgo}</span>
          <div className="flex items-center gap-3">
            {confession.resonanceCount > 0 && (
              <span className="flex items-center gap-1">
                <span>💫</span>
                {confession.resonanceCount}
              </span>
            )}
            {confession.echoCount > 0 && (
              <span className="flex items-center gap-1">
                <span>🔊</span>
                {confession.echoCount}
              </span>
            )}
          </div>
        </div>

        {/* Resonance glow effect */}
        {hasResonated && (
          <motion.div
            className="absolute inset-0 rounded-2xl pointer-events-none"
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 1 }}
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            }}
          />
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
