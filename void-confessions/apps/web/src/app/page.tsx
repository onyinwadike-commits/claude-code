'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { VoidCard } from '@/components/VoidCard';
import { VoidBackground } from '@/components/VoidBackground';
import type { VoidType } from '@void-confessions/core';

const VOID_TYPES: {
  type: VoidType;
  name: string;
  description: string;
  icon: string;
}[] = [
  {
    type: 'grief',
    name: 'The Grief Void',
    description: 'A deep ocean of sadness. Release the weight of loss and sorrow.',
    icon: '🌊',
  },
  {
    type: 'rage',
    name: 'The Rage Void',
    description: 'A volcanic inferno. Let your anger burn and transform.',
    icon: '🔥',
  },
  {
    type: 'guilt',
    name: 'The Guilt Void',
    description: 'A murky swamp. Confess your regrets and find absolution.',
    icon: '🌫️',
  },
  {
    type: 'longing',
    name: 'The Longing Void',
    description: 'An autumn wind. Whisper your desires to the universe.',
    icon: '🍂',
  },
  {
    type: 'relief',
    name: 'The Relief Void',
    description: 'A sunlit meadow. Celebrate your release and renewal.',
    icon: '🌿',
  },
];

export default function Home() {
  const [hoveredVoid, setHoveredVoid] = useState<VoidType>('grief');

  return (
    <main className="relative min-h-screen">
      {/* Dynamic background */}
      <VoidBackground voidType={hoveredVoid} />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-24"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-block mb-6"
          >
            <span className="text-6xl">🌌</span>
          </motion.div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="text-gradient from-void-300 to-void-500">
              Release into the Void
            </span>
          </h1>

          <p className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto text-balance">
            An anonymous space to release what weighs on your soul.
            No judgment. No identity. Just catharsis.
          </p>
        </motion.div>

        {/* Void Selection */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="text-center text-white/40 text-sm uppercase tracking-wider mb-8">
            Choose Your Void
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
            {VOID_TYPES.map((void_, index) => (
              <motion.div
                key={void_.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                onMouseEnter={() => setHoveredVoid(void_.type)}
              >
                <Link href={`/void/${void_.type}`}>
                  <VoidCard
                    voidType={void_.type}
                    name={void_.name}
                    description={void_.description}
                    icon={void_.icon}
                    color=""
                    onClick={() => {}}
                  />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="glass-card p-6">
              <div className="text-3xl mb-4">🔒</div>
              <h3 className="font-semibold mb-2">Completely Anonymous</h3>
              <p className="text-sm text-white/60">
                No accounts. No tracking. Your secrets stay in the void.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="text-3xl mb-4">✨</div>
              <h3 className="font-semibold mb-2">Collective Experience</h3>
              <p className="text-sm text-white/60">
                See others' confessions drift by. Resonate with shared feelings.
              </p>
            </div>

            <div className="glass-card p-6">
              <div className="text-3xl mb-4">🎭</div>
              <h3 className="font-semibold mb-2">Voice Anonymization</h3>
              <p className="text-sm text-white/60">
                Premium users can confess by voice, anonymized on-device.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="text-center text-white/30 text-sm mt-16"
        >
          Press and hold on a confession to resonate with it
        </motion.p>
      </div>
    </main>
  );
}
