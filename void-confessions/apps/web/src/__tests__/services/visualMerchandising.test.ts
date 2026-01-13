// Tests for Visual Merchandising AI service utilities
import {
  mockProducts,
  mockPlanogram,
  mockRecommendations,
  mockInventoryMetrics,
  mockSalesMetrics,
  mockCategoryStats,
  generateMockProducts,
  generateHeatMapData,
} from '@/lib/mockMerchandisingData';
import type { HeatMapIntensity } from '@/types/merchandising';

describe('Visual Merchandising Mock Data', () => {
  describe('mockProducts', () => {
    it('has required product properties', () => {
      mockProducts.forEach((product) => {
        expect(product).toHaveProperty('id');
        expect(product).toHaveProperty('sku');
        expect(product).toHaveProperty('name');
        expect(product).toHaveProperty('description');
        expect(product).toHaveProperty('category');
        expect(product).toHaveProperty('price');
        expect(product).toHaveProperty('stockStatus');
        expect(product).toHaveProperty('stockQuantity');
        expect(product).toHaveProperty('aiScore');
      });
    });

    it('has valid price values', () => {
      mockProducts.forEach((product) => {
        expect(product.price).toBeGreaterThan(0);
        if (product.originalPrice) {
          expect(product.originalPrice).toBeGreaterThan(0);
        }
      });
    });

    it('has valid AI scores (0-100)', () => {
      mockProducts.forEach((product) => {
        expect(product.aiScore).toBeGreaterThanOrEqual(0);
        expect(product.aiScore).toBeLessThanOrEqual(100);
      });
    });

    it('has valid stock statuses', () => {
      const validStatuses = ['in_stock', 'low_stock', 'out_of_stock', 'overstock'];
      mockProducts.forEach((product) => {
        expect(validStatuses).toContain(product.stockStatus);
      });
    });

    it('has valid categories', () => {
      const validCategories = [
        'grocery', 'electronics', 'clothing', 'home', 'toys',
        'beauty', 'pharmacy', 'automotive', 'garden', 'sports',
      ];
      mockProducts.forEach((product) => {
        expect(validCategories).toContain(product.category);
      });
    });
  });

  describe('generateMockProducts', () => {
    it('generates the requested number of products', () => {
      const products = generateMockProducts(20);
      expect(products).toHaveLength(20);
    });

    it('includes base mock products', () => {
      const products = generateMockProducts(10);
      const baseProductNames = mockProducts.map((p) => p.name);

      // Should include at least some base products
      const hasBaseProducts = products.some((p) =>
        baseProductNames.includes(p.name)
      );
      expect(hasBaseProducts).toBe(true);
    });

    it('generates unique IDs', () => {
      const products = generateMockProducts(50);
      const ids = products.map((p) => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('mockPlanogram', () => {
    it('has required planogram properties', () => {
      expect(mockPlanogram).toHaveProperty('id');
      expect(mockPlanogram).toHaveProperty('name');
      expect(mockPlanogram).toHaveProperty('aisle');
      expect(mockPlanogram).toHaveProperty('section');
      expect(mockPlanogram).toHaveProperty('rows');
      expect(mockPlanogram).toHaveProperty('columns');
      expect(mockPlanogram).toHaveProperty('slots');
      expect(mockPlanogram).toHaveProperty('performanceScore');
    });

    it('has correct number of slots', () => {
      const expectedSlots = mockPlanogram.rows * mockPlanogram.columns;
      expect(mockPlanogram.slots).toHaveLength(expectedSlots);
    });

    it('slots have valid positions', () => {
      mockPlanogram.slots.forEach((slot) => {
        expect(slot.position.row).toBeGreaterThanOrEqual(0);
        expect(slot.position.row).toBeLessThan(mockPlanogram.rows);
        expect(slot.position.column).toBeGreaterThanOrEqual(0);
        expect(slot.position.column).toBeLessThan(mockPlanogram.columns);
      });
    });

    it('slots have valid heat intensity', () => {
      const validIntensities: HeatMapIntensity[] = ['cold', 'cool', 'warm', 'hot', 'critical'];
      mockPlanogram.slots.forEach((slot) => {
        expect(validIntensities).toContain(slot.heatIntensity);
      });
    });

    it('has performance score between 0 and 100', () => {
      expect(mockPlanogram.performanceScore).toBeGreaterThanOrEqual(0);
      expect(mockPlanogram.performanceScore).toBeLessThanOrEqual(100);
    });
  });

  describe('mockRecommendations', () => {
    it('has required recommendation properties', () => {
      mockRecommendations.forEach((rec) => {
        expect(rec).toHaveProperty('id');
        expect(rec).toHaveProperty('type');
        expect(rec).toHaveProperty('priority');
        expect(rec).toHaveProperty('productId');
        expect(rec).toHaveProperty('product');
        expect(rec).toHaveProperty('message');
        expect(rec).toHaveProperty('impact');
        expect(rec).toHaveProperty('estimatedRevenue');
        expect(rec).toHaveProperty('confidence');
      });
    });

    it('has valid recommendation types', () => {
      const validTypes = ['restock', 'markdown', 'reposition', 'bundle', 'promote', 'discontinue'];
      mockRecommendations.forEach((rec) => {
        expect(validTypes).toContain(rec.type);
      });
    });

    it('has valid priority levels', () => {
      const validPriorities = ['low', 'medium', 'high', 'critical'];
      mockRecommendations.forEach((rec) => {
        expect(validPriorities).toContain(rec.priority);
      });
    });

    it('has confidence scores between 0 and 100', () => {
      mockRecommendations.forEach((rec) => {
        expect(rec.confidence).toBeGreaterThanOrEqual(0);
        expect(rec.confidence).toBeLessThanOrEqual(100);
      });
    });

    it('has positive estimated revenue', () => {
      mockRecommendations.forEach((rec) => {
        expect(rec.estimatedRevenue).toBeGreaterThan(0);
      });
    });
  });

  describe('mockInventoryMetrics', () => {
    it('has all required metrics', () => {
      expect(mockInventoryMetrics).toHaveProperty('totalProducts');
      expect(mockInventoryMetrics).toHaveProperty('inStockCount');
      expect(mockInventoryMetrics).toHaveProperty('lowStockCount');
      expect(mockInventoryMetrics).toHaveProperty('outOfStockCount');
      expect(mockInventoryMetrics).toHaveProperty('overstockCount');
      expect(mockInventoryMetrics).toHaveProperty('turnoverRate');
      expect(mockInventoryMetrics).toHaveProperty('totalValue');
    });

    it('stock counts sum to total or less', () => {
      const sum =
        mockInventoryMetrics.inStockCount +
        mockInventoryMetrics.lowStockCount +
        mockInventoryMetrics.outOfStockCount +
        mockInventoryMetrics.overstockCount;

      expect(sum).toBeLessThanOrEqual(mockInventoryMetrics.totalProducts);
    });
  });

  describe('mockSalesMetrics', () => {
    it('has all required metrics', () => {
      expect(mockSalesMetrics).toHaveProperty('dailyRevenue');
      expect(mockSalesMetrics).toHaveProperty('weeklyRevenue');
      expect(mockSalesMetrics).toHaveProperty('monthlyRevenue');
      expect(mockSalesMetrics).toHaveProperty('averageTransactionValue');
      expect(mockSalesMetrics).toHaveProperty('unitsSold');
      expect(mockSalesMetrics).toHaveProperty('conversionRate');
    });

    it('daily revenue is less than weekly and monthly', () => {
      expect(mockSalesMetrics.dailyRevenue).toBeLessThan(mockSalesMetrics.weeklyRevenue);
      expect(mockSalesMetrics.weeklyRevenue).toBeLessThan(mockSalesMetrics.monthlyRevenue);
    });
  });

  describe('mockCategoryStats', () => {
    it('has stats for multiple categories', () => {
      expect(mockCategoryStats.length).toBeGreaterThan(0);
    });

    it('each stat has required properties', () => {
      mockCategoryStats.forEach((stat) => {
        expect(stat).toHaveProperty('category');
        expect(stat).toHaveProperty('productCount');
        expect(stat).toHaveProperty('revenue');
        expect(stat).toHaveProperty('growth');
        expect(stat).toHaveProperty('topProduct');
      });
    });
  });

  describe('generateHeatMapData', () => {
    it('generates heat map data for all slots', () => {
      const heatData = generateHeatMapData(mockPlanogram, 'sales');
      expect(heatData).toHaveLength(mockPlanogram.slots.length);
    });

    it('generates data with correct metric type', () => {
      const metrics = ['sales', 'views', 'pickups', 'returns'] as const;

      metrics.forEach((metric) => {
        const heatData = generateHeatMapData(mockPlanogram, metric);
        heatData.forEach((data) => {
          expect(data.metric).toBe(metric);
        });
      });
    });

    it('generates valid intensity values', () => {
      const heatData = generateHeatMapData(mockPlanogram, 'sales');
      const validIntensities: HeatMapIntensity[] = ['cold', 'cool', 'warm', 'hot', 'critical'];

      heatData.forEach((data) => {
        expect(validIntensities).toContain(data.intensity);
      });
    });
  });
});
