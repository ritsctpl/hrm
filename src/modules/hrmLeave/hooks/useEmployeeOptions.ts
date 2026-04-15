"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";
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
    const site = parseCookies().site;
    if (!site) return;
    let cancelled = false;
    setLoading(true);
    HrmEmployeeService.fetchDirectory({ site, page: 0, size: 1000 })
      .then((res) => {
        if (cancelled) return;
        const rows = res.employees || [];
        setEmployees(rows);
        setOptions(
          rows.map((emp) => ({
            value: emp.employeeCode,
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
