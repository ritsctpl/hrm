import { useCallback } from 'react';
import { notification } from 'antd';
import { useHrmAccessStore } from '../stores/hrmAccessStore';
import { HrmAccessService } from '../services/hrmAccessService';

export function usePermissions(organizationId: string) {
  const store = useHrmAccessStore();

  const loadModulesAndPermissions = useCallback(async () => {
    if (!organizationId) return;
    try {
      const [modules, permissions] = await Promise.all([
        HrmAccessService.fetchAllModules(organizationId),
        HrmAccessService.fetchAllPermissions(organizationId),
      ]);
      store.setAllModules(modules);
      store.setAllPermissions(permissions);
    } catch {
      notification.error({ message: 'Failed to load modules/permissions.' });
    }
  }, [organizationId, store]);

  const loadPermissionsMatrix = useCallback(
    async (moduleFilter: string | null, roleFilter: string | null) => {
      if (!organizationId) return;
      store.setMatrixLoading(true);
      try {
        await HrmAccessService.fetchPermissionsMatrix(organizationId, moduleFilter, roleFilter);
        store.setMatrixLoading(false);
      } catch {
        notification.error({ message: 'Failed to load permissions matrix.' });
        store.setMatrixLoading(false);
      }
    },
    [organizationId, store]
  );

  return { loadModulesAndPermissions, loadPermissionsMatrix };
}
