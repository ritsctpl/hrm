import type { Role, Permission, UserRoleAssignment, ModuleRegistry } from './domain.types';
import type { PermissionsMatrixResponse } from './api.types';

// ---- Atoms ----

export interface RbacStatusBadgeProps {
  isActive: boolean;
  isSystemRole?: boolean;
  assignmentStatus?: string;
}

export interface RbacPermissionCheckboxProps {
  checked: boolean;
  disabled: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export interface RbacScopeTagProps {
  scope: string;
}

export interface RbacEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

// ---- Molecules ----

export interface RbacSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSearch?: (value: string) => void;
}

export interface RbacRoleCardProps {
  role: Role;
  isSelected: boolean;
  onClick: (role: Role) => void;
}

export interface RbacPermissionGroupRowProps {
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  permissions: Permission[];
  selectedHandles: Set<string>;
  disabled: boolean;
  onChange: (permissionHandle: string) => void;
}

export interface RbacAssignmentDateRangeProps {
  effectiveFrom: string | null;
  effectiveTo: string | null;
  disabled?: boolean;
  onChangeFrom: (date: string) => void;
  onChangeTo: (date: string | null) => void;
}

export interface RbacAssignmentHistoryItemProps {
  assignment: UserRoleAssignment;
  onRevoke: (handle: string) => void;
  isRevoking: boolean;
}

// ---- Organisms ----

export interface RoleTableProps {
  data: Role[];
  isLoading: boolean;
  selectedHandle: string | null;
  searchText: string;
  onRowClick: (role: Role) => void;
}

export interface RoleFormProps {
  draft: Partial<Role> | null;
  isCreating: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  errors: Record<string, string>;
  onChange: (patch: Partial<Role>) => void;
  onSave: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

export interface RolePermissionGridProps {
  modules: ModuleRegistry[];
  allPermissions: Permission[];
  selectedHandles: Set<string>;
  moduleFilter: string | null;
  disabled: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onToggle: (permissionHandle: string) => void;
  onModuleFilterChange: (moduleCode: string | null) => void;
  onSavePermissions: () => void;
}

export interface PermissionMatrixGridProps {
  matrixData: PermissionsMatrixResponse[];
  roles: Role[];
  isLoading: boolean;
  moduleFilter: string | null;
  roleFilter: string | null;
}

export interface UserSearchPanelProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  searchResults: KeycloakUserSummaryUI[];
  isSearching: boolean;
  selectedUserId: string | null;
  onSelectUser: (userId: string, userName: string, userEmail: string) => void;
}

export interface UserRoleAssignmentFormProps {
  roles: Role[];
  draft: Partial<{
    roleCode: string;
    effectiveFrom: string;
    effectiveTo: string | null;
    assignmentNotes: string | null;
  }> | null;
  isAssigning: boolean;
  errors: Record<string, string>;
  onChange: (patch: Record<string, unknown>) => void;
  onAssign: () => void;
}

export interface UserRoleHistoryPanelProps {
  assignments: UserRoleAssignment[];
  isLoading: boolean;
  isRevoking: boolean;
  onRevoke: (handle: string) => void;
}

// ---- Templates ----

export interface RoleManagementTemplateProps {
  site: string;
  user: { id: string; name: string } | null;
}

export interface PermissionMatrixTemplateProps {
  site: string;
}

export interface UserRoleAssignmentTemplateProps {
  site: string;
  user: { id: string; name: string } | null;
}

// ---- Home Page ----

export interface HomePageProps {
  className?: string;
}

export interface ModuleCategoryGroupProps {
  category: string;
  modules: {
    moduleCode: string;
    moduleName: string;
    appUrl: string;
  }[];
}

export interface ModuleTileSkeletonProps {
  count?: number;
}

export interface HrmEmptyStateProps {
  title: string;
  subtext?: string;
  icon?: React.ReactNode;
}

// ---- Shared UI ----

export interface KeycloakUserSummaryUI {
  id: string;
  displayName: string;
  email: string;
  avatarInitials: string;
}
