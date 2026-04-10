'use client';

import React, { createContext, useContext, useMemo } from 'react';
import { useHrmRbacStore } from '../stores/hrmRbacStore';
import type { ModulePermissions } from '../stores/hrmRbacStore';

interface ModulePermissionContextValue {
  moduleCode: string;
  perms: ModulePermissions;
}

const ModulePermissionContext = createContext<ModulePermissionContextValue | null>(null);

interface ProviderProps {
  moduleCode: string;
  children: React.ReactNode;
}

export const ModulePermissionProvider: React.FC<ProviderProps> = ({ moduleCode, children }) => {
  const perms = useHrmRbacStore(s => s.permissionsByModule[moduleCode]);

  const value = useMemo<ModulePermissionContextValue>(
    () => ({
      moduleCode,
      perms: perms || { canView: false, canAdd: false, canEdit: false, canDelete: false },
    }),
    [moduleCode, perms],
  );

  return <ModulePermissionContext.Provider value={value}>{children}</ModulePermissionContext.Provider>;
};

export function useModulePermissionContext(): ModulePermissionContextValue | null {
  return useContext(ModulePermissionContext);
}
