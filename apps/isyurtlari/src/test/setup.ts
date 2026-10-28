import { vi } from 'vitest';
import '@testing-library/jest-dom';

// jsdom matchMedia default mock
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

vi.mock('next-view-transitions', async () => {
  const React = await import('react');
  return {
    Link: ({ href, children, ...rest }: { href: string; children?: React.ReactNode }) =>
      React.createElement('a', { href, ...rest }, children),
    ViewTransitions: ({ children }: { children: React.ReactNode }) => children,
  };
});
