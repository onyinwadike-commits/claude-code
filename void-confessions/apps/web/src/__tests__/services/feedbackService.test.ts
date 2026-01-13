// Tests for feedback service utilities and helper functions
import {
  categoryConfig,
  statusConfig,
  priorityConfig,
} from '@/lib/feedback/types';
import {
  sentenceStarters,
  getStartersByCategory,
  getStartersBySentiment,
  getRandomStarters,
  getCategoryStarterCounts,
  quickFeedbackTemplates,
} from '@/lib/feedback/sentence-starters';

describe('Feedback Service Utilities', () => {
  describe('categoryConfig', () => {
    it('has all required categories', () => {
      const expectedCategories = [
        'report-quality',
        'ai-accuracy',
        'usability',
        'feature-request',
        'amazon-warfare',
        'visual-merch',
      ];

      expectedCategories.forEach((category) => {
        expect(categoryConfig).toHaveProperty(category);
      });
    });

    it('each category has required properties', () => {
      Object.values(categoryConfig).forEach((config) => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('icon');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('description');
      });
    });

    it('has valid color values', () => {
      Object.values(categoryConfig).forEach((config) => {
        expect(config.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
      });
    });
  });

  describe('statusConfig', () => {
    it('has all status options', () => {
      const expectedStatuses = ['new', 'reviewed', 'in_progress', 'resolved', 'wont_fix'];

      expectedStatuses.forEach((status) => {
        expect(statusConfig).toHaveProperty(status);
      });
    });

    it('each status has label, color, and bgColor', () => {
      Object.values(statusConfig).forEach((config) => {
        expect(config).toHaveProperty('label');
        expect(config).toHaveProperty('color');
        expect(config).toHaveProperty('bgColor');
      });
    });
  });

  describe('priorityConfig', () => {
    it('has all priority levels', () => {
      const expectedPriorities = ['low', 'medium', 'high', 'critical'];

      expectedPriorities.forEach((priority) => {
        expect(priorityConfig).toHaveProperty(priority);
      });
    });
  });
});

describe('Sentence Starters', () => {
  describe('sentenceStarters array', () => {
    it('has starters for all categories', () => {
      const categories = new Set(sentenceStarters.map((s) => s.category));

      expect(categories).toContain('report-quality');
      expect(categories).toContain('ai-accuracy');
      expect(categories).toContain('usability');
      expect(categories).toContain('feature-request');
      expect(categories).toContain('amazon-warfare');
      expect(categories).toContain('visual-merch');
    });

    it('each starter has required properties', () => {
      sentenceStarters.forEach((starter) => {
        expect(starter).toHaveProperty('id');
        expect(starter).toHaveProperty('text');
        expect(starter).toHaveProperty('category');
        expect(starter).toHaveProperty('type');
        expect(starter).toHaveProperty('sentiment');
      });
    });

    it('has unique IDs', () => {
      const ids = sentenceStarters.map((s) => s.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('getStartersByCategory', () => {
    it('returns starters for a specific category', () => {
      const aiStarters = getStartersByCategory('ai-accuracy');

      expect(aiStarters.length).toBeGreaterThan(0);
      aiStarters.forEach((starter) => {
        expect(starter.category).toBe('ai-accuracy');
      });
    });

    it('returns empty array for invalid category', () => {
      // @ts-expect-error Testing invalid input
      const starters = getStartersByCategory('invalid-category');
      expect(starters).toEqual([]);
    });
  });

  describe('getStartersBySentiment', () => {
    it('returns positive starters for a category', () => {
      const positiveStarters = getStartersBySentiment('usability', 'positive');

      expect(positiveStarters.length).toBeGreaterThan(0);
      positiveStarters.forEach((starter) => {
        expect(starter.sentiment).toBe('positive');
        expect(starter.category).toBe('usability');
      });
    });

    it('returns negative starters for a category', () => {
      const negativeStarters = getStartersBySentiment('visual-merch', 'negative');

      negativeStarters.forEach((starter) => {
        expect(starter.sentiment).toBe('negative');
      });
    });
  });

  describe('getRandomStarters', () => {
    it('returns requested number of starters', () => {
      const starters = getRandomStarters('ai-accuracy', 3);
      expect(starters).toHaveLength(3);
    });

    it('returns all available if count exceeds total', () => {
      const categoryStarters = getStartersByCategory('report-quality');
      const starters = getRandomStarters('report-quality', 100);

      expect(starters.length).toBeLessThanOrEqual(categoryStarters.length);
    });

    it('returns starters from the correct category', () => {
      const starters = getRandomStarters('feature-request', 2);

      starters.forEach((starter) => {
        expect(starter.category).toBe('feature-request');
      });
    });
  });

  describe('getCategoryStarterCounts', () => {
    it('returns counts for all categories', () => {
      const counts = getCategoryStarterCounts();

      expect(counts).toHaveProperty('report-quality');
      expect(counts).toHaveProperty('ai-accuracy');
      expect(counts).toHaveProperty('usability');
      expect(counts).toHaveProperty('feature-request');
      expect(counts).toHaveProperty('amazon-warfare');
      expect(counts).toHaveProperty('visual-merch');
    });

    it('counts match actual starters', () => {
      const counts = getCategoryStarterCounts();

      Object.entries(counts).forEach(([category, count]) => {
        const actual = getStartersByCategory(category as any).length;
        expect(count).toBe(actual);
      });
    });
  });

  describe('quickFeedbackTemplates', () => {
    it('has templates for all sentiments', () => {
      expect(quickFeedbackTemplates).toHaveProperty('positive');
      expect(quickFeedbackTemplates).toHaveProperty('negative');
      expect(quickFeedbackTemplates).toHaveProperty('neutral');
    });

    it('each sentiment has multiple templates', () => {
      expect(quickFeedbackTemplates.positive.length).toBeGreaterThan(0);
      expect(quickFeedbackTemplates.negative.length).toBeGreaterThan(0);
      expect(quickFeedbackTemplates.neutral.length).toBeGreaterThan(0);
    });
  });
});
