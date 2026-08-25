import { useState, useEffect } from 'react';
import { HrmAccessService } from '../services/hrmAccessService';
import { useEmployeeIdentity } from './useEmployeeIdentity';
import type { UserModulesByOrganizationResponse } from '../types/rbac.types';

export const useUserModules = () => {
  const [modules, setModules] = useState<UserModulesByOrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // `hrm_user_role_assignment` is keyed by workEmail, not the Keycloak
  // login (often a bare username, e.g. "shanmathi" for a reporting
  // manager) — see useEmployeeIdentity's doc comment. Sending the login
  // straight from a cookie silently returns an empty module list.
  const { workEmail, isReady } = useEmployeeIdentity();

  useEffect(() => {
    if (!isReady) return;

    const fetchModules = async () => {
      try {
        if (!workEmail) {
          throw new Error('User email not found');
        }

        const data = await HrmAccessService.fetchUserModulesByOrganization(workEmail);
        setModules(data);
      } catch (err) {
        console.error('Failed to fetch user modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, [isReady, workEmail]);

  return { modules, loading, error };
};
