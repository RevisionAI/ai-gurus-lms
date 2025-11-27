/**
 * UserFilters Component
 *
 * Provides filtering controls for the admin user management:
 * - Search by name/email with debounced input
 * - Role filter dropdown
 * - Clear filters button
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.3
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X, Filter } from 'lucide-react'
import { useDebouncedValue } from '@/hooks/useDebouncedValue'

/**
 * Filter state interface
 */
export interface UserFilterState {
  search: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN' | null
}

/**
 * Default filter state
 */
export const defaultFilters: UserFilterState = {
  search: '',
  role: null,
}

/**
 * Role filter options
 */
const roleOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All Roles' },
  { value: 'STUDENT', label: 'Students' },
  { value: 'INSTRUCTOR', label: 'Instructors' },
  { value: 'ADMIN', label: 'Admins' },
]

/**
 * Props for UserFilters component
 */
export interface UserFiltersProps {
  /** Current filter state */
  filters: UserFilterState
  /** Callback when filters change */
  onFilterChange: (filters: UserFilterState) => void
  /** Whether filters are currently being applied (loading state) */
  isLoading?: boolean
}

/**
 * UserFilters component
 *
 * Renders filter controls for the user management page
 */
export function UserFilters({
  filters,
  onFilterChange,
  isLoading = false,
}: UserFiltersProps) {
  // Local state for search input (immediate update for UI responsiveness)
  const [searchInput, setSearchInput] = useState(filters.search)

  // Debounce the search input by 300ms
  const debouncedSearch = useDebouncedValue(searchInput, 300)

  // Update parent filter state when debounced value changes
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ ...filters, search: debouncedSearch })
    }
  }, [debouncedSearch, filters, onFilterChange])

  // Sync local input with external filter changes (e.g., URL init, clear all)
  useEffect(() => {
    if (filters.search !== searchInput && filters.search === '') {
      setSearchInput('')
    }
  }, [filters.search])

  /**
   * Handle search input change
   */
  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchInput(e.target.value)
    },
    []
  )

  /**
   * Clear search filter
   */
  const handleClearSearch = useCallback(() => {
    setSearchInput('')
    onFilterChange({ ...filters, search: '' })
  }, [filters, onFilterChange])

  /**
   * Handle role filter change
   */
  const handleRoleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value
      onFilterChange({
        ...filters,
        role: value === 'all' ? null : (value as UserFilterState['role']),
      })
    },
    [filters, onFilterChange]
  )

  /**
   * Clear all filters
   */
  const handleClearAll = useCallback(() => {
    setSearchInput('')
    onFilterChange(defaultFilters)
  }, [onFilterChange])

  /**
   * Check if any filters are active
   */
  const hasActiveFilters = filters.search !== '' || filters.role !== null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filters</span>
        {hasActiveFilters && (
          <span className="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded-full">
            Active
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <label htmlFor="userSearch" className="sr-only">
            Search users
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="userSearch"
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              disabled={isLoading}
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Role Filter */}
        <div className="w-full sm:w-48">
          <label htmlFor="roleFilter" className="sr-only">
            Filter by role
          </label>
          <select
            id="roleFilter"
            value={filters.role || 'all'}
            onChange={handleRoleChange}
            className="w-full py-2 px-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            disabled={isLoading}
          >
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear All Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 whitespace-nowrap"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}

export default UserFilters
