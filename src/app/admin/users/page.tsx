/**
 * Admin User Management Page
 *
 * Main page for managing users in the admin dashboard.
 * Features:
 * - User list with filtering and pagination
 * - Create, edit, and deactivate users
 * - Reset user passwords
 *
 * Story: 2.5 - Admin Dashboard User Management
 */

'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Plus, RefreshCw, Users } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import Breadcrumb from '@/components/Breadcrumb'
import {
  UserFilters,
  UserFilterState,
  defaultFilters,
  UserTable,
  User,
  SortConfig,
  UserCreateModal,
  UserEditModal,
  ResetPasswordModal,
  DeactivateConfirmation,
  Pagination,
} from '@/components/admin'

/**
 * API response interface
 */
interface UsersResponse {
  data: User[]
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

/**
 * AdminUsersPage component
 */
export default function AdminUsersPage() {
  const router = useRouter()
  const { data: session, status } = useSession()

  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    pageSize: 50,
    totalPages: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter and sort state
  const [filters, setFilters] = useState<UserFilterState>(defaultFilters)
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    column: 'createdAt',
    direction: 'desc',
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null)
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null)

  /**
   * Fetch users from API
   */
  const fetchUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', meta.pageSize.toString())

      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.role) {
        params.append('role', filters.role)
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to fetch users')
      }

      setUsers(data.data)
      setMeta(data.meta)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      toast.error('Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, meta.pageSize, filters.search, filters.role])

  // Check authentication on mount
  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'ADMIN') {
      router.push('/dashboard')
      toast.error('Admin access required')
      return
    }
  }, [session, status, router])

  // Fetch users when dependencies change
  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      fetchUsers()
    }
  }, [fetchUsers, session])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filters.search, filters.role])

  /**
   * Handle filter change
   */
  const handleFilterChange = useCallback((newFilters: UserFilterState) => {
    setFilters(newFilters)
  }, [])

  /**
   * Handle sort change
   */
  const handleSortChange = useCallback(
    (column: keyof User) => {
      setSortConfig((prev) => ({
        column,
        direction:
          prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc',
      }))
    },
    []
  )

  /**
   * Sort users locally
   */
  const sortedUsers = useMemo(() => {
    if (!sortConfig.column) return users

    return [...users].sort((a, b) => {
      const aVal = a[sortConfig.column!]
      const bVal = b[sortConfig.column!]

      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1

      let comparison = 0
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        comparison = aVal.localeCompare(bVal)
      } else {
        comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      }

      return sortConfig.direction === 'asc' ? comparison : -comparison
    })
  }, [users, sortConfig])

  /**
   * Handle page change
   */
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  /**
   * Handle user creation success
   */
  const handleCreateSuccess = useCallback(() => {
    toast.success('User created successfully')
    fetchUsers()
  }, [fetchUsers])

  /**
   * Handle user edit success
   */
  const handleEditSuccess = useCallback(() => {
    toast.success('User updated successfully')
    fetchUsers()
  }, [fetchUsers])

  /**
   * Handle deactivation success
   */
  const handleDeactivateSuccess = useCallback(() => {
    toast.success('User deactivated successfully')
    fetchUsers()
  }, [fetchUsers])

  /**
   * Handle refresh
   */
  const handleRefresh = useCallback(() => {
    fetchUsers()
    toast.success('Users refreshed')
  }, [fetchUsers])

  // Loading state
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
      </div>
    )
  }

  // Not authenticated
  if (!session || session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard' },
            { label: 'User Management' },
          ]}
        />

        {/* Page header */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pink-100 rounded-lg">
              <Users className="h-6 w-6 text-pink-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                User Management
              </h1>
              <p className="text-sm text-gray-500">
                Manage user accounts, roles, and permissions
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-md transition-colors"
              title="Refresh users"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-pink-600 text-white text-sm font-medium rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add User
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mt-6">
          <UserFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            isLoading={isLoading}
          />
        </div>

        {/* User table */}
        <div className="mt-4">
          <UserTable
            users={sortedUsers}
            isLoading={isLoading}
            onEdit={setEditingUser}
            onResetPassword={setResetPasswordUser}
            onDeactivate={setDeactivatingUser}
            sortConfig={sortConfig}
            onSortChange={handleSortChange}
          />
        </div>

        {/* Pagination */}
        <div className="mt-4">
          <Pagination
            currentPage={meta.page}
            totalPages={meta.totalPages}
            totalItems={meta.total}
            pageSize={meta.pageSize}
            onPageChange={handlePageChange}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Modals */}
      <UserCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      <UserEditModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={handleEditSuccess}
      />

      <ResetPasswordModal
        isOpen={!!resetPasswordUser}
        user={resetPasswordUser}
        onClose={() => setResetPasswordUser(null)}
      />

      <DeactivateConfirmation
        isOpen={!!deactivatingUser}
        user={deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onSuccess={handleDeactivateSuccess}
      />
    </div>
  )
}
