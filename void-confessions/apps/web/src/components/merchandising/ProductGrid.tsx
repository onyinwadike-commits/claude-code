'use client';

import React from 'react';
import { motion } from 'framer-motion';
import ProductCard from './ProductCard';
import type { ProductGridProps } from '@/types/merchandising';

const gridColsClass: Record<number, string> = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
};

const SkeletonCard: React.FC = () => (
  <div className="glass-card overflow-hidden animate-pulse">
    <div className="aspect-[4/3] bg-surface-200" />
    <div className="p-4">
      <div className="h-3 bg-surface-200 rounded w-1/3 mb-2" />
      <div className="h-4 bg-surface-200 rounded w-3/4 mb-3" />
      <div className="flex items-center justify-between">
        <div className="h-5 bg-surface-200 rounded w-1/4" />
        <div className="h-3 bg-surface-200 rounded w-1/5" />
      </div>
    </div>
  </div>
);

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  columns = 4,
  loading = false,
  onProductSelect,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  if (loading) {
    return (
      <div className={`grid ${gridColsClass[columns]} gap-4`}>
        {Array(columns * 2)
          .fill(null)
          .map((_, i) => (
            <SkeletonCard key={i} />
          ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 flex items-center justify-center">
          <svg className="w-8 h-8 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white/70 mb-2">No Products Found</h3>
        <p className="text-sm text-white/40">
          Try adjusting your filters or search criteria
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid ${gridColsClass[columns]} gap-4`}
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard
            product={product}
            onSelect={onProductSelect}
            showAIScore
            showStock
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default ProductGrid;
