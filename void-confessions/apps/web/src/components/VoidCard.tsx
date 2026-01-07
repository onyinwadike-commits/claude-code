'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { VoidType } from '@void-confessions/core';

interface VoidCardProps {
  voidType: VoidType;
  name: string;
  description: string;
  icon: string;
  color: string;
  onClick: () => void;
  isSelected?: boolean;
}

const voidStyles: Record<VoidType, { gradient: string; glow: string; accent: string; iconBg: string }> = {
  grief: {
    gradient: 'from-grief-500/20 via-grief-600/10 to-transparent',
    glow: 'group-hover:shadow-grief-500/20',
    accent: 'text-grief-400',
    iconBg: 'from-grief-500 to-grief-700',
  },
  rage: {
    gradient: 'from-rage-500/20 via-rage-600/10 to-transparent',
    glow: 'group-hover:shadow-rage-500/20',
    accent: 'text-rage-400',
    iconBg: 'from-rage-500 to-rage-700',
  },
  guilt: {
    gradient: 'from-guilt-500/20 via-guilt-600/10 to-transparent',
    glow: 'group-hover:shadow-guilt-500/20',
    accent: 'text-guilt-400',
    iconBg: 'from-guilt-500 to-guilt-700',
  },
  longing: {
    gradient: 'from-longing-500/20 via-longing-600/10 to-transparent',
    glow: 'group-hover:shadow-longing-500/20',
    accent: 'text-longing-400',
    iconBg: 'from-longing-500 to-longing-700',
  },
  relief: {
    gradient: 'from-relief-500/20 via-relief-600/10 to-transparent',
    glow: 'group-hover:shadow-relief-500/20',
    accent: 'text-relief-400',
    iconBg: 'from-relief-500 to-relief-700',
  },
};

export function VoidCard({
  voidType,
  name,
  description,
  icon,
  onClick,
  isSelected = false,
}: VoidCardProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLButtonElement>(null);
  const styles = voidStyles[voidType];

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  return (
    <motion.button
      ref={cardRef}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      className={`
        group relative w-full p-6 rounded-2xl text-left
        bg-white/[0.03] backdrop-blur-sm
        border border-white/[0.08]
        transition-all duration-300
        shadow-lg ${styles.glow} hover:shadow-2xl
        hover:border-white/[0.12] hover:bg-white/[0.05]
        ${isSelected ? 'ring-2 ring-primary-500/50 border-primary-500/30' : ''}
        overflow-hidden
      `}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Spotlight effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}% ${mousePosition.y}%, rgba(255,255,255,0.06), transparent 40%)`,
        }}
      />

      {/* Gradient overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${styles.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

      {/* Content */}
      <div className="relative z-10">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${styles.iconBg} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <span className="text-2xl">{icon}</span>
        </div>

        {/* Text */}
        <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-gradient transition-colors">
          {name}
        </h3>
        <p className="text-sm text-white/50 leading-relaxed group-hover:text-white/60 transition-colors">
          {description}
        </p>

        {/* Arrow */}
        <div className="flex items-center gap-2 mt-5">
          <span className={`text-sm font-medium ${styles.accent}`}>
            Enter void
          </span>
          <motion.svg
            className={`w-4 h-4 ${styles.accent}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ x: 0 }}
            whileHover={{ x: 4 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </motion.svg>
        </div>
      </div>

      {/* Border glow on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${styles.gradient}`} style={{ padding: '1px' }}>
          <div className="w-full h-full rounded-2xl bg-void-950" />
        </div>
      </div>
    </motion.button>
  );
}
