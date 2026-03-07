import type { PermissionAction, RoleScope, AssignmentStatus } from './api.types';

export interface ModuleRegistry {
  handle: string;
  site: string;
  moduleCode: string;
  moduleName: string;
  moduleCategory: string;
  isActive: boolean;
  isSystemModule: boolean;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string | null;
  createdBy: string;
  modifiedBy: string | null;
}

export interface Permission {
  handle: string;
  site: string;
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  action: PermissionAction;
  isDefault: boolean;
  active: number;
  createdDateTime: string;
  createdBy: string;
}

export interface Role {
  handle: string;
  site: string;
  roleCode: string;
  roleName: string;
  roleScope: RoleScope;
  description: string | null;
  isSystemRole: boolean;
  isActive: boolean;
  permissionCount: number;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string | null;
  createdBy: string;
  modifiedBy: string | null;
}

export interface RolePermission {
  handle: string;
  site: string;
  roleCode: string;
  roleName: string;
  permissionHandle: string;
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  action: PermissionAction;
  scopeValue: string | null;
  active: number;
  createdDateTime: string;
  createdBy: string;
}

export interface UserRoleAssignment {
  handle: string;
  site: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  roleCode: string;
  roleName: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignmentNotes: string | null;
  assignmentStatus: AssignmentStatus;
  active: number;
  createdDateTime: string;
  createdBy: string;
  modifiedBy: string | null;
}
