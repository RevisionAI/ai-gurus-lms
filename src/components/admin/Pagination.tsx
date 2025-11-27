/**
 * Pagination Component
 *
 * Renders pagination controls with page numbers and navigation.
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.2
 */

'use client'

import { useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

/**
 * Props for Pagination component
 */
export interface PaginationProps {
  /** Current page (1-indexed) */
  currentPage: number
  /** Total number of pages */
  totalPages: number
  /** Total number of items */
  totalItems: number
  /** Items per page */
  pageSize: number
  /** Callback when page changes */
  onPageChange: (page: number) => void
  /** Whether pagination is disabled (loading state) */
  isLoading?: boolean
}

/**
 * Pagination component
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  isLoading = false,
}: PaginationProps) {
  /**
   * Generate page numbers to display
   */
  const pageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = []
    const maxVisiblePages = 5

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      // Calculate middle pages
      let start = Math.max(2, currentPage - 1)
      let end = Math.min(totalPages - 1, currentPage + 1)

      // Adjust if at the beginning or end
      if (currentPage <= 2) {
        end = 4
      } else if (currentPage >= totalPages - 1) {
        start = totalPages - 3
      }

      // Add ellipsis if needed before middle pages
      if (start > 2) {
        pages.push('ellipsis')
      }

      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i)
      }

      // Add ellipsis if needed after middle pages
      if (end < totalPages - 1) {
        pages.push('ellipsis')
      }

      // Always show last page
      pages.push(totalPages)
    }

    return pages
  }, [currentPage, totalPages])

  /**
   * Handle page navigation
   */
  const handlePageChange = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages && page !== currentPage && !isLoading) {
        onPageChange(page)
      }
    },
    [currentPage, totalPages, onPageChange, isLoading]
  )

  // Calculate displayed item range
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endItem = Math.min(currentPage * pageSize, totalItems)

  if (totalPages <= 1) {
    return (
      <div className="text-sm text-gray-500">
        Showing {totalItems} {totalItems === 1 ? 'user' : 'users'}
      </div>
    )
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
      {/* Item count */}
      <div className="text-sm text-gray-500">
        Showing {startItem} to {endItem} of {totalItems} users
      </div>

      {/* Page controls */}
      <nav
        className="flex items-center gap-1"
        role="navigation"
        aria-label="Pagination"
      >
        {/* Previous button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        {/* Page numbers */}
        {pageNumbers.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-1 text-gray-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              disabled={isLoading}
              className={`min-w-[36px] px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                page === currentPage
                  ? 'bg-pink-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              } disabled:cursor-not-allowed`}
              aria-label={`Page ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Next button */}
        <button
          type="button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-500"
          aria-label="Next page"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </nav>
    </div>
  )
}

export default Pagination
