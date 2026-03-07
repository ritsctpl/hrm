'use client';

import { useMemo } from 'react';

export interface AssetPermissions {
  canViewAssets: boolean;
  canCreateAsset: boolean;
  canEditAsset: boolean;
  canAssignAsset: boolean;
  canMaintainAsset: boolean;
  canRunDepreciation: boolean;
  canManageCategories: boolean;
  canViewRequests: boolean;
  canCreateRequest: boolean;
  canApproveSupervisor: boolean;
  canApproveAdmin: boolean;
  canAllocate: boolean;
  isAdmin: boolean;
  isSupervisor: boolean;
  isAssetManager: boolean;
}

const ROLE_PERMISSIONS: Record<string, Partial<AssetPermissions>> = {
  ADMIN: {
    canViewAssets: true,
    canCreateAsset: true,
    canEditAsset: true,
    canAssignAsset: true,
    canMaintainAsset: true,
    canRunDepreciation: true,
    canManageCategories: true,
    canViewRequests: true,
    canCreateRequest: true,
    canApproveSupervisor: false,
    canApproveAdmin: true,
    canAllocate: true,
    isAdmin: true,
    isSupervisor: false,
    isAssetManager: true,
  },
  ASSET_MANAGER: {
    canViewAssets: true,
    canCreateAsset: true,
    canEditAsset: true,
    canAssignAsset: true,
    canMaintainAsset: true,
    canRunDepreciation: true,
    canManageCategories: true,
    canViewRequests: true,
    canCreateRequest: false,
    canApproveSupervisor: false,
    canApproveAdmin: false,
    canAllocate: true,
    isAdmin: false,
    isSupervisor: false,
    isAssetManager: true,
  },
  SUPERVISOR: {
    canViewAssets: true,
    canCreateAsset: false,
    canEditAsset: false,
    canAssignAsset: false,
    canMaintainAsset: false,
    canRunDepreciation: false,
    canManageCategories: false,
    canViewRequests: true,
    canCreateRequest: true,
    canApproveSupervisor: true,
    canApproveAdmin: false,
    canAllocate: false,
    isAdmin: false,
    isSupervisor: true,
    isAssetManager: false,
  },
  EMPLOYEE: {
    canViewAssets: false,
    canCreateAsset: false,
    canEditAsset: false,
    canAssignAsset: false,
    canMaintainAsset: false,
    canRunDepreciation: false,
    canManageCategories: false,
    canViewRequests: true,
    canCreateRequest: true,
    canApproveSupervisor: false,
    canApproveAdmin: false,
    canAllocate: false,
    isAdmin: false,
    isSupervisor: false,
    isAssetManager: false,
  },
};

const DEFAULTS: AssetPermissions = {
  canViewAssets: false,
  canCreateAsset: false,
  canEditAsset: false,
  canAssignAsset: false,
  canMaintainAsset: false,
  canRunDepreciation: false,
  canManageCategories: false,
  canViewRequests: false,
  canCreateRequest: false,
  canApproveSupervisor: false,
  canApproveAdmin: false,
  canAllocate: false,
  isAdmin: false,
  isSupervisor: false,
  isAssetManager: false,
};

export function useHrmAssetPermissions(role: string): AssetPermissions {
  return useMemo(() => {
    const normalized = role?.toUpperCase() ?? '';
    const rolePerms = ROLE_PERMISSIONS[normalized] ?? {};
    return { ...DEFAULTS, ...rolePerms };
  }, [role]);
}
