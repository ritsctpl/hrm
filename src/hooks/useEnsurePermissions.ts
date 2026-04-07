/**
 * Hook to ensure permissions are loaded before rendering module content
 * Automatically fetches permissions if not already loaded
 */

import { useEffect } from 'react';
import { usePermissionsStore } from '@/stores/permissionsStore';

export const useEnsurePermissions = () => {
  const { isLoaded, isLoading, fetchPermissions } = usePermissionsStore();

  useEffect(() => {
    // If permissions are not loaded and not currently loading, fetch them
    if (!isLoaded && !isLoading) {
      fetchPermissions();
    }
  }, [isLoaded, isLoading, fetchPermissions]);

  return { isLoaded, isLoading };
};
