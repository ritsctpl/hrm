import type { Role, Permission } from '../types/domain.types';
import type { RoleRequest, AssignPermissionsRequest, PermissionsMatrixResponse } from '../types/api.types';

export function mapRoleDraftToRequest(
  draft: Partial<Role>,
  site: string,
  userId: string
): RoleRequest {
  return {
    site,
    roleCode: draft.roleCode ?? '',
    roleName: draft.roleName ?? '',
    roleScope: draft.roleScope ?? 'GLOBAL',
    description: draft.description ?? null,
    createdBy: userId,
    modifiedBy: userId,
  };
}

export function buildPermissionAssignRequest(
  site: string,
  roleCode: string,
  selectedHandles: Set<string>,
  userId: string
): AssignPermissionsRequest {
  return {
    site,
    roleCode,
    permissions: Array.from(selectedHandles).map((handle) => ({
      permissionHandle: handle,
      scopeValue: null,
    })),
    assignedBy: userId,
  };
}

export function groupPermissionsByModule(
  permissions: Permission[]
): Record<string, Record<string, Permission[]>> {
  const grouped: Record<string, Record<string, Permission[]>> = {};

  for (const perm of permissions) {
    const modKey = perm.moduleCode;
    const objKey = perm.objectName ?? '__module__';

    if (!grouped[modKey]) grouped[modKey] = {};
    if (!grouped[modKey][objKey]) grouped[modKey][objKey] = [];

    grouped[modKey][objKey].push(perm);
  }

  return grouped;
}

export function buildMatrixFromResponse(
  matrixRows: PermissionsMatrixResponse[]
): Record<string, Record<string, Record<string, boolean>>> {
  const result: Record<string, Record<string, Record<string, boolean>>> = {};

  for (const row of matrixRows) {
    const rowKey = `${row.moduleCode}::${row.objectName ?? '__module__'}`;
    result[rowKey] = {};

    for (const [roleCode, actions] of Object.entries(row.rolePermissions)) {
      result[rowKey][roleCode] = {
        VIEW: actions.includes('VIEW'),
        ADD: actions.includes('ADD'),
        EDIT: actions.includes('EDIT'),
        DELETE: actions.includes('DELETE'),
      };
    }
  }

  return result;
}

export function getAvatarInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return displayName.slice(0, 2).toUpperCase();
}
