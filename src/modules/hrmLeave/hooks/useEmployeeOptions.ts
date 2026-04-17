"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from "@/modules/hrmEmployee/services/hrmEmployeeService";
import type { EmployeeDirectoryRow } from "@/modules/hrmEmployee/types/api.types";

export interface EmployeeOption {
  value: string;
  label: string;
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
          rows.map((emp) => ({
            // Use handle as the option value so downstream API calls
            // (fetchProfile, getEmployeeBalances, ...) get the UUID the
            // backend identifies employees by, not the human-friendly code.
            value: emp.handle,
            label: `${emp.employeeCode} - ${emp.fullName}`,
          })),
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
