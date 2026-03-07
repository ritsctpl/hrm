import api from '@/services/api';
import type {
  ModuleRegistryRequest,
  ModuleRegistryResponse,
  PermissionRequest,
  PermissionResponse,
  RoleRequest,
  RoleResponse,
  AssignPermissionsRequest,
  RolePermissionResponse,
  UserRoleAssignmentRequest,
  UserRoleAssignmentResponse,
  EffectivePermissionsResponse,
  AccessCheckRequest,
  AccessCheckResponse,
  PermissionsMatrixResponse,
  ImportResultResponse,
  RbacAuditLogDto,
} from '../types/api.types';

const BASE = '/hrm-service/rbac';

export class HrmAccessService {

  // ---- Module Registry ----

  static async createModule(payload: ModuleRegistryRequest): Promise<ModuleRegistryResponse> {
    const res = await api.post(`${BASE}/module/create`, payload);
    return res.data;
  }

  static async fetchModule(moduleCode: string): Promise<ModuleRegistryResponse> {
    const res = await api.post(`${BASE}/module/retrieve`, { moduleCode });
    return res.data;
  }

  static async fetchAllModules(site: string): Promise<ModuleRegistryResponse[]> {
    const res = await api.post(`${BASE}/module/retrieveAll`, { site });
    return res.data;
  }

  static async fetchModulesByCategory(site: string, category: string): Promise<ModuleRegistryResponse[]> {
    const res = await api.post(`${BASE}/module/retrieveByCategory`, { site, category });
    return res.data;
  }

  static async updateModule(
    handle: string,
    moduleRegistryRequest: ModuleRegistryRequest
  ): Promise<ModuleRegistryResponse> {
    const res = await api.post(`${BASE}/module/update`, { handle, moduleRegistryRequest });
    return res.data;
  }

  static async deactivateModule(site: string, handle: string, performedBy: string): Promise<void> {
    await api.post(`${BASE}/module/deactivate`, { site, handle, performedBy });
  }

  // ---- Permissions ----

  static async createPermission(payload: PermissionRequest): Promise<PermissionResponse> {
    const res = await api.post(`${BASE}/permission/create`, payload);
    return res.data;
  }

  static async createPermissionsForModule(
    site: string,
    moduleCode: string,
    objectNames: string[],
    createdBy: string
  ): Promise<PermissionResponse[]> {
    const res = await api.post(`${BASE}/permission/createForModule`, {
      site,
      moduleCode,
      objectNames,
      createdBy,
    });
    return res.data;
  }

  static async fetchPermission(handle: string): Promise<PermissionResponse> {
    const res = await api.post(`${BASE}/permission/retrieve`, { handle });
    return res.data;
  }

  static async fetchPermissionsByModule(moduleCode: string): Promise<PermissionResponse[]> {
    const res = await api.post(`${BASE}/permission/retrieveByModule`, { moduleCode });
    return res.data;
  }

  static async fetchAllPermissions(site: string): Promise<PermissionResponse[]> {
    const res = await api.post(`${BASE}/permission/retrieveAll`, { site });
    return res.data;
  }

  static async deletePermission(site: string, handle: string, performedBy: string): Promise<void> {
    await api.post(`${BASE}/permission/delete`, { site, handle, performedBy });
  }

  // ---- Roles ----

  static async createRole(payload: RoleRequest): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/create`, payload);
    return res.data;
  }

  static async fetchRole(roleCode: string): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/retrieve`, { roleCode });
    return res.data;
  }

  static async fetchAllRoles(site: string): Promise<RoleResponse[]> {
    const res = await api.post(`${BASE}/role/retrieveAll`, { site });
    return Array.isArray(res.data) ? res.data : res.data?.content ?? [];
  }

  static async fetchActiveRoles(site: string): Promise<RoleResponse[]> {
    const res = await api.post(`${BASE}/role/retrieveActive`, { site });
    return res.data;
  }

  static async updateRole(
    handle: string,
    roleRequest: RoleRequest,
    performedBy: string
  ): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/update`, { handle, roleRequest, performedBy });
    return res.data;
  }

  static async toggleRoleStatus(
    site: string,
    roleCode: string,
    isActive: boolean,
    performedBy: string
  ): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/toggleStatus`, { site, roleCode, isActive, performedBy });
    return res.data;
  }

  static async deleteRole(site: string, roleCode: string, performedBy: string): Promise<void> {
    await api.post(`${BASE}/role/delete`, { site, roleCode, performedBy });
  }

  // ---- Role Permissions ----

  static async assignPermissionsToRole(
    payload: AssignPermissionsRequest
  ): Promise<RolePermissionResponse[]> {
    const res = await api.post(`${BASE}/rolePermission/assign`, payload);
    return res.data;
  }

  static async fetchPermissionsForRole(
    site: string,
    roleCode: string
  ): Promise<RolePermissionResponse[]> {
    const res = await api.post(`${BASE}/rolePermission/retrieveByRole`, { site, roleCode });
    return res.data;
  }

  static async removePermissionFromRole(
    site: string,
    rolePermissionHandle: string,
    performedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/rolePermission/remove`, {
      site,
      rolePermissionHandle,
      performedBy,
    });
  }

  static async removeAllPermissionsFromRole(
    site: string,
    roleCode: string,
    performedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/rolePermission/removeAll`, { site, roleCode, performedBy });
  }

  // ---- User Role Assignments ----

  static async assignRoleToUser(
    payload: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResponse> {
    const res = await api.post(`${BASE}/userRole/assign`, payload);
    return res.data;
  }

  static async fetchAssignmentsForUser(
    site: string,
    userId: string
  ): Promise<UserRoleAssignmentResponse[]> {
    const res = await api.post(`${BASE}/userRole/retrieveByUser`, { site, userId });
    return res.data;
  }

  static async fetchUsersWithRole(
    site: string,
    roleCode: string
  ): Promise<UserRoleAssignmentResponse[]> {
    const res = await api.post(`${BASE}/userRole/retrieveByRole`, { site, roleCode });
    return res.data;
  }

  static async revokeRoleFromUser(
    site: string,
    assignmentHandle: string,
    revokedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/userRole/revoke`, { site, assignmentHandle, revokedBy });
  }

  static async updateAssignment(
    handle: string,
    payload: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResponse> {
    const res = await api.post(`${BASE}/userRole/update`, { handle, userRoleAssignmentRequest: payload });
    return res.data;
  }

  // ---- Effective Permissions ----

  static async fetchEffectivePermissions(
    site: string,
    userId: string
  ): Promise<EffectivePermissionsResponse> {
    const res = await api.post(`${BASE}/permissions/effective`, { site, userId });
    return res.data;
  }

  static async checkAccess(payload: AccessCheckRequest): Promise<AccessCheckResponse> {
    const res = await api.post(`${BASE}/permissions/check`, payload);
    return res.data;
  }

  // ---- Permission Matrix ----

  static async fetchPermissionsMatrix(
    site: string,
    moduleCode: string | null,
    roleCode: string | null
  ): Promise<PermissionsMatrixResponse[]> {
    const res = await api.post(`${BASE}/report/permissionsMatrix`, { site, moduleCode, roleCode });
    return res.data;
  }

  // ---- Import / Export ----

  static async exportRoles(site: string, format: 'csv' | 'xlsx'): Promise<Blob> {
    const res = await api.post(`${BASE}/export/roles`, { site, format }, { responseType: 'blob' });
    return res.data;
  }

  static async importRoles(site: string, file: File, importedBy: string): Promise<ImportResultResponse> {
    const formData = new FormData();
    formData.append('site', site);
    formData.append('file', file);
    formData.append('importedBy', importedBy);
    const res = await api.post(`${BASE}/import/roles`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  static async importUserAssignments(
    site: string,
    file: File,
    importedBy: string
  ): Promise<ImportResultResponse> {
    const formData = new FormData();
    formData.append('site', site);
    formData.append('file', file);
    formData.append('importedBy', importedBy);
    const res = await api.post(`${BASE}/import/userAssignments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ---- Keycloak User Search ----

  static async searchKeycloakUsers(
    site: string,
    query: string
  ): Promise<{ id: string; username: string; firstName: string; lastName: string; email: string }[]> {
    const res = await api.post(`${BASE}/users/search`, { site, query });
    return res.data;
  }

  // ---- Audit ----

  static async fetchAuditLog(
    site: string,
    entityType: string,
    entityHandle: string,
    page: number,
    size: number
  ): Promise<{ content: RbacAuditLogDto[]; totalElements: number }> {
    const res = await api.post(`${BASE}/audit/retrieve`, { site, entityType, entityHandle, page, size });
    return res.data;
  }
}
