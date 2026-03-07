import type { RoleScope, PermissionAction } from '../types/api.types';

export const ROLE_SCOPES: { value: RoleScope; label: string }[] = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'BU', label: 'Business Unit' },
  { value: 'DEPARTMENT', label: 'Department' },
];

export const PERMISSION_ACTIONS: PermissionAction[] = ['VIEW', 'ADD', 'EDIT', 'DELETE'];

export const PERMISSION_ACTION_LABELS: Record<PermissionAction, string> = {
  VIEW: 'V',
  ADD: 'A',
  EDIT: 'E',
  DELETE: 'D',
};

export const SYSTEM_ROLES = ['SUPER_ADMIN', 'ADMIN'] as const;

export const ASSIGNMENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'success',
  EXPIRED: 'default',
  REVOKED: 'error',
};

export const SCOPE_TAG_COLORS: Record<string, string> = {
  GLOBAL: 'blue',
  BU: 'green',
  DEPARTMENT: 'orange',
};

export const RBAC_TAB_KEYS = {
  ROLE_MANAGEMENT: 'roleManagement',
  PERMISSION_MATRIX: 'permissionMatrix',
  USER_ROLE_ASSIGNMENT: 'userRoleAssignment',
} as const;

export const ROLE_CODE_REGEX = /^[A-Z0-9_]+$/;
export const ROLE_CODE_MAX_LENGTH = 50;
export const ROLE_NAME_MAX_LENGTH = 100;
export const DESCRIPTION_MAX_LENGTH = 500;
export const NOTES_MAX_LENGTH = 500;

export const USER_SEARCH_DEBOUNCE_MS = 400;
export const AUDIT_PAGE_SIZE = 20;
