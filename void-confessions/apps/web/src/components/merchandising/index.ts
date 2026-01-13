// Visual Merchandising AI Components
// Phase 4 - Walmart Ops

export { ProductCard } from './ProductCard';
export { PlanogramViewer } from './PlanogramViewer';
export { AIRecommendationPanel } from './AIRecommendationPanel';
export { ShelfHeatMap } from './ShelfHeatMap';
export { InventoryStatus } from './InventoryStatus';
export { ProductGrid } from './ProductGrid';
export { ProductCarousel } from './ProductCarousel';
export { CategoryNav } from './CategoryNav';

// Re-export types for convenience
export type {
  Product,
  ProductCategory,
  StockStatus,
  PriceAction,
  AIRecommendation,
  AIRecommendationType,
  Planogram,
  ShelfSlot,
  ShelfPosition,
  HeatMapData,
  HeatMapIntensity,
  InventoryMetrics,
  SalesMetrics,
  CategoryStats,
  MerchandisingStore,
  ProductCardProps,
  PlanogramViewerProps,
  AIRecommendationPanelProps,
  ShelfHeatMapProps,
  InventoryStatusProps,
  ProductGridProps,
  ProductCarouselProps,
  CategoryNavProps,
  DashboardMetric,
} from '@/types/merchandising';
