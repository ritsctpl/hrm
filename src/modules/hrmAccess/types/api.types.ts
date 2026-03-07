// ---- Permission Actions ----

export type PermissionAction = 'VIEW' | 'ADD' | 'EDIT' | 'DELETE';

// ---- Role Scope ----

export type RoleScope = 'GLOBAL' | 'BU' | 'DEPARTMENT';

// ---- Assignment Status ----

export type AssignmentStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED';

// ---- Module Registry ----

export interface ModuleRegistryRequest {
  site: string;
  moduleCode: string;
  moduleName: string;
  moduleCategory?: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface ModuleRegistryResponse {
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

// ---- Permission ----

export interface PermissionRequest {
  site: string;
  moduleCode: string;
  objectName?: string | null;
  action: PermissionAction;
  isDefault?: boolean;
  createdBy?: string;
}

export interface PermissionResponse {
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

// ---- Role ----

export interface RoleRequest {
  site: string;
  roleCode: string;
  roleName: string;
  roleScope?: RoleScope;
  description?: string | null;
  createdBy?: string;
  modifiedBy?: string;
}

export interface RoleResponse {
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

// ---- Role Permissions ----

export interface AssignPermissionsRequest {
  site: string;
  roleCode: string;
  permissions: PermissionAssignmentEntry[];
  assignedBy: string;
}

export interface PermissionAssignmentEntry {
  permissionHandle: string;
  scopeValue?: string | null;
}

export interface RolePermissionResponse {
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

// ---- User Role Assignment ----

export interface UserRoleAssignmentRequest {
  site: string;
  userId: string;
  roleCode: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  assignmentNotes?: string | null;
  assignedBy: string;
}

export interface UserRoleAssignmentResponse {
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

// ---- Effective Permissions ----

export interface EffectivePermissionsResponse {
  userId: string;
  userDisplayName: string;
  permissions: EffectivePermissionEntry[];
  evaluatedAt: string;
}

export interface EffectivePermissionEntry {
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  action: PermissionAction;
  scopeValue: string | null;
  grantedByRoles: string[];
}

// ---- Access Check ----

export interface AccessCheckRequest {
  site: string;
  userId: string;
  moduleCode: string;
  objectName?: string | null;
  action: PermissionAction;
  scopeValue?: string | null;
}

export interface AccessCheckResponse {
  allowed: boolean;
  userId: string;
  moduleCode: string;
  objectName: string | null;
  action: PermissionAction;
  scopeValue: string | null;
  evaluationTimeMs: number;
}

// ---- Permission Matrix Report ----

export interface PermissionsMatrixResponse {
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  rolePermissions: Record<string, PermissionAction[]>;
}

// ---- Import ----

export interface ImportResultResponse {
  totalRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors: ImportRowError[];
  importedAt: string;
  importedBy: string;
}

export interface ImportRowError {
  rowNumber: number;
  reason: string;
  rowData: Record<string, string>;
}

// ---- Role Clone ----

export interface RoleCloneRequest {
  site: string;
  sourceRoleId: string;
  newRoleName: string;
  performedBy: string;
}

// ---- Import Preview ----

export interface ImportPreviewResponse {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  preview: ImportPreviewRow[];
  errors: ImportRowError[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, string>;
  isValid: boolean;
  validationErrors: string[];
}

// ---- User Access Report ----

export interface UserAccessReportResponse {
  userId: string;
  userDisplayName: string;
  userEmail: string;
  roles: UserAccessRoleEntry[];
  generatedAt: string;
}

export interface UserAccessRoleEntry {
  roleCode: string;
  roleName: string;
  roleScope: RoleScope;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignmentStatus: AssignmentStatus;
  permissions: UserAccessPermissionEntry[];
}

export interface UserAccessPermissionEntry {
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  action: PermissionAction;
  scopeValue: string | null;
}

// ---- Orphaned / Expired Assignments ----

export interface OrphanedExpiredAssignment {
  handle: string;
  userId: string;
  userDisplayName: string;
  userEmail: string;
  roleCode: string;
  roleName: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignmentStatus: AssignmentStatus;
  reason: string;
}

// ---- Audit ----

export interface RbacAuditLogDto {
  handle: string;
  site: string;
  entityType: string;
  entityHandle: string;
  action: string;
  beforeValue: unknown;
  afterValue: unknown;
  performedBy: string;
  performedAt: string;
  remarks: string | null;
}
