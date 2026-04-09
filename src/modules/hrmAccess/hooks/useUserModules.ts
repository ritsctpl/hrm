import { useState, useEffect } from 'react';
import { parseCookies } from 'nookies';
import { HrmAccessService } from '../services/hrmAccessService';
import type { UserModulesByOrganizationResponse } from '../types/rbac.types';

export const useUserModules = () => {
  const [modules, setModules] = useState<UserModulesByOrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const cookies = parseCookies();
        const userEmail = cookies.userEmail || cookies.rl_user_id;
        
        if (!userEmail) {
          throw new Error('User email not found');
        }

        const data = await HrmAccessService.fetchUserModulesByOrganization(userEmail);
        setModules(data);
      } catch (err) {
        console.error('Failed to fetch user modules:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch modules');
      } finally {
        setLoading(false);
      }
    };

    fetchModules();
  }, []);

  return { modules, loading, error };
};
