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
  ImportPreviewResponse,
  UserAccessReportResponse,
  RbacAuditLogDto,
} from '../types/api.types';
import type {
  UserModulesByOrganizationResponse,
  UpdateDefaultSiteResponse,
  SystemInitializeRequest,
  SystemInitializeResponse,
  CreateEmployeeWithUserRequest,
  CreateEmployeeWithUserResponse,
} from '../types/rbac.types';

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

  static async fetchAllModules(organizationId: string): Promise<ModuleRegistryResponse[]> {
    const res = await api.post(`${BASE}/module/retrieveAll`, { organizationId });
    return res.data;
  }

  // Note: fetchModulesByCategory endpoint not available on backend
  // Filtering is done client-side in the component
  // static async fetchModulesByCategory(site: string, category: string): Promise<ModuleRegistryResponse[]> {
  //   const res = await api.post(`${BASE}/module/retrieveByCategory`, { site, category });
  //   return res.data;
  // }

  static async updateModule(
    handle: string,
    moduleRegistryRequest: ModuleRegistryRequest
  ): Promise<ModuleRegistryResponse> {
    const res = await api.post(`${BASE}/module/update`, { handle, moduleRegistryRequest });
    return res.data;
  }

  static async deactivateModule(organizationId: string, handle: string, performedBy: string): Promise<void> {
    await api.post(`${BASE}/module/deactivate`, { organizationId, handle, performedBy });
  }

  // ---- Permissions ----

  static async createPermission(payload: PermissionRequest): Promise<PermissionResponse> {
    const res = await api.post(`${BASE}/permission/create`, payload);
    return res.data;
  }

  static async createPermissionsForModule(
    organizationId: string,
    moduleCode: string,
    objectNames: string[],
    createdBy: string
  ): Promise<PermissionResponse[]> {
    const res = await api.post(`${BASE}/permission/createForModule`, {
      organizationId,
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

  static async fetchAllPermissions(organizationId: string): Promise<PermissionResponse[]> {
    const res = await api.post(`${BASE}/permission/retrieveAll`, { organizationId });
    return res.data;
  }

  static async deletePermission(organizationId: string, handle: string, performedBy: string): Promise<void> {
    await api.post(`${BASE}/permission/delete`, { organizationId, handle, performedBy });
  }

  // ---- Roles ----

  static async createRole(payload: RoleRequest): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/create`, payload);
    return res.data;
  }

  static async fetchRole(organizationId: string, roleCode: string): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/retrieve`, { organizationId, roleCode });
    return res.data;
  }

  static async fetchAllRoles(organizationId: string): Promise<RoleResponse[]> {
    const res = await api.post(`${BASE}/role/retrieveAll`, { organizationId, size: 1000, page: 0 });
    if (Array.isArray(res.data)) return res.data;
    if (res.data?.content && Array.isArray(res.data.content)) return res.data.content;
    return [];
  }

  static async fetchActiveRoles(organizationId: string): Promise<RoleResponse[]> {
    const res = await api.post(`${BASE}/role/retrieveActive`, { organizationId });
    return res.data;
  }

  static async updateRole(
    handle: string,
    roleRequest: RoleRequest,
    performedBy: string
  ): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/update`, { handle, performedBy, roleRequest });
    return res.data;
  }

  static async toggleRoleStatus(
    organizationId: string,
    roleCode: string,
    isActive: boolean,
    performedBy: string
  ): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/toggleStatus`, { organizationId, roleCode, isActive, performedBy });
    return res.data;
  }

  static async deleteRole(organizationId: string, roleCode: string, performedBy: string): Promise<void> {
    await api.post(`${BASE}/role/delete`, { organizationId, roleCode, performedBy });
  }

  // ---- Role Permissions ----

  static async assignPermissionsToRole(
    payload: AssignPermissionsRequest
  ): Promise<RolePermissionResponse[]> {
    const res = await api.post(`${BASE}/rolePermission/assign`, payload);
    return res.data;
  }

  static async fetchPermissionsForRole(
    organizationId: string,
    roleCode: string
  ): Promise<RolePermissionResponse[]> {
    const res = await api.post(`${BASE}/rolePermission/retrieveAll`, { organizationId, roleCode });
    return res.data;
  }

  static async removePermissionFromRole(
    organizationId: string,
    rolePermissionHandle: string,
    performedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/rolePermission/remove`, {
      organizationId,
      rolePermissionHandle,
      performedBy,
    });
  }

  static async removeAllPermissionsFromRole(
    organizationId: string,
    roleCode: string,
    performedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/rolePermission/removeAll`, { organizationId, roleCode, performedBy });
  }

  // ---- User Role Assignments ----

  static async assignRoleToUser(
    payload: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResponse> {
    const res = await api.post(`${BASE}/assignment/create`, payload);
    return res.data;
  }

  static async fetchAssignmentsForUser(
    organizationId: string,
    userId: string
  ): Promise<UserRoleAssignmentResponse[]> {
    const res = await api.post(`${BASE}/assignment/retrieveForUser`, { organizationId, userId });
    return res.data;
  }

  static async fetchAllUserAssignments(organizationId: string): Promise<UserRoleAssignmentResponse[]> {
    const res = await api.post(`${BASE}/assignment/retrieveAll`, { organizationId });
    // Handle both array and paginated response
    return Array.isArray(res.data) ? res.data : res.data?.content ?? [];
  }

  static async fetchUsersWithRole(
    organizationId: string,
    roleCode: string
  ): Promise<UserRoleAssignmentResponse[]> {
    const res = await api.get(`${BASE}/assignment/byRole`, {
      params: { organizationId, roleCode },
    });
    return res.data?.data ?? res.data ?? [];
  }

  static async revokeByRole(organizationId: string, roleCode: string): Promise<void> {
    await api.post(`${BASE}/assignment/revokeByRole`, { organizationId, roleCode });
  }

  static async revokeRoleFromUser(
    organizationId: string,
    assignmentHandle: string,
    revokedBy: string
  ): Promise<void> {
    await api.post(`${BASE}/assignment/revoke`, { organizationId, assignmentHandle, revokedBy });
  }

  static async updateAssignment(
    handle: string,
    assignmentRequest: UserRoleAssignmentRequest
  ): Promise<UserRoleAssignmentResponse> {
    const res = await api.post(`${BASE}/assignment/update`, { handle, assignmentRequest });
    return res.data;
  }

  // ---- Effective Permissions ----

  static async fetchEffectivePermissions(
    organizationId: string,
    userId: string,
    moduleCode?: string
  ): Promise<EffectivePermissionsResponse> {
    const payload: any = { organizationId, userId };
    if (moduleCode) {
      payload.moduleCode = moduleCode;
    }
    const res = await api.post(`${BASE}/effectivePermissions`, payload);
    return res.data;
  }

  static async checkAccess(payload: AccessCheckRequest): Promise<AccessCheckResponse> {
    const res = await api.post(`${BASE}/checkAccess`, payload);
    return res.data;
  }

  // ---- RBAC User Modules (EN-2026-017) ----

  static async fetchUserModulesByOrganization(
    userId: string
  ): Promise<UserModulesByOrganizationResponse> {
    const res = await api.post(`${BASE}/userModulesByOrganization`, { userId });
    return res.data;
  }

  static async updateDefaultSite(
    userId: string,
    newSite: string
  ): Promise<UpdateDefaultSiteResponse> {
    const res = await api.post(`${BASE}/updateDefaultSite`, { userId, newSite });
    return res.data;
  }

  static async getUserSitePreference(
    userId: string
  ): Promise<UpdateDefaultSiteResponse> {
    const res = await api.post(`${BASE}/getUserSitePreference`, { userId });
    return res.data;
  }

  static async initializeSystem(
    request: SystemInitializeRequest
  ): Promise<SystemInitializeResponse> {
    const res = await api.post('/hrm-service/initialize', request);
    return res.data;
  }

  // ---- Permission Matrix ----

  static async fetchPermissionsMatrix(
    organizationId: string,
    moduleCode: string | null,
    roleCode: string | null
  ): Promise<PermissionsMatrixResponse[]> {
    const res = await api.post(`${BASE}/report/permissionsMatrix`, { organizationId, moduleCode, roleCode });
    return res.data;
  }

  // ---- Import / Export ----

  static async exportRoles(organizationId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const res = await api.post(`${BASE}/export/roles`, { organizationId, format }, { responseType: 'blob' });
    return res.data;
  }

  static async importRoles(organizationId: string, file: File, importedBy: string): Promise<ImportResultResponse> {
    const formData = new FormData();
    formData.append('organizationId', organizationId);
    formData.append('file', file);
    formData.append('importedBy', importedBy);
    const res = await api.post(`${BASE}/import/roles`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  static async importUserAssignments(
    organizationId: string,
    file: File,
    importedBy: string
  ): Promise<ImportResultResponse> {
    const formData = new FormData();
    formData.append('organizationId', organizationId);
    formData.append('file', file);
    formData.append('importedBy', importedBy);
    const res = await api.post(`${BASE}/import/userAssignments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ---- Role Clone ----

  static async cloneRole(
    organizationId: string,
    sourceRoleId: string,
    newRoleName: string,
    performedBy: string
  ): Promise<RoleResponse> {
    const res = await api.post(`${BASE}/role/clone`, {
      organizationId,
      sourceRoleId,
      newRoleName,
      performedBy,
    });
    return res.data;
  }

  // ---- Import Preview ----

  static async previewImport(organizationId: string, file: File): Promise<ImportPreviewResponse> {
    const formData = new FormData();
    formData.append('organizationId', organizationId);
    formData.append('file', file);
    const res = await api.post(`${BASE}/import/preview`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  }

  // ---- Export Role Permissions ----

  static async exportRolePermissions(organizationId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const res = await api.post(
      `${BASE}/export/rolePermissions`,
      { organizationId, format },
      { responseType: 'blob' }
    );
    return res.data;
  }

  // ---- Export User Assignments ----

  static async exportUserAssignments(organizationId: string, format: 'csv' | 'json' = 'csv'): Promise<Blob> {
    const res = await api.post(
      `${BASE}/export/userAssignments`,
      { organizationId, format },
      { responseType: 'blob' }
    );
    return res.data;
  }

  // ---- Reports ----

  static async getUserAccessReport(
    organizationId: string,
    userId?: string | null,
    moduleCode?: string | null
  ): Promise<UserAccessReportResponse[]> {
    const res = await api.post(`${BASE}/report/userAccess`, {
      organizationId,
      ...(userId ? { userId } : {}),
      ...(moduleCode ? { moduleCode } : {}),
    });
    return res.data;
  }

  static async getOrphanedExpiredAssignments(
    organizationId: string
  ): Promise<UserRoleAssignmentResponse[]> {
    const res = await api.post(`${BASE}/report/orphanedExpired`, { organizationId });
    return res.data;
  }

  // ---- User Search (Top 50) ----

  static async searchKeycloakUsers(
    organizationId: string,
    query: string
  ): Promise<{ id: string; username: string; firstName: string; lastName: string; email: string }[]> {
    try {
      const res = await api.post('/user-service/retrieveTop50/', {});
      
      // Handle response format: { userList: [...] }
      const userList = res.data?.userList || [];
      
      // Map the response to expected format
      const mappedUsers = userList.map((user: any) => ({
        id: user.user || user.username,
        username: user.user || user.username,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.user || user.username, // Use username as email if not provided
      }));
      
      // Filter by query if provided
      if (query && query.trim()) {
        const searchLower = query.toLowerCase().trim();
        return mappedUsers.filter((user: any) => 
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.username?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchLower)
        );
      }
      
      return mappedUsers;
    } catch (error) {
      console.error('User search error:', error);
      return [];
    }
  }

  // ---- Employee Directory (New) ----

  static async fetchEmployeeDirectory(payload: {
    organizationId?: string;
    page?: number;
    size?: number;
    searchTerm?: string;
    status?: string;
    department?: string;
    businessUnit?: string;
  }): Promise<{
    employees: Array<{
      handle: string;
      isActive: boolean;
      employeeCode: string;
      fullName: string;
      workEmail: string;
      phone: string;
      photoUrl: string | null;
      photoBase64: string;
      status: string;
      department: string;
      role: string;
      location: string;
      businessUnits: string[];
      reportingManager: string;
      reportingManagerName: string;
    }>;
    totalCount: number;
    page: number;
    size: number;
    totalPages: number;
  }> {
    try {
      const res = await api.post('/hrm-service/employee/directory', payload);
      // Response structure: { data: { data: { employees: [...], totalCount, page, size, totalPages } } }
      const responseData = res.data?.data || res.data;
      return responseData || { employees: [], totalCount: 0, page: 0, size: 20, totalPages: 0 };
    } catch (error) {
      console.error('Employee directory error:', error);
      return { employees: [], totalCount: 0, page: 0, size: 20, totalPages: 0 };
    }
  }

  // ---- Audit ----

  static async fetchAuditLog(
    organizationId: string,
    entityType: string,
    entityHandle: string | null,
    page: number,
    size: number
  ): Promise<{ content: RbacAuditLogDto[]; totalElements: number }> {
    const res = await api.post(`${BASE}/audit/retrieve`, { organizationId, entityType, entityHandle, page, size });
    return res.data;
  }
}
