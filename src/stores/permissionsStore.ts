import { create } from 'zustand';
import { HrmAccessService } from '@/modules/hrmAccess/services/hrmAccessService';
import type { EffectivePermissionsResponse, EffectivePermissionEntry } from '@/modules/hrmAccess/types/api.types';

interface PermissionsState {
  // Permissions data
  permissions: EffectivePermissionEntry[];
  userId: string | null;
  userDisplayName: string | null;
  evaluatedAt: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  fetchEffectivePermissions: (site: string, userId: string, moduleCode?: string) => Promise<void>;
  hasPermission: (moduleCode: string, objectName: string, action: string) => boolean;
  getModulePermissions: (moduleCode: string) => EffectivePermissionEntry[];
  clearPermissions: () => void;
}

export const usePermissionsStore = create<PermissionsState>((set, get) => ({
  permissions: [],
  userId: null,
  userDisplayName: null,
  evaluatedAt: null,
  loading: false,
  error: null,

  fetchEffectivePermissions: async (site: string, userId: string, moduleCode?: string) => {
    set({ loading: true, error: null });
    try {
      const response: EffectivePermissionsResponse = await HrmAccessService.fetchEffectivePermissions(
        site,
        userId,
        moduleCode
      );

      set({
        permissions: response.permissions || [],
        userId: response.userId,
        userDisplayName: response.userDisplayName,
        evaluatedAt: response.evaluatedAt,
        loading: false,
        error: null,
      });
    } catch (error: any) {
      console.error('Failed to fetch effective permissions:', error);
      set({
        loading: false,
        error: error?.message || 'Failed to fetch permissions',
      });
    }
  },

  hasPermission: (moduleCode: string, objectName: string, action: string) => {
    const { permissions } = get();
    return permissions.some(
      (p) =>
        p.moduleCode === moduleCode &&
        p.objectName === objectName &&
        p.action === action
    );
  },

  getModulePermissions: (moduleCode: string) => {
    const { permissions } = get();
    return permissions.filter((p) => p.moduleCode === moduleCode);
  },

  clearPermissions: () => {
    set({
      permissions: [],
      userId: null,
      userDisplayName: null,
      evaluatedAt: null,
      loading: false,
      error: null,
    });
  },
}));
