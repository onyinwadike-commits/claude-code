'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VoidBackground } from '@/components/VoidBackground';
import { ConfessionInput } from '@/components/ConfessionInput';
import { ConfessionBubble } from '@/components/ConfessionBubble';
import { useVoidStore } from '@/store/voidStore';
import { useVoidSocket } from '@/hooks/useVoidSocket';
import type { VoidType } from '@void-confessions/core';

const VALID_VOIDS: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];

const VOID_INFO: Record<VoidType, { name: string; icon: string; tagline: string }> = {
  grief: { name: 'Grief', icon: '🌊', tagline: 'Release your sorrow' },
  rage: { name: 'Rage', icon: '🔥', tagline: 'Let your anger burn' },
  guilt: { name: 'Guilt', icon: '🌫️', tagline: 'Confess your regrets' },
  longing: { name: 'Longing', icon: '🍂', tagline: 'Whisper your desires' },
  relief: { name: 'Relief', icon: '🌿', tagline: 'Celebrate your freedom' },
};

interface VoidPageProps {
  params: { type: string };
}

export default function VoidPage({ params }: VoidPageProps) {
  const voidType = params.type as VoidType;

  // Validate void type
  if (!VALID_VOIDS.includes(voidType)) {
    notFound();
  }

  const info = VOID_INFO[voidType];
  const {
    setCurrentVoid,
    confessions,
    weather,
    collectiveCount,
    isConnected,
    removeConfession,
  } = useVoidStore();

  const { submitConfession, resonateConfession, echoConfession } = useVoidSocket(voidType);

  // Set current void on mount
  useEffect(() => {
    setCurrentVoid(voidType);
    return () => setCurrentVoid(null);
  }, [voidType, setCurrentVoid]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <VoidBackground voidType={voidType} weather={weather} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 p-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back</span>
          </Link>

          <div className="flex items-center gap-4">
            {/* Connection status */}
            <div
              className={`flex items-center gap-2 text-sm ${
                isConnected ? 'text-relief-400' : 'text-rage-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-relief-400' : 'bg-rage-400'
                }`}
              />
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>

            {/* Collective count */}
            {collectiveCount > 0 && (
              <div className="text-white/40 text-sm">
                {collectiveCount.toLocaleString()} in the void
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Void info */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fixed top-20 left-0 right-0 z-40 text-center pointer-events-none"
      >
        <span className="text-4xl">{info.icon}</span>
        <h1 className="text-2xl font-bold mt-2">{info.name} Void</h1>
        <p className="text-white/60 text-sm">{info.tagline}</p>
      </motion.div>

      {/* Weather indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed top-20 right-4 z-40 glass-card px-3 py-2 text-sm"
      >
        <span className="text-white/60">Weather: </span>
        <span className="capitalize">{weather.state}</span>
      </motion.div>

      {/* Confession river */}
      <div className="fixed inset-0 z-20 overflow-hidden pointer-events-none">
        {confessions.map((confession) => (
          <div key={confession.id} className="pointer-events-auto">
            <ConfessionBubble
              confession={confession}
              voidType={voidType}
              onResonate={resonateConfession}
              onEcho={echoConfession}
              onRemove={removeConfession}
            />
          </div>
        ))}
      </div>

      {/* Input area */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-8"
      >
        <div className="container mx-auto max-w-2xl">
          <ConfessionInput voidType={voidType} onSubmit={submitConfession} />
        </div>
      </motion.div>
    </main>
  );
}
