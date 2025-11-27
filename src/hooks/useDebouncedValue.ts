/**
 * useDebouncedValue Hook
 *
 * Debounces a value by a specified delay, useful for reducing API calls
 * during rapid user input (e.g., search filters).
 *
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */

import { useState, useEffect } from 'react';

/**
 * Hook that returns a debounced version of the provided value
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [searchInput, setSearchInput] = useState('');
 * const debouncedSearch = useDebouncedValue(searchInput, 300);
 *
 * useEffect(() => {
 *   // This will only run after 300ms of no changes to searchInput
 *   fetchSearchResults(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebouncedValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up a timer to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up the timer if value changes before delay completes
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebouncedValue;
