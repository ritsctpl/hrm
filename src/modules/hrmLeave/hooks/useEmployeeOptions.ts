"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from "@/modules/hrmEmployee/services/hrmEmployeeService";
import type { EmployeeDirectoryRow } from "@/modules/hrmEmployee/types/api.types";

export interface EmployeeOption {
  /**
   * Composite identifier `"<employeeCode> - <fullName>"` (e.g. "EMP-2 -
   * Shanmathi M M"). The leave service stores and queries employees by
   * this composite — sending raw UUID handle returns no rows / fails
   * resolution. See `useEmployeeIdentity` doc for the contract.
   */
  value: string;
  label: string;
  /** Underlying directory row, in case a caller needs the UUID handle. */
  handle: string;
}

export function useEmployeeOptions(): {
  options: EmployeeOption[];
  employees: EmployeeDirectoryRow[];
  loading: boolean;
} {
  const [options, setOptions] = useState<EmployeeOption[]>([]);
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    let cancelled = false;
    setLoading(true);
    HrmEmployeeService.fetchDirectory({ organizationId, page: 0, size: 1000 })
      .then((res) => {
        if (cancelled) return;
        const rows = res.employees || [];
        setEmployees(rows);
        setOptions(
          rows.map((emp) => {
            const composite =
              emp.employeeCode && emp.fullName
                ? `${emp.employeeCode} - ${emp.fullName}`
                : emp.employeeCode || emp.handle;
            return {
              // Composite is what the leave backend persists in employeeId
              // fields and what it filters by. UUID handle stays available
              // separately for the rare cross-module FK case.
              value: composite,
              label: composite,
              handle: emp.handle,
            };
          }),
        );
      })
      .catch(() => {
        // silent — caller still gets [] and can fall back
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, employees, loading };
}
