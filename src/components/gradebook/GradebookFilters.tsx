/**
 * GradebookFilters Component
 *
 * Provides filtering controls for the gradebook:
 * - Student name search with real-time debounced filtering
 * - Assignment dropdown filter
 * - Date range picker for assignment due dates
 * - Grade status filter
 * - Clear all filters button
 *
 * Story: 2.3 - Gradebook Filtering & CSV Export
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Search, X, Calendar, Filter } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { GradebookAssignment, CellStatus } from './types';
import toast from 'react-hot-toast';

/**
 * Filter state interface
 */
export interface GradebookFilterState {
  studentFilter: string;
  assignmentId: string | null;
  dateFrom: string | null;
  dateTo: string | null;
  status: 'all' | CellStatus;
}

/**
 * Default filter state
 */
export const defaultFilters: GradebookFilterState = {
  studentFilter: '',
  assignmentId: null,
  dateFrom: null,
  dateTo: null,
  status: 'all',
};

/**
 * Status filter options with labels
 */
const statusOptions: { value: GradebookFilterState['status']; label: string }[] = [
  { value: 'all', label: 'All Statuses' },
  { value: 'graded', label: 'Graded' },
  { value: 'pending', label: 'Pending' },
  { value: 'late', label: 'Late' },
  { value: 'missing', label: 'Missing' },
];

/**
 * Props for GradebookFilters component
 */
export interface GradebookFiltersProps {
  /** Current filter state */
  filters: GradebookFilterState;
  /** Callback when filters change */
  onFilterChange: (filters: GradebookFilterState) => void;
  /** Available assignments for dropdown */
  assignments: GradebookAssignment[];
  /** Whether filters are currently being applied (loading state) */
  isLoading?: boolean;
}

/**
 * GradebookFilters component
 *
 * Renders filter controls for the gradebook grid with:
 * - Debounced student name search (300ms)
 * - Assignment dropdown
 * - Date range picker with validation
 * - Status dropdown
 * - Clear all button
 */
export function GradebookFilters({
  filters,
  onFilterChange,
  assignments,
  isLoading = false,
}: GradebookFiltersProps) {
  // Local state for student input (immediate update for UI responsiveness)
  const [studentInput, setStudentInput] = useState(filters.studentFilter);

  // Debounce the student input by 300ms
  const debouncedStudentFilter = useDebouncedValue(studentInput, 300);

  // Update parent filter state when debounced value changes
  useEffect(() => {
    if (debouncedStudentFilter !== filters.studentFilter) {
      onFilterChange({ ...filters, studentFilter: debouncedStudentFilter });
    }
  }, [debouncedStudentFilter, filters, onFilterChange]);

  // Sync local input with external filter changes (e.g., URL init, clear all)
  useEffect(() => {
    if (filters.studentFilter !== studentInput && filters.studentFilter === '') {
      setStudentInput('');
    }
  }, [filters.studentFilter]);

  /**
   * Handle student name input change
   */
  const handleStudentInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setStudentInput(e.target.value);
    },
    []
  );

  /**
   * Clear student name filter
   */
  const handleClearStudentFilter = useCallback(() => {
    setStudentInput('');
    onFilterChange({ ...filters, studentFilter: '' });
  }, [filters, onFilterChange]);

  /**
   * Handle assignment filter change
   */
  const handleAssignmentChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      onFilterChange({
        ...filters,
        assignmentId: value === 'all' ? null : value,
      });
    },
    [filters, onFilterChange]
  );

  /**
   * Handle date range change with validation
   */
  const handleDateChange = useCallback(
    (field: 'dateFrom' | 'dateTo', value: string) => {
      const newValue = value || null;
      const updatedFilters = { ...filters, [field]: newValue };

      // Validate date range (From <= To)
      if (updatedFilters.dateFrom && updatedFilters.dateTo) {
        const fromDate = new Date(updatedFilters.dateFrom);
        const toDate = new Date(updatedFilters.dateTo);

        if (fromDate > toDate) {
          toast.error('From date must be before or equal to To date');
          return;
        }
      }

      onFilterChange(updatedFilters);
    },
    [filters, onFilterChange]
  );

  /**
   * Handle status filter change
   */
  const handleStatusChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onFilterChange({
        ...filters,
        status: e.target.value as GradebookFilterState['status'],
      });
    },
    [filters, onFilterChange]
  );

  /**
   * Clear all filters
   */
  const handleClearAll = useCallback(() => {
    setStudentInput('');
    onFilterChange(defaultFilters);
  }, [onFilterChange]);

  /**
   * Check if any filters are active
   */
  const hasActiveFilters =
    filters.studentFilter !== '' ||
    filters.assignmentId !== null ||
    filters.dateFrom !== null ||
    filters.dateTo !== null ||
    filters.status !== 'all';

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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Student Name Search */}
        <div className="relative">
          <label htmlFor="studentFilter" className="sr-only">
            Search students
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              id="studentFilter"
              type="text"
              value={studentInput}
              onChange={handleStudentInputChange}
              placeholder="Search students..."
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              disabled={isLoading}
            />
            {studentInput && (
              <button
                type="button"
                onClick={handleClearStudentFilter}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Clear student filter"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Assignment Filter */}
        <div>
          <label htmlFor="assignmentFilter" className="sr-only">
            Filter by assignment
          </label>
          <select
            id="assignmentFilter"
            value={filters.assignmentId || 'all'}
            onChange={handleAssignmentChange}
            className="w-full py-2 px-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            disabled={isLoading}
          >
            <option value="all">All Assignments</option>
            {assignments.map((assignment) => (
              <option key={assignment.id} value={assignment.id}>
                {assignment.title}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range - From */}
        <div>
          <label htmlFor="dateFrom" className="sr-only">
            From date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="dateFrom"
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => handleDateChange('dateFrom', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="From date"
              title="Filter assignments due from this date"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Date Range - To */}
        <div>
          <label htmlFor="dateTo" className="sr-only">
            To date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              id="dateTo"
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => handleDateChange('dateTo', e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="To date"
              title="Filter assignments due until this date"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="sr-only">
            Filter by status
          </label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={handleStatusChange}
            className="w-full py-2 px-3 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            disabled={isLoading}
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Clear All Button */}
      {hasActiveFilters && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}

export default GradebookFilters;
