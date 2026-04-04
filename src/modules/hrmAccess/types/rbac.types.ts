import type { PermissionAction } from './api.types';

// ---- Module Access (from backend UserModulesByOrganization response) ----

export interface ModuleAccess {
  moduleCode: string;
  moduleName: string;
  moduleCategory: string;
  appUrl: string;
  actions: PermissionAction[];
}

export interface OrganizationModules {
  site: string;
  organizationName: string;
  modules: ModuleAccess[];
}

export interface UserModulesByOrganizationResponse {
  userId: string;
  organizations: OrganizationModules[];
  evaluatedAt: string;
}

// ---- Enriched Module (with extra metadata from module registry) ----

export interface EnrichedModule extends ModuleAccess {
  description?: string;
  defaultPermissionObjects?: string[];
}

// ---- Section Permissions ----

export interface SectionPermissions {
  canView: boolean;
  canAdd: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export type ModuleSectionPermissions = Record<string, SectionPermissions>;

// ---- Effective Permission Entry ----

export interface EffectivePermissionEntry {
  moduleCode: string;
  moduleName: string;
  objectName: string | null;
  action: PermissionAction;
  scopeValue?: string | null;
  grantedByRoles: string[];
}

// ---- Update Default Site ----

export interface UpdateDefaultSiteRequest {
  userId: string;
  newSite: string;
}

export interface UpdateDefaultSiteResponse {
  success: boolean;
  userId: string;
  currentSite: string | null;
  previousSite?: string | null;
  message: string;
}

// ---- Create Employee With User ----

export interface CreateEmployeeWithUserRequest {
  site: string;
  fullName: string;
  workEmail: string;
  phone?: string;
  firstName: string;
  lastName: string;
  title?: string;
  department?: string;
  role?: string;
  location?: string;
  businessUnits?: string[];
  username: string;
  password: string;
  createKeycloakUser?: boolean;
  initialRoles?: string[];
  createdBy?: string;
}

export interface CreateEmployeeWithUserResponse {
  success: boolean;
  employeeHandle?: string;
  employeeCode?: string;
  userId?: string;
  keycloakUserCreated: boolean;
  rolesAssigned?: string[];
  message: string;
  partialSuccess: boolean;
  timestamp: string;
}

// ---- System Initialize ----

export interface SystemInitializeRequest {
  site: string;
  adminUsername: string;
  adminPassword: string;
  adminEmail: string;
  adminFirstName: string;
  adminLastName: string;
  organizationName: string;
  organizationCode: string;
}

export interface SystemInitializeResponse {
  success: boolean;
  alreadyInitialized: boolean;
  message: string;
  organizationSite?: string;
  organizationName?: string;
  organizationHandle?: string;
  adminUserId?: string;
  adminEmployeeId?: string;
  keycloakUserCreated: boolean;
  roleAssigned?: string;
  modulesRegistered: number;
  permissionsCreated: number;
  rolePermissionsAssigned: number;
  timestamp: string;
}

// ---- User Site Preference ----

export interface UserSitePreference {
  userId: string;
  currentSite: string | null;
  previousSite?: string | null;
}
