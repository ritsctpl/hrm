import { useEffect, useState } from 'react';
import api from '@/services/api';
import { getOrganizationId } from '@/utils/cookieUtils';

/**
 * Grade options, read from the site's GRADE lookup rather than a constant.
 *
 * fe-spec: once an employee's grade selects their salary structure, a hardcoded list that drifts
 * from the master is not a cosmetic problem — it produces the wrong split.
 */
export function useGradeOptions() {
  const [options, setOptions] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .post('/hrm-service/lookup/list', {
        organizationId: getOrganizationId(),
        lookupType: 'GRADE',
      })
      .then((res) => {
        const body = res.data?.response ?? res.data?.data ?? res.data;
        const list = Array.isArray(body) ? body : [];
        if (cancelled) return;
        setOptions(
          list
            .filter((l: any) => l?.code || l?.value)
            .map((l: any) => ({
              value: String(l.code ?? l.value),
              label: String(l.name ?? l.label ?? l.code ?? l.value),
            })),
        );
      })
      .catch(() => {
        if (!cancelled) setOptions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { gradeOptions: options, gradeOptionsLoading: loading };
}
