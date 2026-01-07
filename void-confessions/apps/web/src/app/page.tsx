'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
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
    name: 'Grief',
    description: 'Release the weight of loss into the infinite depth.',
    icon: '🌊',
  },
  {
    type: 'rage',
    name: 'Rage',
    description: 'Let your anger burn and transform into liberation.',
    icon: '🔥',
  },
  {
    type: 'guilt',
    name: 'Guilt',
    description: 'Confess your regrets and find absolution in the void.',
    icon: '🌫️',
  },
  {
    type: 'longing',
    name: 'Longing',
    description: 'Whisper your desires to the eternal darkness.',
    icon: '🍂',
  },
  {
    type: 'relief',
    name: 'Relief',
    description: 'Celebrate your release and step into renewal.',
    icon: '🌿',
  },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    title: 'Anonymous',
    description: 'No accounts, no tracking. Your secrets stay in the void.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: 'Collective',
    description: 'See others\' confessions drift by. Resonate with shared feelings.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Cathartic',
    description: 'Watch your words dissolve into nothingness. Feel the release.',
  },
];

export default function Home() {
  const [hoveredVoid, setHoveredVoid] = useState<VoidType>('grief');
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <main className="relative min-h-screen noise-overlay">
      {/* Dynamic background */}
      <VoidBackground voidType={hoveredVoid} />

      {/* Gradient overlays */}
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none z-[1]" />
      <div className="fixed inset-0 bg-gradient-radial from-primary-950/20 via-transparent to-transparent pointer-events-none z-[1]" />

      {/* Navigation */}
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm shadow-primary-500/30">
                <span className="text-xl">🌌</span>
              </div>
              <span className="text-lg font-semibold text-white">
                Void<span className="text-primary-400">Confessions</span>
              </span>
            </Link>

            {/* Nav links */}
            <div className="hidden md:flex items-center gap-1">
              <Link href="#voids" className="nav-link">Voids</Link>
              <Link href="#how-it-works" className="nav-link">How it works</Link>
              <a href="https://github.com" target="_blank" rel="noopener" className="nav-link">GitHub</a>
            </div>

            {/* CTA */}
            <Link
              href="/void/grief"
              className="btn-primary text-sm"
            >
              Enter the Void
            </Link>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <span className="badge badge-primary">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse" />
              Anonymous & Cathartic
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-display-xl md:text-display-2xl text-gradient mb-6"
          >
            Release into
            <br />
            <span className="text-gradient-primary">the Void</span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-body-xl text-white/50 max-w-2xl mx-auto mb-12 text-balance"
          >
            An anonymous space to release what weighs on your soul.
            No judgment. No identity. Just catharsis.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/void/grief" className="btn-primary text-base px-8 py-4">
              Start Confessing
              <svg className="w-5 h-5 ml-2 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <a href="#how-it-works" className="btn-secondary text-base px-8 py-4">
              Learn More
            </a>
          </motion.div>

          {/* Scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ opacity }}
            className="absolute bottom-12 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-6 h-10 rounded-full border-2 border-white/20 flex items-start justify-center p-2"
            >
              <motion.div className="w-1 h-2 bg-white/40 rounded-full" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Void Selection Section */}
      <section id="voids" className="relative z-10 py-32 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-label text-primary-400 uppercase tracking-wider mb-4 block">
              Choose Your Void
            </span>
            <h2 className="text-display-md text-gradient mb-4">
              Five paths to release
            </h2>
            <p className="text-body-lg text-white/50 max-w-xl mx-auto">
              Each void resonates with different emotions. Find the one that calls to you.
            </p>
          </motion.div>

          {/* Void cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {VOID_TYPES.map((void_, index) => (
              <motion.div
                key={void_.type}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
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
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="relative z-10 py-32 px-6">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-label text-primary-400 uppercase tracking-wider mb-4 block">
              How It Works
            </span>
            <h2 className="text-display-md text-gradient mb-4">
              Simple. Safe. Cathartic.
            </h2>
          </motion.div>

          {/* Features grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {FEATURES.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-8 text-center group"
              >
                <div className="w-14 h-14 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500/20 to-primary-600/10 border border-primary-500/20 flex items-center justify-center text-primary-400 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-body-sm text-white/50">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-32 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="glass-card p-12 md:p-16 text-center gradient-border">
            <h2 className="text-display-md text-gradient mb-4">
              Ready to release?
            </h2>
            <p className="text-body-lg text-white/50 mb-8 max-w-lg mx-auto">
              Your confessions are anonymous and ephemeral. They drift away into the void, carrying your burdens with them.
            </p>
            <Link href="/void/grief" className="btn-primary text-base px-8 py-4 inline-flex items-center gap-2">
              Enter the Void
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <span className="text-xl">🌌</span>
              <span className="text-sm text-white/40">
                VoidConfessions — Release what weighs on your soul
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-white/40">
              <span>Built with catharsis in mind</span>
              <span className="text-white/20">•</span>
              <span>Anonymous & Ephemeral</span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
