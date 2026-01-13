import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { mockFeedback, createMockFeedback } from '../../mock-data';

describe('FeedbackCard', () => {
  const mockOnVote = jest.fn();
  const mockOnStatusChange = jest.fn();

  beforeEach(() => {
    mockOnVote.mockClear();
    mockOnStatusChange.mockClear();
  });

  describe('rendering', () => {
    it('renders feedback title and message', () => {
      const feedback = mockFeedback[0];
      render(<FeedbackCard feedback={feedback} />);

      expect(screen.getByText(feedback.title)).toBeInTheDocument();
      expect(screen.getByText(feedback.message)).toBeInTheDocument();
    });

    it('renders category badge', () => {
      const feedback = mockFeedback[0];
      render(<FeedbackCard feedback={feedback} />);

      // Category label should be visible
      expect(screen.getByText('AI Accuracy')).toBeInTheDocument();
    });

    it('renders status badge', () => {
      const feedback = createMockFeedback({ status: 'reviewed' });
      render(<FeedbackCard feedback={feedback} />);

      expect(screen.getByText('Reviewed')).toBeInTheDocument();
    });

    it('renders priority badge', () => {
      const feedback = createMockFeedback({ priority: 'high' });
      render(<FeedbackCard feedback={feedback} />);

      expect(screen.getByText('High')).toBeInTheDocument();
    });

    it('renders vote count', () => {
      const feedback = createMockFeedback({ votes: 42 });
      render(<FeedbackCard feedback={feedback} />);

      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders rating stars when rating is provided', () => {
      const feedback = createMockFeedback({ rating: 5 });
      render(<FeedbackCard feedback={feedback} />);

      // Rating stars should be present (5 svg elements)
      const stars = document.querySelectorAll('svg');
      expect(stars.length).toBeGreaterThan(0);
    });

    it('renders admin response when present', () => {
      const feedback = createMockFeedback({
        adminResponse: 'We are working on this.',
        adminRespondedAt: new Date(),
      });
      render(<FeedbackCard feedback={feedback} />);

      // First expand the card
      const card = screen.getByText(feedback.title).closest('div');
      if (card) {
        fireEvent.click(card);
      }

      expect(screen.getByText('We are working on this.')).toBeInTheDocument();
    });

    it('renders in compact mode', () => {
      const feedback = mockFeedback[0];
      render(<FeedbackCard feedback={feedback} compact />);

      // In compact mode, less info is shown
      expect(screen.getByText(feedback.title)).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('expands when clicked', () => {
      const feedback = createMockFeedback({
        userName: 'Test User',
        tags: ['test', 'feedback'],
      });
      render(<FeedbackCard feedback={feedback} />);

      // Click to expand
      const title = screen.getByText(feedback.title);
      fireEvent.click(title.closest('div')!);

      // Tags should be visible after expansion
      expect(screen.getByText('#test')).toBeInTheDocument();
    });

    it('calls onVote when vote button is clicked', () => {
      const feedback = mockFeedback[0];
      render(<FeedbackCard feedback={feedback} onVote={mockOnVote} />);

      // Find and click the vote button (contains the vote count)
      const voteButton = screen.getByText(feedback.votes.toString()).closest('button');
      if (voteButton) {
        fireEvent.click(voteButton);
      }

      expect(mockOnVote).toHaveBeenCalledWith(feedback.id);
    });

    it('shows admin actions when showAdminActions is true', () => {
      const feedback = mockFeedback[0];
      render(
        <FeedbackCard
          feedback={feedback}
          onStatusChange={mockOnStatusChange}
          showAdminActions
        />
      );

      // Expand the card first
      const title = screen.getByText(feedback.title);
      fireEvent.click(title.closest('div')!);

      // Admin status buttons should be visible
      expect(screen.getByText('Change Status')).toBeInTheDocument();
    });

    it('calls onStatusChange when status button is clicked', async () => {
      const feedback = createMockFeedback({ status: 'new' });
      render(
        <FeedbackCard
          feedback={feedback}
          onStatusChange={mockOnStatusChange}
          showAdminActions
        />
      );

      // Expand the card
      const title = screen.getByText(feedback.title);
      fireEvent.click(title.closest('div')!);

      // Click a status button
      const resolvedButton = screen.getByText('Resolved');
      fireEvent.click(resolvedButton);

      await waitFor(() => {
        expect(mockOnStatusChange).toHaveBeenCalledWith(feedback.id, 'resolved');
      });
    });
  });

  describe('time display', () => {
    it('displays relative time', () => {
      const recentFeedback = createMockFeedback({
        createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      });
      render(<FeedbackCard feedback={recentFeedback} />);

      expect(screen.getByText('5m ago')).toBeInTheDocument();
    });

    it('displays "just now" for very recent feedback', () => {
      const justNowFeedback = createMockFeedback({
        createdAt: new Date(Date.now() - 30 * 1000), // 30 seconds ago
      });
      render(<FeedbackCard feedback={justNowFeedback} />);

      expect(screen.getByText('just now')).toBeInTheDocument();
    });
  });

  describe('sentiment display', () => {
    it('shows positive sentiment indicator', () => {
      const feedback = createMockFeedback({ sentiment: 'positive' });
      render(<FeedbackCard feedback={feedback} />);

      expect(screen.getByText('positive')).toBeInTheDocument();
    });

    it('shows negative sentiment indicator', () => {
      const feedback = createMockFeedback({ sentiment: 'negative' });
      render(<FeedbackCard feedback={feedback} />);

      expect(screen.getByText('negative')).toBeInTheDocument();
    });
  });
});
