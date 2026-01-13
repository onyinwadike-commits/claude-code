'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import type { ProductCardProps, StockStatus, PriceAction } from '@/types/merchandising';

const stockStatusConfig: Record<StockStatus, { label: string; color: string; bg: string }> = {
  in_stock: { label: 'In Stock', color: 'text-relief-400', bg: 'bg-relief-500/20' },
  low_stock: { label: 'Low Stock', color: 'text-longing-400', bg: 'bg-longing-500/20' },
  out_of_stock: { label: 'Out of Stock', color: 'text-rage-400', bg: 'bg-rage-500/20' },
  overstock: { label: 'Overstock', color: 'text-grief-400', bg: 'bg-grief-500/20' },
};

const priceActionConfig: Record<PriceAction, { label: string; color: string; icon: string }> = {
  rollback: { label: 'Rollback', color: 'text-primary-400', icon: '↓' },
  clearance: { label: 'Clearance', color: 'text-rage-400', icon: '!' },
  regular: { label: '', color: '', icon: '' },
  premium: { label: 'Premium', color: 'text-longing-400', icon: '★' },
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  showAIScore = true,
  showStock = true,
  onSelect,
  variant = 'default',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    cardRef.current.style.setProperty('--spotlight-x', `${x}%`);
    cardRef.current.style.setProperty('--spotlight-y', `${y}%`);
  };

  const stockConfig = stockStatusConfig[product.stockStatus];
  const priceConfig = priceActionConfig[product.priceAction];
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100)
    : 0;

  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-3 cursor-pointer hover:border-white/15 transition-all"
        onClick={() => onSelect?.(product)}
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-surface-100 flex items-center justify-center overflow-hidden">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-product.png';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-sm font-semibold text-primary-400">
                ${product.price.toFixed(2)}
              </span>
              {showStock && (
                <span className={`text-xs ${stockConfig.color}`}>
                  {stockConfig.label}
                </span>
              )}
            </div>
          </div>
          {showAIScore && (
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-surface-200">
              <span className="text-xs font-semibold text-primary-400">{product.aiScore}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  if (variant === 'detailed') {
    return (
      <motion.div
        ref={cardRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="glass-card spotlight overflow-hidden cursor-pointer"
        onClick={() => onSelect?.(product)}
      >
        <div className="relative aspect-square bg-surface-100">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/placeholder-product.png';
            }}
          />
          {hasDiscount && (
            <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-rage-500/90 text-white text-xs font-semibold">
              -{discountPercent}%
            </div>
          )}
          {priceConfig.label && (
            <div className={`absolute top-3 right-3 px-2 py-1 rounded-lg bg-black/50 backdrop-blur ${priceConfig.color} text-xs font-medium`}>
              {priceConfig.icon} {priceConfig.label}
            </div>
          )}
        </div>

        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/50 uppercase tracking-wider mb-1">
                {product.category}
              </p>
              <h3 className="text-lg font-semibold text-white line-clamp-2">{product.name}</h3>
            </div>
            {showAIScore && (
              <div className="flex flex-col items-center">
                <div className="relative w-12 h-12">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="4"
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(product.aiScore / 100) * 125.6} 125.6`}
                      className="text-primary-500 transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">
                    {product.aiScore}
                  </span>
                </div>
                <span className="text-[10px] text-white/40 mt-1">AI Score</span>
              </div>
            )}
          </div>

          <p className="text-sm text-white/60 line-clamp-2 mb-4">{product.description}</p>

          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-2xl font-bold text-white">${product.price.toFixed(2)}</span>
              {hasDiscount && (
                <span className="ml-2 text-sm text-white/40 line-through">
                  ${product.originalPrice!.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className="text-longing-400">★</span>
              <span className="text-sm font-medium text-white">{product.rating.toFixed(1)}</span>
              <span className="text-xs text-white/40">({product.reviewCount})</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {showStock && (
              <div className={`px-2.5 py-1 rounded-lg ${stockConfig.bg}`}>
                <span className={`text-xs font-medium ${stockConfig.color}`}>
                  {stockConfig.label} ({product.stockQuantity})
                </span>
              </div>
            )}
            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>{product.salesVelocity.toFixed(1)}/day</span>
              <span>{product.margin}% margin</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Default variant
  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="glass-card spotlight overflow-hidden cursor-pointer group"
      onClick={() => onSelect?.(product)}
    >
      <div className="relative aspect-[4/3] bg-surface-100 overflow-hidden">
        <motion.img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          animate={{ scale: isHovered ? 1.05 : 1 }}
          transition={{ duration: 0.3 }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-product.png';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

        {hasDiscount && (
          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-rage-500/90 text-white text-xs font-semibold">
            -{discountPercent}%
          </div>
        )}

        {showAIScore && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/50 backdrop-blur text-xs font-medium">
            <span className="text-primary-400">AI:</span>
            <span className="text-white ml-1">{product.aiScore}</span>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-[10px] text-white/40 uppercase tracking-wider mb-1">
          {product.category}
        </p>
        <h3 className="text-sm font-medium text-white line-clamp-1 mb-2">{product.name}</h3>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-bold text-white">${product.price.toFixed(2)}</span>
            {hasDiscount && (
              <span className="ml-1.5 text-xs text-white/40 line-through">
                ${product.originalPrice!.toFixed(2)}
              </span>
            )}
          </div>

          {showStock && (
            <span className={`text-xs ${stockConfig.color}`}>
              {product.stockQuantity} units
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
