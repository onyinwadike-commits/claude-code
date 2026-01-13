'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ConfidenceBadgeProps {
  confidence: number;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ConfidenceBadge({
  confidence,
  showLabel = true,
  size = 'md',
}: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  // Determine color based on confidence level
  const getColorClasses = () => {
    if (percentage >= 80) {
      return {
        bg: 'bg-green-500/20',
        border: 'border-green-500/30',
        text: 'text-green-400',
        glow: 'shadow-[0_0_10px_rgba(34,197,94,0.3)]',
      };
    } else if (percentage >= 60) {
      return {
        bg: 'bg-yellow-500/20',
        border: 'border-yellow-500/30',
        text: 'text-yellow-400',
        glow: 'shadow-[0_0_10px_rgba(234,179,8,0.3)]',
      };
    } else {
      return {
        bg: 'bg-red-500/20',
        border: 'border-red-500/30',
        text: 'text-red-400',
        glow: 'shadow-[0_0_10px_rgba(239,68,68,0.3)]',
      };
    }
  };

  const colors = getColorClasses();

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  const iconSize = {
    sm: 12,
    md: 14,
    lg: 16,
  };

  const Icon = percentage >= 80 ? TrendingUp : percentage >= 60 ? Minus : TrendingDown;

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border ${colors.bg} ${colors.border} ${colors.text} ${colors.glow} ${sizeClasses[size]} font-medium`}
    >
      <Icon size={iconSize[size]} />
      <span>{percentage}%</span>
      {showLabel && <span className="opacity-70">confidence</span>}
    </div>
  );
}

// Simple dot indicator for compact views
export function ConfidenceDot({ confidence }: { confidence: number }) {
  const percentage = Math.round(confidence * 100);

  const colorClass =
    percentage >= 80
      ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
      : percentage >= 60
        ? 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]'
        : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]';

  return (
    <div className={`w-2.5 h-2.5 rounded-full ${colorClass}`} title={`${percentage}% confidence`} />
  );
}

// Progress bar style confidence indicator
export function ConfidenceBar({ confidence, label }: { confidence: number; label?: string }) {
  const percentage = Math.round(confidence * 100);

  const barColor =
    percentage >= 80
      ? 'bg-gradient-to-r from-green-500 to-green-400'
      : percentage >= 60
        ? 'bg-gradient-to-r from-yellow-500 to-yellow-400'
        : 'bg-gradient-to-r from-red-500 to-red-400';

  return (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-1.5 text-sm">
          <span className="text-white/60">{label}</span>
          <span className="text-white font-medium">{percentage}%</span>
        </div>
      )}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${barColor} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
