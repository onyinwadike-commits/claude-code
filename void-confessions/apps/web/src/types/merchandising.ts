// Visual Merchandising AI Types for Walmart Ops

export type ProductCategory =
  | 'grocery'
  | 'electronics'
  | 'clothing'
  | 'home'
  | 'toys'
  | 'beauty'
  | 'pharmacy'
  | 'automotive'
  | 'garden'
  | 'sports';

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';

export type PriceAction = 'rollback' | 'clearance' | 'regular' | 'premium';

export type AIRecommendationType =
  | 'restock'
  | 'markdown'
  | 'reposition'
  | 'bundle'
  | 'promote'
  | 'discontinue';

export type HeatMapIntensity = 'cold' | 'cool' | 'warm' | 'hot' | 'critical';

export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: ProductCategory;
  price: number;
  originalPrice?: number;
  priceAction: PriceAction;
  stockStatus: StockStatus;
  stockQuantity: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  aiScore: number; // 0-100 AI merchandising score
  salesVelocity: number; // units per day
  margin: number; // profit margin percentage
  lastRestocked?: Date;
  tags: string[];
}

export interface ShelfPosition {
  row: number;
  column: number;
  width: number;
  height: number;
  depth: number;
}

export interface ShelfSlot {
  id: string;
  position: ShelfPosition;
  product: Product | null;
  facings: number; // number of product facings
  heatIntensity: HeatMapIntensity;
  performance: number; // 0-100
}

export interface Planogram {
  id: string;
  name: string;
  aisle: string;
  section: string;
  storeId: string;
  rows: number;
  columns: number;
  slots: ShelfSlot[];
  lastUpdated: Date;
  aiOptimized: boolean;
  performanceScore: number;
}

export interface AIRecommendation {
  id: string;
  type: AIRecommendationType;
  priority: 'low' | 'medium' | 'high' | 'critical';
  productId: string;
  product: Product;
  message: string;
  impact: string;
  estimatedRevenue: number;
  confidence: number; // 0-100
  createdAt: Date;
  expiresAt?: Date;
  actionTaken?: boolean;
}

export interface InventoryMetrics {
  totalProducts: number;
  inStockCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  overstockCount: number;
  turnoverRate: number;
  averageDaysOnShelf: number;
  totalValue: number;
}

export interface SalesMetrics {
  dailyRevenue: number;
  weeklyRevenue: number;
  monthlyRevenue: number;
  averageTransactionValue: number;
  unitsSold: number;
  conversionRate: number;
  topSellingCategory: ProductCategory;
}

export interface HeatMapData {
  slotId: string;
  value: number;
  intensity: HeatMapIntensity;
  metric: 'sales' | 'views' | 'pickups' | 'returns';
}

export interface MerchandisingStore {
  id: string;
  name: string;
  location: string;
  planograms: Planogram[];
  inventory: InventoryMetrics;
  sales: SalesMetrics;
  recommendations: AIRecommendation[];
  lastSync: Date;
}

export interface CategoryStats {
  category: ProductCategory;
  productCount: number;
  revenue: number;
  growth: number; // percentage
  topProduct: Product;
}

// Component Props Types
export interface ProductCardProps {
  product: Product;
  showAIScore?: boolean;
  showStock?: boolean;
  onSelect?: (product: Product) => void;
  variant?: 'default' | 'compact' | 'detailed';
}

export interface PlanogramViewerProps {
  planogram: Planogram;
  showHeatMap?: boolean;
  editable?: boolean;
  onSlotClick?: (slot: ShelfSlot) => void;
  onProductDrop?: (productId: string, slotId: string) => void;
}

export interface AIRecommendationPanelProps {
  recommendations: AIRecommendation[];
  onAction?: (recommendation: AIRecommendation) => void;
  onDismiss?: (recommendationId: string) => void;
  maxItems?: number;
}

export interface ShelfHeatMapProps {
  planogram: Planogram;
  heatData: HeatMapData[];
  metric?: 'sales' | 'views' | 'pickups' | 'returns';
  showLegend?: boolean;
}

export interface InventoryStatusProps {
  metrics: InventoryMetrics;
  showChart?: boolean;
  compact?: boolean;
}

export interface ProductGridProps {
  products: Product[];
  columns?: 2 | 3 | 4 | 5 | 6;
  loading?: boolean;
  onProductSelect?: (product: Product) => void;
}

export interface ProductCarouselProps {
  products: Product[];
  title?: string;
  autoPlay?: boolean;
  interval?: number;
  onProductSelect?: (product: Product) => void;
}

export interface CategoryNavProps {
  categories: CategoryStats[];
  selectedCategory?: ProductCategory;
  onCategorySelect?: (category: ProductCategory) => void;
}

export interface DashboardMetric {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
}
