/**
 * Global Permissions Store
 * Manages effective permissions for the current user across all modules
 * Fetches from /hrm-service/rbac/effectivePermissions and caches the result
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@services/api';
import { parseCookies } from 'nookies';

export interface Permission {
  moduleCode: string;
  moduleName: string;
  objectName: string;
  action: string;
  scopeValue: string;
  grantedByRoles: string[];
}

export interface EffectivePermissionsResponse {
  userId: string;
  userDisplayName: string | null;
  permissions: Permission[];
  evaluatedAt: string;
}

interface PermissionsState {
  // State
  permissions: Permission[];
  userId: string | null;
  userDisplayName: string | null;
  evaluatedAt: string | null;
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;

  // Actions
  fetchPermissions: (userId?: string) => Promise<void>;
  hasPermission: (moduleCode: string, objectName: string, action: string) => boolean;
  getModulePermissions: (moduleCode: string) => Permission[];
  getObjectPermissions: (moduleCode: string, objectName: string) => Permission[];
  clearPermissions: () => void;
  reset: () => void;
}

const initialState = {
  permissions: [],
  userId: null,
  userDisplayName: null,
  evaluatedAt: null,
  isLoading: false,
  isLoaded: false,
  error: null,
};

export const usePermissionsStore = create<PermissionsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Fetch effective permissions for the current user
       */
      fetchPermissions: async (userId?: string) => {
        const state = get();
        
        // If already loaded and not expired (cache for 5 minutes), skip fetch
        if (state.isLoaded && state.evaluatedAt) {
          const evaluatedTime = new Date(state.evaluatedAt).getTime();
          const now = Date.now();
          const fiveMinutes = 5 * 60 * 1000;
          
          if (now - evaluatedTime < fiveMinutes) {
            console.log('Using cached permissions');
            return;
          }
        }

        set({ isLoading: true, error: null });

        try {
          // Get userId from parameter or cookies
          const cookies = parseCookies();
          const effectiveUserId = userId || cookies.username || 'rits_hrm_admin';

          console.log('Fetching permissions for user:', effectiveUserId);

          const response = await api.post('/hrm-service/rbac/effectivePermissions', {
            userId: effectiveUserId,
          });

          const data: EffectivePermissionsResponse = response.data;

          set({
            permissions: data.permissions || [],
            userId: data.userId,
            userDisplayName: data.userDisplayName,
            evaluatedAt: data.evaluatedAt,
            isLoading: false,
            isLoaded: true,
            error: null,
          });

          console.log(`Loaded ${data.permissions?.length || 0} permissions for user ${data.userId}`);
        } catch (error: any) {
          const errorMsg = error.response?.data?.message || error.message || 'Failed to fetch permissions';
          console.error('Error fetching permissions:', errorMsg);
          
          set({
            isLoading: false,
            isLoaded: false,
            error: errorMsg,
          });
        }
      },

      /**
       * Check if user has a specific permission
       * @param moduleCode - Module code (e.g., 'HRM_EMPLOYEE')
       * @param objectName - Object name (e.g., 'employee', 'addresses')
       * @param action - Action (e.g., 'VIEW', 'ADD', 'EDIT', 'DELETE')
       */
      hasPermission: (moduleCode: string, objectName: string, action: string) => {
        const { permissions } = get();
        
        return permissions.some(
          (p) =>
            p.moduleCode === moduleCode &&
            p.objectName === objectName &&
            p.action === action
        );
      },

      /**
       * Get all permissions for a specific module
       */
      getModulePermissions: (moduleCode: string) => {
        const { permissions } = get();
        return permissions.filter((p) => p.moduleCode === moduleCode);
      },

      /**
       * Get all permissions for a specific object within a module
       */
      getObjectPermissions: (moduleCode: string, objectName: string) => {
        const { permissions } = get();
        return permissions.filter(
          (p) => p.moduleCode === moduleCode && p.objectName === objectName
        );
      },

      /**
       * Clear permissions (useful for logout)
       */
      clearPermissions: () => {
        set(initialState);
      },

      /**
       * Reset store to initial state
       */
      reset: () => {
        set(initialState);
      },
    }),
    {
      name: 'hrm-permissions-storage', // localStorage key
      partialize: (state) => ({
        // Only persist these fields
        permissions: state.permissions,
        userId: state.userId,
        userDisplayName: state.userDisplayName,
        evaluatedAt: state.evaluatedAt,
        isLoaded: state.isLoaded,
      }),
    }
  )
);

/**
 * Hook to easily check permissions in components
 */
export const usePermission = (moduleCode: string, objectName: string, action: string) => {
  const hasPermission = usePermissionsStore((state) => state.hasPermission);
  return hasPermission(moduleCode, objectName, action);
};

/**
 * Hook to get all permissions for a module
 */
export const useModulePermissions = (moduleCode: string) => {
  const getModulePermissions = usePermissionsStore((state) => state.getModulePermissions);
  return getModulePermissions(moduleCode);
};

/**
 * Hook to get all permissions for an object
 */
export const useObjectPermissions = (moduleCode: string, objectName: string) => {
  const getObjectPermissions = usePermissionsStore((state) => state.getObjectPermissions);
  return getObjectPermissions(moduleCode, objectName);
};
