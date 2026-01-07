'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { VoidBackground } from '@/components/VoidBackground';
import { ConfessionInput } from '@/components/ConfessionInput';
import { ConfessionBubble } from '@/components/ConfessionBubble';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { CollectiveCounter } from '@/components/CollectiveCounter';
import { useVoidStore } from '@/store/voidStore';
import { useVoidSocket } from '@/hooks/useVoidSocket';
import { useDemoMode } from '@/hooks/useDemoMode';
import type { VoidType } from '@void-confessions/core';

const VALID_VOIDS: VoidType[] = ['grief', 'rage', 'guilt', 'longing', 'relief'];

const VOID_INFO: Record<VoidType, { name: string; icon: string; tagline: string }> = {
  grief: { name: 'Grief', icon: '🌊', tagline: 'Release your sorrow into the deep' },
  rage: { name: 'Rage', icon: '🔥', tagline: 'Let your anger burn away' },
  guilt: { name: 'Guilt', icon: '🌫️', tagline: 'Confess and find absolution' },
  longing: { name: 'Longing', icon: '🍂', tagline: 'Whisper your desires to the wind' },
  relief: { name: 'Relief', icon: '🌿', tagline: 'Celebrate your liberation' },
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

  // Determine if we should use demo mode (client-side only)
  const [useDemoModeFlag, setUseDemoModeFlag] = useState(true); // Default to demo mode

  useEffect(() => {
    // Check if we have a backend URL configured
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    const forceDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

    // Use demo mode if explicitly enabled OR if no API URL is configured
    setUseDemoModeFlag(forceDemoMode || !apiUrl);
  }, []);

  const info = VOID_INFO[voidType];
  const {
    setCurrentVoid,
    confessions,
    weather,
    collectiveCount,
    isConnected: storeConnected,
    removeConfession,
  } = useVoidStore();

  // Use demo mode if no backend, otherwise use real socket
  const demoMode = useDemoMode(useDemoModeFlag ? voidType : null);
  const socketMode = useVoidSocket(useDemoModeFlag ? null : voidType);

  // Pick the active mode
  const { submitConfession, resonateConfession, echoConfession } = useDemoModeFlag ? demoMode : socketMode;
  const isDemoMode = useDemoModeFlag;
  const isConnected = useDemoModeFlag ? false : storeConnected;

  // Set current void on mount
  useEffect(() => {
    setCurrentVoid(voidType);
    return () => setCurrentVoid(null);
  }, [voidType, setCurrentVoid]);

  // Sort confessions by creation time for consistent ordering
  const sortedConfessions = useMemo(() => {
    return [...confessions].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }, [confessions]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-void-950">
      {/* Three.js Particle Background */}
      <VoidBackground voidType={voidType} weather={weather} />

      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 z-50">
        <div className="flex items-start justify-between p-4">
          {/* Left side - Back button and Weather */}
          <div className="flex flex-col gap-3">
            {/* Back button */}
            <Link
              href="/"
              className="group flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <motion.div
                whileHover={{ x: -3 }}
                className="flex items-center gap-2"
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
                <span className="text-sm font-medium">Exit Void</span>
              </motion.div>
            </Link>

            {/* Weather Display - Top Left */}
            <WeatherDisplay weather={weather} voidType={voidType} />
          </div>

          {/* Right side - Counter and Connection */}
          <div className="flex flex-col items-end gap-3">
            {/* Connection status */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-center gap-2 text-sm px-3 py-1.5 rounded-full backdrop-blur-sm ${
                isDemoMode
                  ? 'bg-longing-900/30 text-longing-300'
                  : isConnected
                    ? 'bg-relief-900/30 text-relief-300'
                    : 'bg-rage-900/30 text-rage-300'
              }`}
            >
              <motion.span
                className={`w-2 h-2 rounded-full ${
                  isDemoMode
                    ? 'bg-longing-400'
                    : isConnected
                      ? 'bg-relief-400'
                      : 'bg-rage-400'
                }`}
                animate={{
                  scale: isDemoMode ? [1, 1.1, 1] : isConnected ? [1, 1.2, 1] : 1,
                  opacity: isDemoMode ? [0.7, 1, 0.7] : isConnected ? 1 : [1, 0.5, 1],
                }}
                transition={{
                  repeat: Infinity,
                  duration: isDemoMode ? 3 : isConnected ? 2 : 1,
                }}
              />
              <span className="text-xs font-medium">
                {isDemoMode ? 'Demo Mode' : isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </motion.div>

            {/* Collective Counter - Top Right */}
            <CollectiveCounter count={collectiveCount} voidType={voidType} />
          </div>
        </div>
      </header>

      {/* Void Title - Center Top */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="fixed top-20 left-0 right-0 z-40 text-center pointer-events-none"
      >
        <motion.span
          className="text-5xl block mb-2"
          animate={{
            y: [0, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {info.icon}
        </motion.span>
        <h1 className="text-3xl font-bold text-white mb-1">
          The {info.name} Void
        </h1>
        <p className="text-white/50 text-sm">{info.tagline}</p>
      </motion.div>

      {/* Confession River - Full Screen with AnimatePresence */}
      <div className="fixed inset-0 z-20 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {sortedConfessions.map((confession) => (
            <ConfessionBubble
              key={confession.id}
              confession={confession}
              voidType={voidType}
              onResonate={resonateConfession}
              onEcho={echoConfession}
              onRemove={removeConfession}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Gradient overlay at top for fade effect */}
      <div
        className="fixed top-0 left-0 right-0 h-40 z-25 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,10,15,0.9) 0%, transparent 100%)',
        }}
      />

      {/* Gradient overlay at bottom for input area */}
      <div
        className="fixed bottom-0 left-0 right-0 h-60 z-25 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(10,10,15,0.95) 0%, transparent 100%)',
        }}
      />

      {/* Fixed Bottom Input Bar */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, type: 'spring', damping: 20 }}
        className="fixed bottom-0 left-0 right-0 z-30 p-4 pb-6"
      >
        <div className="container mx-auto max-w-2xl">
          <ConfessionInput voidType={voidType} onSubmit={submitConfession} />

          {/* Helper text */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center text-white/30 text-xs mt-3"
          >
            Your confession will drift upward and fade into the void
          </motion.p>
        </div>
      </motion.div>
    </main>
  );
}
