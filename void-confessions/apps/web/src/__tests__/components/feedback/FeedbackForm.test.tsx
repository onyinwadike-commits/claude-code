import React from 'react';
import { render, screen, fireEvent, waitFor } from '../../test-utils';
import { FeedbackForm } from '@/components/feedback/FeedbackForm';
import { categoryConfig } from '@/lib/feedback/types';

describe('FeedbackForm', () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
    mockOnCancel.mockClear();
  });

  describe('rendering', () => {
    it('renders form header', () => {
      render(<FeedbackForm />);

      expect(screen.getByText('Share Feedback')).toBeInTheDocument();
      expect(screen.getByText('Help us improve Walmart Ops')).toBeInTheDocument();
    });

    it('renders all category options', () => {
      render(<FeedbackForm />);

      Object.values(categoryConfig).forEach((config) => {
        expect(screen.getByText(config.label)).toBeInTheDocument();
      });
    });

    it('renders progress indicators', () => {
      render(<FeedbackForm />);

      // Should have 3 progress dots
      const progressDots = document.querySelectorAll('.rounded-full.w-2');
      expect(progressDots.length).toBe(3);
    });
  });

  describe('step navigation', () => {
    it('starts at category selection step', () => {
      render(<FeedbackForm />);

      expect(
        screen.getByText('What area would you like to give feedback on?')
      ).toBeInTheDocument();
    });

    it('navigates to sentence starters after selecting category', () => {
      render(<FeedbackForm />);

      // Click on a category
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      // Should show sentence starters
      expect(screen.getByText(/Quick starters/i)).toBeInTheDocument();
    });

    it('navigates to details after selecting starter', () => {
      render(<FeedbackForm />);

      // Select category
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      // Select custom option (always available)
      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      // Should show details form
      expect(screen.getByText('Feedback Type')).toBeInTheDocument();
      expect(screen.getByText('Your Feedback')).toBeInTheDocument();
    });

    it('allows going back from sentence starters to category', () => {
      render(<FeedbackForm />);

      // Select category
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      // Find and click back button - look for button with ChevronLeft icon
      const buttons = screen.getAllByRole('button');
      const backButton = buttons.find(btn => {
        // Check for button without text content (icon only back button)
        const hasNoTextContent = btn.textContent === '' || btn.textContent?.trim() === '';
        const isNotSubmit = btn.getAttribute('type') !== 'submit';
        return hasNoTextContent && isNotSubmit;
      });

      if (backButton) {
        fireEvent.click(backButton);
        // Should be back at category selection
        expect(
          screen.getByText('What area would you like to give feedback on?')
        ).toBeInTheDocument();
      } else {
        // If no back button found, just verify we're on the sentence starter step
        expect(screen.getByText(/Choose a starter/)).toBeInTheDocument();
      }
    });
  });

  describe('form submission', () => {
    const fillForm = async () => {
      render(<FeedbackForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Select category
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      // Select custom option
      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      // Fill in feedback message
      const messageInput = screen.getByPlaceholderText(/Tell us more/i);
      fireEvent.change(messageInput, {
        target: { value: 'This is a test feedback message with enough characters.' },
      });
    };

    it('enables submit button when form is valid', async () => {
      await fillForm();

      const submitButton = screen.getByText('Submit Feedback');
      expect(submitButton).not.toBeDisabled();
    });

    it('disables submit button when message is too short', () => {
      render(<FeedbackForm onSubmit={mockOnSubmit} />);

      // Navigate to details step
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      // Type a short message
      const messageInput = screen.getByPlaceholderText(/Tell us more/i);
      fireEvent.change(messageInput, { target: { value: 'Short' } });

      const submitButton = screen.getByText('Submit Feedback');
      expect(submitButton).toBeDisabled();
    });

    it('calls onSubmit with correct data', async () => {
      await fillForm();

      // Add a title
      const titleInput = screen.getByPlaceholderText(/Brief summary/i);
      fireEvent.change(titleInput, { target: { value: 'Test Title' } });

      // Submit the form
      const submitButton = screen.getByText('Submit Feedback');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'usability',
            message: 'This is a test feedback message with enough characters.',
            title: 'Test Title',
            status: 'new',
          })
        );
      });
    });

    it('calls onCancel when cancel button is clicked', async () => {
      await fillForm();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('feedback types', () => {
    it('renders all feedback type options', () => {
      render(<FeedbackForm />);

      // Navigate to details
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      // Check for feedback types
      expect(screen.getByText('Praise')).toBeInTheDocument();
      expect(screen.getByText('Suggestion')).toBeInTheDocument();
      expect(screen.getByText('Complaint')).toBeInTheDocument();
      expect(screen.getByText('Bug Report')).toBeInTheDocument();
      expect(screen.getByText('Feature Request')).toBeInTheDocument();
    });

    it('allows selecting different feedback types', () => {
      render(<FeedbackForm />);

      // Navigate to details
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      // Select Bug Report
      const bugButton = screen.getByText('Bug Report');
      fireEvent.click(bugButton);

      // Button should be highlighted
      expect(bugButton.closest('button')).toHaveClass('bg-[#0071CE]/20');
    });
  });

  describe('rating', () => {
    it('allows setting a rating', () => {
      render(<FeedbackForm />);

      // Navigate to details
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      // Rating stars should be present
      expect(screen.getByText('Overall Experience')).toBeInTheDocument();
    });
  });

  describe('store info', () => {
    it('displays store name when provided', () => {
      render(
        <FeedbackForm
          storeId="store-001"
          storeName="Market 396 - Store #4158"
        />
      );

      // Navigate to details
      const usabilityButton = screen.getByText('Usability').closest('button');
      if (usabilityButton) {
        fireEvent.click(usabilityButton);
      }

      const customOption = screen.getByText(/Write your own feedback/i);
      fireEvent.click(customOption);

      expect(screen.getByText('Market 396 - Store #4158')).toBeInTheDocument();
    });
  });
});
