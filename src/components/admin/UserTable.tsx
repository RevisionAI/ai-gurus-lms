/**
 * UserTable Component
 *
 * Displays a table of users with:
 * - Sortable columns
 * - Status badges (Active/Inactive)
 * - Row actions (Edit, Reset Password, Deactivate)
 *
 * Story: 2.5 - Admin Dashboard User Management
 * AC: 2.5.2
 */

'use client'

import { useState, useCallback } from 'react'
import { format } from 'date-fns'
import {
  MoreVertical,
  Edit,
  Key,
  UserMinus,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

/**
 * User data interface
 */
export interface User {
  id: string
  email: string
  name: string
  surname: string
  role: 'STUDENT' | 'INSTRUCTOR' | 'ADMIN'
  createdAt: string
  updatedAt: string
  deletedAt: string | null
}

/**
 * Sort configuration
 */
export interface SortConfig {
  column: keyof User | null
  direction: 'asc' | 'desc'
}

/**
 * Props for UserTable component
 */
export interface UserTableProps {
  /** Array of users to display */
  users: User[]
  /** Whether the table is loading */
  isLoading?: boolean
  /** Callback when Edit is clicked */
  onEdit: (user: User) => void
  /** Callback when Reset Password is clicked */
  onResetPassword: (user: User) => void
  /** Callback when Deactivate is clicked */
  onDeactivate: (user: User) => void
  /** Current sort configuration */
  sortConfig: SortConfig
  /** Callback when sort changes */
  onSortChange: (column: keyof User) => void
}

/**
 * Role badge colors
 */
const roleBadgeColors: Record<User['role'], string> = {
  STUDENT: 'bg-blue-100 text-blue-800',
  INSTRUCTOR: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-red-100 text-red-800',
}

/**
 * Role display names
 */
const roleDisplayNames: Record<User['role'], string> = {
  STUDENT: 'Student',
  INSTRUCTOR: 'Instructor',
  ADMIN: 'Admin',
}

/**
 * UserTable component
 */
export function UserTable({
  users,
  isLoading = false,
  onEdit,
  onResetPassword,
  onDeactivate,
  sortConfig,
  onSortChange,
}: UserTableProps) {
  /**
   * Render sort indicator
   */
  const renderSortIndicator = (column: keyof User) => {
    if (sortConfig.column !== column) {
      return <ArrowUpDown className="h-4 w-4 text-gray-400" />
    }
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4 text-pink-600" />
    ) : (
      <ChevronDown className="h-4 w-4 text-pink-600" />
    )
  }

  /**
   * Sortable column header
   */
  const SortableHeader = ({
    column,
    children,
  }: {
    column: keyof User
    children: React.ReactNode
  }) => (
    <button
      type="button"
      onClick={() => onSortChange(column)}
      className="flex items-center gap-1 hover:text-pink-600 transition-colors"
    >
      {children}
      {renderSortIndicator(column)}
    </button>
  )

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="animate-pulse">
          {/* Header skeleton */}
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
          {/* Row skeletons */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No users found</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <SortableHeader column="name">Name</SortableHeader>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <SortableHeader column="email">Email</SortableHeader>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <SortableHeader column="role">Role</SortableHeader>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <SortableHeader column="createdAt">Registered</SortableHeader>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Status
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.name} {user.surname}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${roleBadgeColors[user.role]}`}
                  >
                    {roleDisplayNames[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.deletedAt
                        ? 'bg-gray-100 text-gray-600'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {user.deletedAt ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
                        aria-label="User actions"
                      >
                        <MoreVertical className="h-5 w-5" />
                      </button>
                    </DropdownMenu.Trigger>

                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[160px] bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50"
                        sideOffset={5}
                        align="end"
                      >
                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                          onClick={() => onEdit(user)}
                        >
                          <Edit className="h-4 w-4" />
                          Edit User
                        </DropdownMenu.Item>

                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer outline-none"
                          onClick={() => onResetPassword(user)}
                        >
                          <Key className="h-4 w-4" />
                          Reset Password
                        </DropdownMenu.Item>

                        <DropdownMenu.Separator className="h-px bg-gray-200 my-1" />

                        <DropdownMenu.Item
                          className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none"
                          onClick={() => onDeactivate(user)}
                        >
                          <UserMinus className="h-4 w-4" />
                          Deactivate
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default UserTable
