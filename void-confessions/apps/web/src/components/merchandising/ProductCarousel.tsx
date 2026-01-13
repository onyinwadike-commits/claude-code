'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ProductCard from './ProductCard';
import type { ProductCarouselProps } from '@/types/merchandising';

export const ProductCarousel: React.FC<ProductCarouselProps> = ({
  products,
  title,
  autoPlay = false,
  interval = 5000,
  onProductSelect,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);

  const itemsPerView = 4; // Number of items visible at once
  const maxIndex = Math.max(0, products.length - itemsPerView);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  }, [maxIndex]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));
  }, [maxIndex]);

  const goToIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  useEffect(() => {
    if (!autoPlay || isPaused || products.length <= itemsPerView) return;

    const timer = setInterval(goToNext, interval);
    return () => clearInterval(timer);
  }, [autoPlay, interval, isPaused, goToNext, products.length]);

  const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerView);

  if (products.length === 0) {
    return null;
  }

  return (
    <div
      className="glass-card p-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        {title && (
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-white/50">{products.length} products</p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            disabled={currentIndex === 0 && !autoPlay}
            className="p-2 rounded-lg bg-surface-100 text-white/50 hover:text-white hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex >= maxIndex && !autoPlay}
            className="p-2 rounded-lg bg-surface-100 text-white/50 hover:text-white hover:bg-surface-200 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div ref={carouselRef} className="relative overflow-hidden">
        <motion.div
          className="flex gap-4"
          animate={{
            x: 0,
          }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
          }}
        >
          <AnimatePresence mode="popLayout" initial={false} custom={direction}>
            {visibleProducts.map((product, index) => (
              <motion.div
                key={product.id}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
                transition={{ duration: 0.3 }}
                className="flex-shrink-0 w-[calc(25%-12px)]"
              >
                <ProductCard
                  product={product}
                  onSelect={onProductSelect}
                  showAIScore
                  showStock
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Pagination dots */}
      {products.length > itemsPerView && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
          {Array(maxIndex + 1)
            .fill(null)
            .map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary-500 w-6'
                    : 'bg-white/20 hover:bg-white/40'
                }`}
              />
            ))}
        </div>
      )}

      {/* Auto-play indicator */}
      {autoPlay && (
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isPaused ? 'bg-longing-500' : 'bg-relief-500 animate-pulse'}`} />
          <span className="text-xs text-white/40">{isPaused ? 'Paused' : 'Auto-playing'}</span>
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
