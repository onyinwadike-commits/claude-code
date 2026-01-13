import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import { SentenceStarters } from '@/components/feedback/SentenceStarters';
import { getStartersByCategory } from '@/lib/feedback/sentence-starters';

describe('SentenceStarters', () => {
  const mockOnSelect = jest.fn();

  beforeEach(() => {
    mockOnSelect.mockClear();
  });

  describe('rendering', () => {
    it('renders starters for the given category', () => {
      render(
        <SentenceStarters
          category="ai-accuracy"
          onSelect={mockOnSelect}
        />
      );

      // Should show the category starters
      expect(screen.getByText(/Quick starters/i)).toBeInTheDocument();
    });

    it('groups starters by sentiment', () => {
      render(
        <SentenceStarters
          category="usability"
          onSelect={mockOnSelect}
        />
      );

      // Should show sentiment labels
      expect(screen.getByText(/positive feedback/i)).toBeInTheDocument();
      expect(screen.getByText(/neutral feedback/i)).toBeInTheDocument();
      expect(screen.getByText(/negative feedback/i)).toBeInTheDocument();
    });

    it('shows prompt count', () => {
      const starters = getStartersByCategory('ai-accuracy');
      render(
        <SentenceStarters
          category="ai-accuracy"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(`${starters.length} prompts`)).toBeInTheDocument();
    });

    it('shows custom option', () => {
      render(
        <SentenceStarters
          category="usability"
          onSelect={mockOnSelect}
        />
      );

      expect(screen.getByText(/Write your own feedback/i)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onSelect when a starter is clicked', () => {
      render(
        <SentenceStarters
          category="ai-accuracy"
          onSelect={mockOnSelect}
        />
      );

      const starters = getStartersByCategory('ai-accuracy');
      const firstStarter = screen.getByText(starters[0].text);
      fireEvent.click(firstStarter);

      expect(mockOnSelect).toHaveBeenCalledWith(starters[0]);
    });

    it('calls onSelect with custom starter when custom option is clicked', () => {
      render(
        <SentenceStarters
          category="feature-request"
          onSelect={mockOnSelect}
        />
      );

      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      expect(mockOnSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'custom',
          text: '',
          category: 'feature-request',
        })
      );
    });

    it('highlights selected starter', () => {
      const starters = getStartersByCategory('usability');
      render(
        <SentenceStarters
          category="usability"
          onSelect={mockOnSelect}
          selectedId={starters[0].id}
        />
      );

      const selectedButton = screen.getByText(starters[0].text);
      expect(selectedButton.closest('button')).toHaveClass('ring-2');
    });
  });

  describe('categories', () => {
    const categories = [
      'report-quality',
      'ai-accuracy',
      'usability',
      'feature-request',
      'amazon-warfare',
      'visual-merch',
    ] as const;

    categories.forEach((category) => {
      it(`renders starters for ${category} category`, () => {
        render(
          <SentenceStarters
            category={category}
            onSelect={mockOnSelect}
          />
        );

        const starters = getStartersByCategory(category);
        // At least one starter should be visible
        if (starters.length > 0) {
          expect(screen.getByText(starters[0].text)).toBeInTheDocument();
        }
      });
    });
  });
});
