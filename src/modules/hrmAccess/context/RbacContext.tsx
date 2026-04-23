'use client';

import React, { createContext, useContext } from 'react';
import { useHrmRbacStore } from '../stores/hrmRbacStore';
import type { PermissionAction } from '../types/api.types';
import type {
  OrganizationModules,
  EnrichedModule,
  ModuleSectionPermissions,
} from '../types/rbac.types';

export interface RbacContextType {
  currentOrganizationId: string;
  userId: string;
  isSuperAdmin: boolean;
  organizations: OrganizationModules[];
  currentOrgModules: EnrichedModule[];
  modulesByCategory: Record<string, EnrichedModule[]>;
  isLoading: boolean;
  isReady: boolean;
  hasModuleAccess: (appUrl: string) => boolean;
  getModuleActions: (moduleCode: string) => PermissionAction[];
  switchOrganization: (site: string) => void;
  loadSectionPermissions: (moduleCode: string) => Promise<void>;
  getSectionPermissions: (moduleCode: string) => ModuleSectionPermissions | null;
}

const RbacContext = createContext<RbacContextType | null>(null);

export function RbacContextProvider({ children }: { children: React.ReactNode }) {
  const store = useHrmRbacStore();

  const value: RbacContextType = {
    currentOrganizationId: store.currentOrganizationId,
    userId: store.userId,
    isSuperAdmin: store.isSuperAdmin,
    organizations: store.organizations,
    currentOrgModules: store.currentOrgModules,
    modulesByCategory: store.modulesByCategory,
    isLoading: store.isLoading,
    isReady: store.isReady,
    hasModuleAccess: store.hasModuleAccess,
    getModuleActions: store.getModuleActions,
    switchOrganization: store.switchOrganization,
    loadSectionPermissions: store.loadSectionPermissions,
    getSectionPermissions: store.getSectionPermissions,
  };

  return <RbacContext.Provider value={value}>{children}</RbacContext.Provider>;
}

export function useRbacContext(): RbacContextType {
  const ctx = useContext(RbacContext);
  if (!ctx) {
    throw new Error('useRbacContext must be used within an RbacContextProvider');
  }
  return ctx;
}
