import { useEffect, useState, useCallback } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { EmployeeLookupService, type LookupType } from '../services/employeeLookupService';

/**
 * Fetches the configured values for a lookup type (GRADE / DESIGNATION) as plain
 * strings for a Select. Used by the onboarding wizard and official-details tab so
 * the dropdowns reflect whatever the admin configured (no hardcoded lists).
 */
export function useEmployeeLookups(lookupType: LookupType) {
  const [values, setValues] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    setLoading(true);
    EmployeeLookupService.list(organizationId, lookupType)
      .then((rows) => setValues(rows.map((r) => r.value)))
      .catch(() => setValues([]))
      .finally(() => setLoading(false));
  }, [lookupType]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { values, loading, reload };
}
