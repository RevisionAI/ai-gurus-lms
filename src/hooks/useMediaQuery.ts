'use client';

import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive media query detection
 *
 * @param query - CSS media query string (e.g., '(min-width: 768px)')
 * @returns boolean indicating if the media query matches
 *
 * Story: 2.1 - Gradebook Grid View Implementation
 * AC: 2.1.7 - Mobile view displays list format instead of grid
 *
 * @example
 * ```tsx
 * const isDesktop = useMediaQuery('(min-width: 768px)');
 * return isDesktop ? <Grid /> : <List />;
 * ```
 */
export function useMediaQuery(query: string): boolean {
  // Default to false for SSR
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is available (client-side)
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);

    // Set initial value
    setMatches(mediaQuery.matches);

    // Create listener function
    const handleChange = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [query]);

  return matches;
}

/**
 * Common breakpoint helpers
 */
export function useIsMobile(): boolean {
  return !useMediaQuery('(min-width: 768px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 768px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}
