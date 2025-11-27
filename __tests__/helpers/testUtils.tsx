/**
 * React Testing Library Utilities
 *
 * Custom render functions and utilities for testing React components
 * with all necessary providers and context.
 */

import React, { ReactElement } from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { SessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

// Default mock session for authenticated tests
export const mockSession: Session = {
  user: {
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    role: 'STUDENT',
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
};

// Provider props interface
interface AllProvidersProps {
  children: React.ReactNode;
  session?: Session | null;
}

/**
 * Wrapper component that includes all necessary providers
 */
function AllProviders({ children, session = null }: AllProvidersProps): ReactElement {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

// Extended render options
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  session?: Session | null;
}

/**
 * Custom render function that wraps components with all providers
 *
 * @param ui - React component to render
 * @param options - Render options including optional session
 * @returns RenderResult with all Testing Library utilities
 *
 * @example
 * ```tsx
 * // Render without session (unauthenticated)
 * renderWithProviders(<MyComponent />);
 *
 * // Render with session (authenticated)
 * renderWithProviders(<MyComponent />, { session: mockSession });
 *
 * // Render with custom session
 * renderWithProviders(<MyComponent />, {
 *   session: { ...mockSession, user: { ...mockSession.user, role: 'INSTRUCTOR' } }
 * });
 * ```
 */
export function renderWithProviders(
  ui: ReactElement,
  { session = null, ...renderOptions }: CustomRenderOptions = {}
): RenderResult {
  function Wrapper({ children }: { children: React.ReactNode }): ReactElement {
    return <AllProviders session={session}>{children}</AllProviders>;
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

/**
 * Create a mock request object for API route testing
 */
export function createMockRequest(
  body: unknown,
  options: {
    method?: string;
    headers?: Record<string, string>;
  } = {}
): Request {
  const { method = 'POST', headers = {} } = options;

  return new Request('http://localhost:3000/api/test', {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Create a mock NextRequest-like object with params
 */
export function createMockNextRequest(
  body: unknown,
  options: {
    method?: string;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): Request {
  const { method = 'POST', headers = {}, searchParams = {} } = options;

  const url = new URL('http://localhost:3000/api/test');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new Request(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Re-export everything from testing-library for convenience
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
