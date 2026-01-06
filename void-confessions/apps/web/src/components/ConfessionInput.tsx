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

const RELEASE_STYLES = [
  { id: 'default', name: 'Fade', icon: '✨', isPremium: false },
  { id: 'burn', name: 'Burn', icon: '🔥', isPremium: true },
  { id: 'shatter', name: 'Shatter', icon: '❄️', isPremium: true },
  { id: 'scream', name: 'Scream', icon: '💢', isPremium: true },
  { id: 'dissolve', name: 'Dissolve', icon: '💧', isPremium: true },
  { id: 'storm', name: 'Storm', icon: '⚡', isPremium: true },
  { id: 'drift', name: 'Drift', icon: '🍃', isPremium: true },
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

  const characterCount = content.length;
  const progress = (characterCount / maxLength) * 100;

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
    <div className="glass-card p-6 space-y-4">
      {/* Text Input */}
      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={4}
          className="
            w-full bg-void-900/50 rounded-xl p-4
            text-white placeholder-white/40
            border border-void-700/30 focus:border-void-500/50
            focus:outline-none focus:ring-2 focus:ring-void-500/20
            resize-none transition-all
          "
        />

        {/* Character counter */}
        <div className="absolute bottom-3 right-3 text-xs text-white/40">
          <span className={characterCount > maxLength * 0.9 ? 'text-rage-400' : ''}>
            {characterCount}
          </span>
          /{maxLength}
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-void-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${progress > 90 ? 'bg-rage-500' : 'bg-void-500'}`}
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
              bg-void-800/50 rounded-lg
              text-white/70 hover:text-white
              border border-void-700/30 hover:border-void-600/50
              transition-all text-sm
            "
          >
            <span>{RELEASE_STYLES.find((s) => s.id === releaseStyle)?.icon}</span>
            <span>{RELEASE_STYLES.find((s) => s.id === releaseStyle)?.name}</span>
            <svg
              className={`w-4 h-4 transition-transform ${showStyles ? 'rotate-180' : ''}`}
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
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="
                  absolute bottom-full left-0 mb-2
                  bg-void-900 rounded-xl p-2
                  border border-void-700/30
                  shadow-xl min-w-[160px]
                  z-10
                "
              >
                {RELEASE_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => {
                      setReleaseStyle(style.id);
                      setShowStyles(false);
                    }}
                    disabled={style.isPremium}
                    className={`
                      w-full flex items-center gap-2 px-3 py-2 rounded-lg
                      text-left text-sm transition-all
                      ${
                        releaseStyle === style.id
                          ? 'bg-void-700/50 text-white'
                          : 'text-white/70 hover:bg-void-800/50 hover:text-white'
                      }
                      ${style.isPremium ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <span>{style.icon}</span>
                    <span>{style.name}</span>
                    {style.isPremium && (
                      <span className="ml-auto text-xs text-longing-400">PRO</span>
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
          className="
            px-6 py-2.5 rounded-xl font-medium
            bg-void-600 hover:bg-void-500
            disabled:opacity-50 disabled:cursor-not-allowed
            text-white transition-all
            flex items-center gap-2
          "
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isSubmitting ? (
            <>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                ⭐
              </motion.span>
              Releasing...
            </>
          ) : (
            <>
              Release
              <span className="text-white/60 text-xs">(⌘↵)</span>
            </>
          )}
        </motion.button>
      </div>
    </div>
  );
}
