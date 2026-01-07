'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { VoidType } from '@void-confessions/core';

interface ConfessionInputProps {
  voidType: VoidType;
  onSubmit: (content: string, releaseStyle?: string) => void;
  maxLength?: number;
  placeholder?: string;
}

const voidAccents: Record<VoidType, { border: string; ring: string; button: string; text: string }> = {
  grief: {
    border: 'focus:border-grief-500/50',
    ring: 'focus:ring-grief-500/20',
    button: 'from-grief-600 to-grief-700 shadow-grief-500/30',
    text: 'text-grief-400',
  },
  rage: {
    border: 'focus:border-rage-500/50',
    ring: 'focus:ring-rage-500/20',
    button: 'from-rage-600 to-rage-700 shadow-rage-500/30',
    text: 'text-rage-400',
  },
  guilt: {
    border: 'focus:border-guilt-500/50',
    ring: 'focus:ring-guilt-500/20',
    button: 'from-guilt-600 to-guilt-700 shadow-guilt-500/30',
    text: 'text-guilt-400',
  },
  longing: {
    border: 'focus:border-longing-500/50',
    ring: 'focus:ring-longing-500/20',
    button: 'from-longing-600 to-longing-700 shadow-longing-500/30',
    text: 'text-longing-400',
  },
  relief: {
    border: 'focus:border-relief-500/50',
    ring: 'focus:ring-relief-500/20',
    button: 'from-relief-600 to-relief-700 shadow-relief-500/30',
    text: 'text-relief-400',
  },
};

const RELEASE_STYLES = [
  { id: 'default', name: 'Fade', icon: '✨', isPremium: false },
  { id: 'burn', name: 'Burn', icon: '🔥', isPremium: true },
  { id: 'shatter', name: 'Shatter', icon: '❄️', isPremium: true },
  { id: 'dissolve', name: 'Dissolve', icon: '💧', isPremium: true },
];

export function ConfessionInput({
  voidType,
  onSubmit,
  maxLength = 5000,
  placeholder = 'What would you like to release into the void?',
}: ConfessionInputProps) {
  const [content, setContent] = useState('');
  const [releaseStyle, setReleaseStyle] = useState('default');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showStyles, setShowStyles] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const accents = voidAccents[voidType];
  const characterCount = content.length;
  const progress = (characterCount / maxLength) * 100;
  const isNearLimit = progress > 80;
  const isAtLimit = progress > 95;

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onSubmit(content.trim(), releaseStyle);
      setContent('');
    } finally {
      setIsSubmitting(false);
    }
  }, [content, releaseStyle, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="glass-card p-5 space-y-4">
      {/* Text Input */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          rows={3}
          className={`
            w-full bg-white/[0.03] rounded-xl p-4
            text-white placeholder-white/30
            border border-white/[0.08]
            ${accents.border} ${accents.ring}
            focus:outline-none focus:ring-2
            focus:bg-white/[0.05]
            resize-none transition-all duration-200
            text-body-md leading-relaxed
          `}
        />

        {/* Character counter */}
        <AnimatePresence>
          {(isFocused || characterCount > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-3 right-3"
            >
              <span
                className={`text-xs font-medium transition-colors ${
                  isAtLimit
                    ? 'text-rage-400'
                    : isNearLimit
                    ? 'text-longing-400'
                    : 'text-white/30'
                }`}
              >
                {characterCount.toLocaleString()}/{maxLength.toLocaleString()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-white/[0.05] rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full transition-colors ${
            isAtLimit
              ? 'bg-rage-500'
              : isNearLimit
              ? 'bg-longing-500'
              : 'bg-primary-500/50'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(progress, 100)}%` }}
          transition={{ duration: 0.2 }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        {/* Release style selector */}
        <div className="relative">
          <button
            onClick={() => setShowStyles(!showStyles)}
            className="
              flex items-center gap-2 px-3 py-2
              bg-white/[0.03] rounded-lg
              text-white/60 hover:text-white
              border border-white/[0.08] hover:border-white/[0.12]
              transition-all text-sm font-medium
            "
          >
            <span>{RELEASE_STYLES.find((s) => s.id === releaseStyle)?.icon}</span>
            <span>{RELEASE_STYLES.find((s) => s.id === releaseStyle)?.name}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform ${showStyles ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <AnimatePresence>
            {showStyles && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="
                  absolute bottom-full left-0 mb-2
                  bg-void-900/95 backdrop-blur-xl rounded-xl p-1.5
                  border border-white/[0.1]
                  shadow-2xl min-w-[150px]
                  z-10
                "
              >
                {RELEASE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      if (!style.isPremium) {
                        setReleaseStyle(style.id);
                      }
                      setShowStyles(false);
                    }}
                    disabled={style.isPremium}
                    className={`
                      w-full flex items-center gap-2.5 px-3 py-2 rounded-lg
                      text-left text-sm transition-all
                      ${
                        releaseStyle === style.id
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }
                      ${style.isPremium ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span className="text-base">{style.icon}</span>
                    <span className="font-medium">{style.name}</span>
                    {style.isPremium && (
                      <span className="ml-auto text-xs bg-primary-500/20 text-primary-300 px-1.5 py-0.5 rounded">
                        PRO
                      </span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Submit button */}
        <motion.button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`
            px-5 py-2.5 rounded-xl font-medium text-sm
            bg-gradient-to-r ${accents.button}
            shadow-lg hover:shadow-xl
            disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none
            text-white transition-all
            flex items-center gap-2
          `}
          whileHover={content.trim() && !isSubmitting ? { scale: 1.02, y: -1 } : {}}
          whileTap={content.trim() && !isSubmitting ? { scale: 0.98 } : {}}
        >
          {isSubmitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="inline-block"
              >
                ⭐
              </motion.span>
              <span>Releasing...</span>
            </>
          ) : (
            <>
              <span>Release</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono text-white/40 bg-white/10 px-1.5 py-0.5 rounded">
                <span>⌘</span>
                <span>↵</span>
              </kbd>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
