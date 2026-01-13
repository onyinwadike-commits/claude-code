// Mock data for Visual Merchandising AI Components
import type {
  Product,
  Planogram,
  ShelfSlot,
  AIRecommendation,
  InventoryMetrics,
  SalesMetrics,
  CategoryStats,
  HeatMapData,
  ProductCategory,
} from '@/types/merchandising';

// Helper to generate random ID
const generateId = () => Math.random().toString(36).substring(2, 11);

// Mock Products
export const mockProducts: Product[] = [
  {
    id: generateId(),
    sku: 'WMT-001234',
    name: 'Great Value Whole Milk 1 Gallon',
    description: 'Fresh whole milk from local farms. Rich and creamy taste perfect for the whole family.',
    category: 'grocery',
    price: 3.48,
    originalPrice: 3.98,
    priceAction: 'rollback',
    stockStatus: 'in_stock',
    stockQuantity: 156,
    imageUrl: 'https://picsum.photos/seed/milk/400/400',
    rating: 4.5,
    reviewCount: 2341,
    aiScore: 92,
    salesVelocity: 45.2,
    margin: 18,
    tags: ['dairy', 'essential', 'family-size'],
  },
  {
    id: generateId(),
    sku: 'WMT-001235',
    name: 'Coca-Cola Classic 12-Pack',
    description: '12 cans of the original taste. Perfect for parties and gatherings.',
    category: 'grocery',
    price: 5.98,
    priceAction: 'regular',
    stockStatus: 'low_stock',
    stockQuantity: 23,
    imageUrl: 'https://picsum.photos/seed/cola/400/400',
    rating: 4.8,
    reviewCount: 5678,
    aiScore: 88,
    salesVelocity: 67.3,
    margin: 22,
    tags: ['beverages', 'popular', 'party'],
  },
  {
    id: generateId(),
    sku: 'WMT-002341',
    name: 'Samsung 55" 4K Smart TV',
    description: 'Crystal UHD display with smart features. Stream your favorite content in stunning quality.',
    category: 'electronics',
    price: 347.99,
    originalPrice: 449.99,
    priceAction: 'clearance',
    stockStatus: 'in_stock',
    stockQuantity: 12,
    imageUrl: 'https://picsum.photos/seed/tv/400/400',
    rating: 4.6,
    reviewCount: 892,
    aiScore: 95,
    salesVelocity: 2.8,
    margin: 15,
    tags: ['electronics', 'smart-home', 'entertainment'],
  },
  {
    id: generateId(),
    sku: 'WMT-003456',
    name: 'Tide Pods Laundry Detergent 42ct',
    description: '3-in-1 laundry solution. Cleans, brightens, and protects colors.',
    category: 'home',
    price: 12.97,
    priceAction: 'regular',
    stockStatus: 'in_stock',
    stockQuantity: 89,
    imageUrl: 'https://picsum.photos/seed/tide/400/400',
    rating: 4.7,
    reviewCount: 3456,
    aiScore: 85,
    salesVelocity: 34.1,
    margin: 28,
    tags: ['cleaning', 'laundry', 'household'],
  },
  {
    id: generateId(),
    sku: 'WMT-004567',
    name: 'Onn. Wireless Earbuds',
    description: 'True wireless earbuds with charging case. Up to 20 hours of total playtime.',
    category: 'electronics',
    price: 19.88,
    priceAction: 'regular',
    stockStatus: 'out_of_stock',
    stockQuantity: 0,
    imageUrl: 'https://picsum.photos/seed/earbuds/400/400',
    rating: 3.9,
    reviewCount: 1234,
    aiScore: 72,
    salesVelocity: 28.5,
    margin: 45,
    tags: ['audio', 'wireless', 'budget'],
  },
  {
    id: generateId(),
    sku: 'WMT-005678',
    name: 'Athletic Works Yoga Mat',
    description: 'Extra thick 15mm cushioning. Non-slip surface for all yoga practices.',
    category: 'sports',
    price: 14.97,
    priceAction: 'regular',
    stockStatus: 'overstock',
    stockQuantity: 234,
    imageUrl: 'https://picsum.photos/seed/yoga/400/400',
    rating: 4.2,
    reviewCount: 567,
    aiScore: 65,
    salesVelocity: 8.2,
    margin: 52,
    tags: ['fitness', 'yoga', 'exercise'],
  },
  {
    id: generateId(),
    sku: 'WMT-006789',
    name: 'L\'Oreal Paris Mascara',
    description: 'Voluminous lash paradise mascara. Dramatic volume and length.',
    category: 'beauty',
    price: 9.97,
    priceAction: 'regular',
    stockStatus: 'in_stock',
    stockQuantity: 67,
    imageUrl: 'https://picsum.photos/seed/mascara/400/400',
    rating: 4.4,
    reviewCount: 2890,
    aiScore: 81,
    salesVelocity: 42.3,
    margin: 38,
    tags: ['cosmetics', 'makeup', 'popular'],
  },
  {
    id: generateId(),
    sku: 'WMT-007890',
    name: 'LEGO Star Wars Millennium Falcon',
    description: 'Iconic starship building set. 1,351 pieces for ages 9+.',
    category: 'toys',
    price: 159.99,
    originalPrice: 169.99,
    priceAction: 'rollback',
    stockStatus: 'low_stock',
    stockQuantity: 8,
    imageUrl: 'https://picsum.photos/seed/lego/400/400',
    rating: 4.9,
    reviewCount: 456,
    aiScore: 94,
    salesVelocity: 3.5,
    margin: 25,
    tags: ['toys', 'building', 'collectible'],
  },
];

// Generate more products for grid display
const categories: ProductCategory[] = ['grocery', 'electronics', 'clothing', 'home', 'toys', 'beauty', 'pharmacy', 'automotive', 'garden', 'sports'];

export const generateMockProducts = (count: number): Product[] => {
  const products: Product[] = [...mockProducts];

  for (let i = products.length; i < count; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const hasDiscount = Math.random() > 0.7;
    const originalPrice = Math.random() * 200 + 5;
    const price = hasDiscount ? originalPrice * (0.7 + Math.random() * 0.2) : originalPrice;
    const stockStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'overstock'] as const;
    const stockStatus = stockStatuses[Math.floor(Math.random() * stockStatuses.length)];

    products.push({
      id: generateId(),
      sku: `WMT-${String(i).padStart(6, '0')}`,
      name: `Product ${i + 1} - ${category}`,
      description: `High-quality ${category} product with excellent features and great value.`,
      category,
      price: Math.round(price * 100) / 100,
      originalPrice: hasDiscount ? Math.round(originalPrice * 100) / 100 : undefined,
      priceAction: hasDiscount ? (Math.random() > 0.5 ? 'rollback' : 'clearance') : 'regular',
      stockStatus,
      stockQuantity: stockStatus === 'out_of_stock' ? 0 : Math.floor(Math.random() * 200),
      imageUrl: `https://picsum.photos/seed/product${i}/400/400`,
      rating: 3 + Math.random() * 2,
      reviewCount: Math.floor(Math.random() * 5000),
      aiScore: Math.floor(50 + Math.random() * 50),
      salesVelocity: Math.random() * 50,
      margin: Math.floor(10 + Math.random() * 50),
      tags: [category, 'featured'],
    });
  }

  return products;
};

// Mock Planogram
export const mockPlanogram: Planogram = {
  id: generateId(),
  name: 'Beverage Aisle - Section A',
  aisle: 'Aisle 7',
  section: 'Section A - Soft Drinks',
  storeId: 'store-001',
  rows: 4,
  columns: 6,
  slots: Array(24).fill(null).map((_, index) => {
    const row = Math.floor(index / 6);
    const col = index % 6;
    const product = Math.random() > 0.15 ? mockProducts[index % mockProducts.length] : null;
    const intensities = ['cold', 'cool', 'warm', 'hot', 'critical'] as const;

    return {
      id: `slot-${index}`,
      position: {
        row,
        column: col,
        width: 1,
        height: 1,
        depth: 1,
      },
      product,
      facings: Math.floor(Math.random() * 3) + 1,
      heatIntensity: intensities[Math.floor(Math.random() * intensities.length)],
      performance: Math.floor(Math.random() * 100),
    } as ShelfSlot;
  }),
  lastUpdated: new Date(),
  aiOptimized: true,
  performanceScore: 78,
};

// Mock AI Recommendations
export const mockRecommendations: AIRecommendation[] = [
  {
    id: generateId(),
    type: 'restock',
    priority: 'critical',
    productId: mockProducts[4].id,
    product: mockProducts[4],
    message: 'Onn. Wireless Earbuds are out of stock. High demand detected - restock immediately to capture $2,400 in potential sales.',
    impact: 'This product has been searched 1,200 times today with a 68% conversion rate when in stock.',
    estimatedRevenue: 2400,
    confidence: 94,
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
  },
  {
    id: generateId(),
    type: 'reposition',
    priority: 'high',
    productId: mockProducts[2].id,
    product: mockProducts[2],
    message: 'Move Samsung 55" TV to end-cap display. AI predicts 35% increase in visibility and sales.',
    impact: 'End-cap placement has shown 2.3x higher engagement for electronics in similar stores.',
    estimatedRevenue: 12500,
    confidence: 87,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    type: 'markdown',
    priority: 'medium',
    productId: mockProducts[5].id,
    product: mockProducts[5],
    message: 'Consider 20% markdown on Yoga Mats. Overstock detected with declining seasonal demand.',
    impact: 'Markdown would clear excess inventory before new spring fitness line arrives.',
    estimatedRevenue: 850,
    confidence: 76,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    type: 'bundle',
    priority: 'medium',
    productId: mockProducts[6].id,
    product: mockProducts[6],
    message: 'Bundle L\'Oreal Mascara with related cosmetics. Cross-sell opportunity identified.',
    impact: 'Customers buying mascara have 45% likelihood of purchasing complementary products.',
    estimatedRevenue: 3200,
    confidence: 82,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
  },
  {
    id: generateId(),
    type: 'promote',
    priority: 'low',
    productId: mockProducts[7].id,
    product: mockProducts[7],
    message: 'Feature LEGO Millennium Falcon in weekly ad. Trending product with high margin.',
    impact: 'Similar promotions have driven 180% increase in unit sales.',
    estimatedRevenue: 4800,
    confidence: 71,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
];

// Mock Inventory Metrics
export const mockInventoryMetrics: InventoryMetrics = {
  totalProducts: 2847,
  inStockCount: 2156,
  lowStockCount: 423,
  outOfStockCount: 89,
  overstockCount: 179,
  turnoverRate: 4.2,
  averageDaysOnShelf: 18,
  totalValue: 1245780,
};

// Mock Sales Metrics
export const mockSalesMetrics: SalesMetrics = {
  dailyRevenue: 145230,
  weeklyRevenue: 987650,
  monthlyRevenue: 4125890,
  averageTransactionValue: 67.45,
  unitsSold: 2156,
  conversionRate: 3.8,
  topSellingCategory: 'grocery',
};

// Mock Category Stats
export const mockCategoryStats: CategoryStats[] = [
  { category: 'grocery', productCount: 856, revenue: 1245000, growth: 12.5, topProduct: mockProducts[0] },
  { category: 'electronics', productCount: 234, revenue: 892000, growth: 8.3, topProduct: mockProducts[2] },
  { category: 'home', productCount: 567, revenue: 567000, growth: -2.1, topProduct: mockProducts[3] },
  { category: 'beauty', productCount: 445, revenue: 456000, growth: 15.7, topProduct: mockProducts[6] },
  { category: 'toys', productCount: 312, revenue: 345000, growth: 22.4, topProduct: mockProducts[7] },
  { category: 'sports', productCount: 189, revenue: 234000, growth: -5.3, topProduct: mockProducts[5] },
  { category: 'clothing', productCount: 678, revenue: 789000, growth: 6.8, topProduct: mockProducts[0] },
  { category: 'pharmacy', productCount: 234, revenue: 345000, growth: 4.2, topProduct: mockProducts[0] },
];

// Mock Heat Map Data
export const mockHeatMapData: HeatMapData[] = mockPlanogram.slots.map((slot) => ({
  slotId: slot.id,
  value: Math.floor(Math.random() * 1000),
  intensity: slot.heatIntensity,
  metric: 'sales' as const,
}));

// Add more metrics
export const generateHeatMapData = (planogram: Planogram, metric: 'sales' | 'views' | 'pickups' | 'returns'): HeatMapData[] => {
  const intensities = ['cold', 'cool', 'warm', 'hot', 'critical'] as const;
  return planogram.slots.map((slot) => ({
    slotId: slot.id,
    value: Math.floor(Math.random() * (metric === 'sales' ? 1000 : metric === 'views' ? 5000 : 500)),
    intensity: intensities[Math.floor(Math.random() * intensities.length)],
    metric,
  }));
};
