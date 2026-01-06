'use client';

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

const voidGradients: Record<VoidType, string> = {
  grief: 'from-grief-600 to-grief-900',
  rage: 'from-rage-600 to-rage-900',
  guilt: 'from-guilt-600 to-guilt-900',
  longing: 'from-longing-600 to-longing-900',
  relief: 'from-relief-600 to-relief-900',
};

const voidGlows: Record<VoidType, string> = {
  grief: 'hover:shadow-grief-500/30',
  rage: 'hover:shadow-rage-500/30',
  guilt: 'hover:shadow-guilt-500/30',
  longing: 'hover:shadow-longing-500/30',
  relief: 'hover:shadow-relief-500/30',
};

export function VoidCard({
  voidType,
  name,
  description,
  icon,
  onClick,
  isSelected = false,
}: VoidCardProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        relative w-full p-6 rounded-2xl
        bg-gradient-to-br ${voidGradients[voidType]}
        border border-white/10
        shadow-xl ${voidGlows[voidType]} hover:shadow-2xl
        transition-all duration-300
        text-left group overflow-hidden
        ${isSelected ? 'ring-2 ring-white/50' : ''}
      `}
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background glow effect */}
      <motion.div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(circle at center, rgba(255,255,255,0.1) 0%, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div className="text-4xl mb-4">{icon}</div>

      {/* Content */}
      <h3 className="text-xl font-semibold text-white mb-2">{name}</h3>
      <p className="text-white/70 text-sm leading-relaxed">{description}</p>

      {/* Arrow indicator */}
      <motion.div
        className="absolute bottom-6 right-6 text-white/40 group-hover:text-white/80 transition-colors"
        initial={{ x: 0 }}
        whileHover={{ x: 4 }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </motion.div>
    </motion.button>
  );
}
