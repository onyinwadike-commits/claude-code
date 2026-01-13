// Jest setup file
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href, ...props }) => {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => {
  const actual = jest.requireActual('framer-motion');
  return {
    ...actual,
    motion: {
      div: ({ children, ...props }) => <div {...props}>{children}</div>,
      button: ({ children, ...props }) => <button {...props}>{children}</button>,
      span: ({ children, ...props }) => <span {...props}>{children}</span>,
      p: ({ children, ...props }) => <p {...props}>{children}</p>,
      h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
      h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>,
      h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
      h4: ({ children, ...props }) => <h4 {...props}>{children}</h4>,
      img: (props) => <img {...props} />,
      svg: ({ children, ...props }) => <svg {...props}>{children}</svg>,
      ul: ({ children, ...props }) => <ul {...props}>{children}</ul>,
      li: ({ children, ...props }) => <li {...props}>{children}</li>,
      form: ({ children, ...props }) => <form {...props}>{children}</form>,
      input: (props) => <input {...props} />,
      textarea: (props) => <textarea {...props} />,
      select: ({ children, ...props }) => <select {...props}>{children}</select>,
      label: ({ children, ...props }) => <label {...props}>{children}</label>,
      a: ({ children, ...props }) => <a {...props}>{children}</a>,
    },
    AnimatePresence: ({ children }) => children,
    useAnimation: () => ({
      start: jest.fn(),
      stop: jest.fn(),
    }),
    useMotionValue: (initial) => ({
      get: () => initial,
      set: jest.fn(),
    }),
    useTransform: (value, inputRange, outputRange) => ({
      get: () => outputRange[0],
    }),
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Suppress console errors during tests (optional - remove if debugging)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render') ||
        args[0].includes('Warning: An update to') ||
        args[0].includes('act(...)'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
