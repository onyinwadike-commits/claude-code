import React from 'react';
import { render, screen, fireEvent } from '../../test-utils';
import { RatingStars } from '@/components/feedback/RatingStars';

describe('RatingStars', () => {
  describe('rendering', () => {
    it('renders 5 star buttons', () => {
      render(<RatingStars value={0} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('renders with initial value', () => {
      render(<RatingStars value={3} />);

      // Component should render with 3 stars filled
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(5);
    });

    it('renders in readonly mode', () => {
      render(<RatingStars value={4} readonly />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });

    it('shows label when showLabel is true and value > 0', () => {
      render(<RatingStars value={5} showLabel />);

      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('does not show label when value is 0', () => {
      render(<RatingStars value={0} showLabel />);

      expect(screen.queryByText('Poor')).not.toBeInTheDocument();
      expect(screen.queryByText('Excellent')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onChange when star is clicked', () => {
      const handleChange = jest.fn();
      render(<RatingStars value={0} onChange={handleChange} />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[2]); // Click 3rd star

      expect(handleChange).toHaveBeenCalledWith(3);
    });

    it('does not call onChange in readonly mode', () => {
      const handleChange = jest.fn();
      render(<RatingStars value={2} onChange={handleChange} readonly />);

      const buttons = screen.getAllByRole('button');
      fireEvent.click(buttons[4]); // Try to click 5th star

      expect(handleChange).not.toHaveBeenCalled();
    });

    it('updates displayed rating on hover', () => {
      const handleChange = jest.fn();
      render(<RatingStars value={2} onChange={handleChange} showLabel />);

      const buttons = screen.getAllByRole('button');

      // Hover over 5th star
      fireEvent.mouseEnter(buttons[4]);
      expect(screen.getByText('Excellent')).toBeInTheDocument();

      // Mouse leave
      fireEvent.mouseLeave(buttons[4]);
      // Should show original value label
    });
  });

  describe('sizes', () => {
    it('renders with small size', () => {
      render(<RatingStars value={3} size="sm" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('w-4', 'h-4');
    });

    it('renders with medium size', () => {
      render(<RatingStars value={3} size="md" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('w-6', 'h-6');
    });

    it('renders with large size', () => {
      render(<RatingStars value={3} size="lg" />);

      const buttons = screen.getAllByRole('button');
      expect(buttons[0]).toHaveClass('w-8', 'h-8');
    });
  });

  describe('accessibility', () => {
    it('has accessible labels for each star', () => {
      render(<RatingStars value={0} />);

      for (let i = 1; i <= 5; i++) {
        expect(screen.getByLabelText(`Rate ${i} stars`)).toBeInTheDocument();
      }
    });
  });
});
