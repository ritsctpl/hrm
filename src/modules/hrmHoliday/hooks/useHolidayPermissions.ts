/**
 * HRM Holiday Module - Permissions Hook
 * Derives allowed actions from user role
 */

import type { HolidayPermissions } from '../types/ui.types';

const SUPERADMIN_ROLES = ['SUPERADMIN', 'SUPER_ADMIN'];
const ADMIN_ROLES = ['ADMIN', 'HR_ADMIN', ...SUPERADMIN_ROLES];
const MANAGER_ROLES = ['MANAGER', 'HR_MANAGER', ...ADMIN_ROLES];

export function useHolidayPermissions(role?: string): HolidayPermissions {
  const r = (role ?? '').toUpperCase();
  const isSuperAdmin = SUPERADMIN_ROLES.includes(r);
  const isAdmin = ADMIN_ROLES.includes(r);
  const isManager = MANAGER_ROLES.includes(r);
  const isEmployee = !isManager;

  return {
    canCreate: isManager,
    canEdit: isManager,
    canDelete: isAdmin,
    canPublish: isAdmin,
    canLock: isAdmin,
    canUnlock: isSuperAdmin,
    canImport: isAdmin,
    canExport: isManager,
    canMapBu: isAdmin,
    canManageSettings: isAdmin,
    seeDraftGroups: isManager,
  };
}
