import { useEffect } from 'react';
import { useHrmRbacStore } from '../stores/hrmRbacStore';
import type { ModuleSectionPermissions } from '../types/rbac.types';

interface UseSectionPermissionsResult {
  sectionPermissions: ModuleSectionPermissions | null;
  isLoading: boolean;
}

export function useSectionPermissions(moduleCode: string): UseSectionPermissionsResult {
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const sectionPermissions = useHrmRbacStore(s => s.sectionPermissionCache[moduleCode] ?? null);
  const isReady = useHrmRbacStore(s => s.isReady);

  useEffect(() => {
    if (isReady && moduleCode) {
      loadSectionPermissions(moduleCode);
    }
  }, [isReady, moduleCode, loadSectionPermissions]);

  return {
    sectionPermissions,
    isLoading: isReady && !sectionPermissions,
  };
}
