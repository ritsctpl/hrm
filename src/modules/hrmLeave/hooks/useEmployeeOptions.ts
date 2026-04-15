"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";
import { HrmEmployeeService } from "@/modules/hrmEmployee/services/hrmEmployeeService";

export interface EmployeeOption {
  value: string;
  label: string;
}

export function useEmployeeOptions(): { options: EmployeeOption[]; loading: boolean } {
  const [options, setOptions] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const site = parseCookies().site;
    if (!site) return;
    let cancelled = false;
    setLoading(true);
    HrmEmployeeService.fetchDirectory({ site, page: 0, size: 1000 })
      .then((res) => {
        if (cancelled) return;
        setOptions(
          (res.employees || []).map((emp) => ({
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

  return { options, loading };
}
