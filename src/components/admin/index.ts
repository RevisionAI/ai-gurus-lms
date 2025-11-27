/**
 * Admin Components Index
 *
 * Re-exports all admin-related components for easier importing.
 *
 * Story: 2.5 - Admin Dashboard User Management
 */

export { UserFilters, defaultFilters } from './UserFilters'
export type { UserFilterState, UserFiltersProps } from './UserFilters'

export { UserTable } from './UserTable'
export type { User, SortConfig, UserTableProps } from './UserTable'

export { UserCreateModal } from './UserCreateModal'
export type { UserCreateModalProps } from './UserCreateModal'

export { UserEditModal } from './UserEditModal'
export type { UserEditModalProps } from './UserEditModal'

export { RoleChangeConfirmation } from './RoleChangeConfirmation'
export type { RoleChangeConfirmationProps } from './RoleChangeConfirmation'

export { ResetPasswordModal } from './ResetPasswordModal'
export type { ResetPasswordModalProps } from './ResetPasswordModal'

export { DeactivateConfirmation } from './DeactivateConfirmation'
export type { DeactivateConfirmationProps } from './DeactivateConfirmation'

export { Pagination } from './Pagination'
export type { PaginationProps } from './Pagination'
