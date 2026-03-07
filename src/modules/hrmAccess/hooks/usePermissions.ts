import { useCallback } from 'react';
import { notification } from 'antd';
import { useHrmAccessStore } from '../stores/hrmAccessStore';
import { HrmAccessService } from '../services/hrmAccessService';

export function usePermissions(site: string) {
  const store = useHrmAccessStore();

  const loadModulesAndPermissions = useCallback(async () => {
    if (!site) return;
    try {
      const [modules, permissions] = await Promise.all([
        HrmAccessService.fetchAllModules(site),
        HrmAccessService.fetchAllPermissions(site),
      ]);
      store.setAllModules(modules);
      store.setAllPermissions(permissions);
    } catch {
      notification.error({ message: 'Failed to load modules/permissions.' });
    }
  }, [site, store]);

  const loadPermissionsMatrix = useCallback(
    async (moduleFilter: string | null, roleFilter: string | null) => {
      if (!site) return;
      store.setMatrixLoading(true);
      try {
        await HrmAccessService.fetchPermissionsMatrix(site, moduleFilter, roleFilter);
        store.setMatrixLoading(false);
      } catch {
        notification.error({ message: 'Failed to load permissions matrix.' });
        store.setMatrixLoading(false);
      }
    },
    [site, store]
  );

  return { loadModulesAndPermissions, loadPermissionsMatrix };
}
