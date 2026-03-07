import { create } from 'zustand';
import type { Role, Permission, RolePermission, UserRoleAssignment, ModuleRegistry } from '../types/domain.types';
import type { KeycloakUserSummaryUI } from '../types/ui.types';

// ---- Sub-state shapes ----

interface RoleState {
  list: Role[];
  selected: Role | null;
  isCreating: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isDeleting: boolean;
  searchText: string;
  errors: Record<string, string>;
  draft: Partial<Role> | null;
}

interface PermissionState {
  allPermissions: Permission[];
  allModules: ModuleRegistry[];
  rolePermissions: RolePermission[];
  selectedPermissionHandles: Set<string>;
  isLoadingPermissions: boolean;
  isSavingPermissions: boolean;
  moduleFilter: string | null;
}

interface PermissionMatrixState {
  isLoading: boolean;
  moduleFilter: string | null;
  roleFilter: string | null;
  matrixData: Record<string, Record<string, Record<string, boolean>>>;
}

interface UserAssignmentState {
  userSearchText: string;
  userSearchResults: KeycloakUserSummaryUI[];
  isSearchingUsers: boolean;
  selectedUserId: string | null;
  selectedUserName: string | null;
  selectedUserEmail: string | null;
  assignments: UserRoleAssignment[];
  isLoadingAssignments: boolean;
  isAssigning: boolean;
  isRevoking: boolean;
  assignmentDraft: Partial<UserRoleAssignmentDraft> | null;
  errors: Record<string, string>;
}

interface UserRoleAssignmentDraft {
  roleCode: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  assignmentNotes: string | null;
}

// ---- Full store shape ----

interface HrmAccessStore {
  activeMainTab: 'roleManagement' | 'permissionMatrix' | 'userRoleAssignment';
  role: RoleState;
  permission: PermissionState;
  permissionMatrix: PermissionMatrixState;
  userAssignment: UserAssignmentState;

  setActiveMainTab: (tab: HrmAccessStore['activeMainTab']) => void;

  // Role Management
  setRoles: (list: Role[]) => void;
  selectRole: (role: Role | null) => void;
  setRoleCreating: (v: boolean) => void;
  setRoleLoading: (v: boolean) => void;
  setRoleSaving: (v: boolean) => void;
  setRoleDeleting: (v: boolean) => void;
  setRoleSearch: (text: string) => void;
  updateRoleDraft: (patch: Partial<Role>) => void;
  setRoleErrors: (errors: Record<string, string>) => void;
  clearRoleDraft: () => void;

  // Permissions
  setAllPermissions: (permissions: Permission[]) => void;
  setAllModules: (modules: ModuleRegistry[]) => void;
  setRolePermissions: (assignments: RolePermission[]) => void;
  togglePermission: (permissionHandle: string) => void;
  setSelectedPermissionHandles: (handles: Set<string>) => void;
  setPermissionModuleFilter: (moduleCode: string | null) => void;
  setLoadingPermissions: (v: boolean) => void;
  setSavingPermissions: (v: boolean) => void;

  // Permission Matrix
  setMatrixLoading: (v: boolean) => void;
  setMatrixData: (data: PermissionMatrixState['matrixData']) => void;
  setMatrixModuleFilter: (v: string | null) => void;
  setMatrixRoleFilter: (v: string | null) => void;

  // User-Role Assignment
  setUserSearchText: (text: string) => void;
  setUserSearchResults: (users: KeycloakUserSummaryUI[]) => void;
  setSearchingUsers: (v: boolean) => void;
  selectUser: (userId: string, userName: string, userEmail: string) => void;
  setUserAssignments: (list: UserRoleAssignment[]) => void;
  setLoadingAssignments: (v: boolean) => void;
  setAssigning: (v: boolean) => void;
  setRevoking: (v: boolean) => void;
  updateAssignmentDraft: (patch: Partial<UserRoleAssignmentDraft>) => void;
  setAssignmentErrors: (errors: Record<string, string>) => void;
  clearAssignmentDraft: () => void;
}

export const useHrmAccessStore = create<HrmAccessStore>((set) => ({
  activeMainTab: 'roleManagement',

  role: {
    list: [],
    selected: null,
    isCreating: false,
    isLoading: false,
    isSaving: false,
    isDeleting: false,
    searchText: '',
    errors: {},
    draft: null,
  },

  permission: {
    allPermissions: [],
    allModules: [],
    rolePermissions: [],
    selectedPermissionHandles: new Set(),
    isLoadingPermissions: false,
    isSavingPermissions: false,
    moduleFilter: null,
  },

  permissionMatrix: {
    isLoading: false,
    moduleFilter: null,
    roleFilter: null,
    matrixData: {},
  },

  userAssignment: {
    userSearchText: '',
    userSearchResults: [],
    isSearchingUsers: false,
    selectedUserId: null,
    selectedUserName: null,
    selectedUserEmail: null,
    assignments: [],
    isLoadingAssignments: false,
    isAssigning: false,
    isRevoking: false,
    assignmentDraft: null,
    errors: {},
  },

  setActiveMainTab: (tab) => set({ activeMainTab: tab }),

  // Role Management
  setRoles: (list) => set((s) => ({ role: { ...s.role, list, isLoading: false } })),
  selectRole: (role) =>
    set((s) => ({
      role: { ...s.role, selected: role, isCreating: false, draft: role ? { ...role } : null, errors: {} },
      permission: { ...s.permission, selectedPermissionHandles: new Set(), rolePermissions: [] },
    })),
  setRoleCreating: (v) =>
    set((s) => ({
      role: { ...s.role, isCreating: v, selected: null, draft: v ? {} : null, errors: {} },
    })),
  setRoleLoading: (v) => set((s) => ({ role: { ...s.role, isLoading: v } })),
  setRoleSaving: (v) => set((s) => ({ role: { ...s.role, isSaving: v } })),
  setRoleDeleting: (v) => set((s) => ({ role: { ...s.role, isDeleting: v } })),
  setRoleSearch: (text) => set((s) => ({ role: { ...s.role, searchText: text } })),
  updateRoleDraft: (patch) =>
    set((s) => ({ role: { ...s.role, draft: { ...s.role.draft, ...patch } } })),
  setRoleErrors: (errors) => set((s) => ({ role: { ...s.role, errors } })),
  clearRoleDraft: () => set((s) => ({ role: { ...s.role, draft: null, errors: {} } })),

  // Permissions
  setAllPermissions: (permissions) =>
    set((s) => ({ permission: { ...s.permission, allPermissions: permissions } })),
  setAllModules: (modules) =>
    set((s) => ({ permission: { ...s.permission, allModules: modules } })),
  setRolePermissions: (assignments) => {
    const handles = new Set(assignments.map((rp) => rp.permissionHandle));
    set((s) => ({
      permission: {
        ...s.permission,
        rolePermissions: assignments,
        selectedPermissionHandles: handles,
        isLoadingPermissions: false,
      },
    }));
  },
  togglePermission: (permissionHandle) =>
    set((s) => {
      const updated = new Set(s.permission.selectedPermissionHandles);
      if (updated.has(permissionHandle)) updated.delete(permissionHandle);
      else updated.add(permissionHandle);
      return { permission: { ...s.permission, selectedPermissionHandles: updated } };
    }),
  setSelectedPermissionHandles: (handles) =>
    set((s) => ({ permission: { ...s.permission, selectedPermissionHandles: handles } })),
  setPermissionModuleFilter: (moduleCode) =>
    set((s) => ({ permission: { ...s.permission, moduleFilter: moduleCode } })),
  setLoadingPermissions: (v) =>
    set((s) => ({ permission: { ...s.permission, isLoadingPermissions: v } })),
  setSavingPermissions: (v) =>
    set((s) => ({ permission: { ...s.permission, isSavingPermissions: v } })),

  // Matrix
  setMatrixLoading: (v) =>
    set((s) => ({ permissionMatrix: { ...s.permissionMatrix, isLoading: v } })),
  setMatrixData: (data) =>
    set((s) => ({ permissionMatrix: { ...s.permissionMatrix, matrixData: data, isLoading: false } })),
  setMatrixModuleFilter: (v) =>
    set((s) => ({ permissionMatrix: { ...s.permissionMatrix, moduleFilter: v } })),
  setMatrixRoleFilter: (v) =>
    set((s) => ({ permissionMatrix: { ...s.permissionMatrix, roleFilter: v } })),

  // User Assignment
  setUserSearchText: (text) =>
    set((s) => ({ userAssignment: { ...s.userAssignment, userSearchText: text } })),
  setUserSearchResults: (users) =>
    set((s) => ({
      userAssignment: { ...s.userAssignment, userSearchResults: users, isSearchingUsers: false },
    })),
  setSearchingUsers: (v) =>
    set((s) => ({ userAssignment: { ...s.userAssignment, isSearchingUsers: v } })),
  selectUser: (userId, userName, userEmail) =>
    set((s) => ({
      userAssignment: {
        ...s.userAssignment,
        selectedUserId: userId,
        selectedUserName: userName,
        selectedUserEmail: userEmail,
        assignments: [],
        assignmentDraft: null,
        errors: {},
      },
    })),
  setUserAssignments: (list) =>
    set((s) => ({
      userAssignment: { ...s.userAssignment, assignments: list, isLoadingAssignments: false },
    })),
  setLoadingAssignments: (v) =>
    set((s) => ({ userAssignment: { ...s.userAssignment, isLoadingAssignments: v } })),
  setAssigning: (v) =>
    set((s) => ({ userAssignment: { ...s.userAssignment, isAssigning: v } })),
  setRevoking: (v) =>
    set((s) => ({ userAssignment: { ...s.userAssignment, isRevoking: v } })),
  updateAssignmentDraft: (patch) =>
    set((s) => ({
      userAssignment: {
        ...s.userAssignment,
        assignmentDraft: { ...s.userAssignment.assignmentDraft, ...patch },
      },
    })),
  setAssignmentErrors: (errors) =>
    set((s) => ({ userAssignment: { ...s.userAssignment, errors } })),
  clearAssignmentDraft: () =>
    set((s) => ({
      userAssignment: { ...s.userAssignment, assignmentDraft: null, errors: {} },
    })),
}));
