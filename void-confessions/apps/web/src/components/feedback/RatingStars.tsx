'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { RatingStarsProps } from '@/lib/feedback/types';

const ratingLabels: Record<number, string> = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent',
};

const sizeConfig = {
  sm: { star: 'w-4 h-4', gap: 'gap-1', text: 'text-xs' },
  md: { star: 'w-6 h-6', gap: 'gap-1.5', text: 'text-sm' },
  lg: { star: 'w-8 h-8', gap: 'gap-2', text: 'text-base' },
};

export const RatingStars: React.FC<RatingStarsProps> = ({
  value,
  onChange,
  readonly = false,
  size = 'md',
  showLabel = false,
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);
  const displayValue = hoverValue ?? value;
  const config = sizeConfig[size];

  const handleClick = (rating: number) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(null);
  };

  return (
    <div className="flex items-center gap-3">
      <div className={`flex ${config.gap}`}>
        {[1, 2, 3, 4, 5].map((rating) => {
          const isFilled = rating <= displayValue;
          const isHalf = rating === Math.ceil(displayValue) && displayValue % 1 !== 0;

          return (
            <motion.button
              key={rating}
              type="button"
              onClick={() => handleClick(rating)}
              onMouseEnter={() => handleMouseEnter(rating)}
              onMouseLeave={handleMouseLeave}
              whileHover={!readonly ? { scale: 1.2 } : undefined}
              whileTap={!readonly ? { scale: 0.9 } : undefined}
              className={`${config.star} relative ${
                readonly ? 'cursor-default' : 'cursor-pointer'
              } focus:outline-none`}
              disabled={readonly}
              aria-label={`Rate ${rating} stars`}
            >
              {/* Background star (empty) */}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                className="absolute inset-0 w-full h-full text-white/20"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                />
              </svg>

              {/* Filled star */}
              <motion.svg
                viewBox="0 0 24 24"
                fill="currentColor"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{
                  opacity: isFilled ? 1 : 0,
                  scale: isFilled ? 1 : 0.5,
                }}
                transition={{ duration: 0.2 }}
                className={`absolute inset-0 w-full h-full ${
                  isFilled ? 'text-[#FFC220]' : 'text-transparent'
                }`}
                style={{
                  filter: isFilled ? 'drop-shadow(0 0 4px rgba(255, 194, 32, 0.5))' : 'none',
                }}
              >
                <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
              </motion.svg>
            </motion.button>
          );
        })}
      </div>

      {showLabel && value > 0 && (
        <motion.span
          key={displayValue}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={`${config.text} font-medium text-[#FFC220]`}
        >
          {ratingLabels[Math.round(displayValue)]}
        </motion.span>
      )}
    </div>
  );
};

export default RatingStars;
