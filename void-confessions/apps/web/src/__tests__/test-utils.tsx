import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Custom render function that wraps components with necessary providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialState?: Record<string, unknown>;
}

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions
): RenderResult & { user: ReturnType<typeof userEvent.setup> } => {
  const user = userEvent.setup();

  return {
    user,
    ...render(ui, { wrapper: AllTheProviders, ...options }),
  };
};

// Re-export everything
export * from '@testing-library/react';
export { customRender as render, userEvent };

// Helper to wait for animations
export const waitForAnimation = () => new Promise((resolve) => setTimeout(resolve, 100));

// Helper to create mock event
export const createMockEvent = (overrides = {}) => ({
  preventDefault: jest.fn(),
  stopPropagation: jest.fn(),
  target: { value: '' },
  ...overrides,
});

// Helper to flush promises
export const flushPromises = () => new Promise((resolve) => setImmediate(resolve));
