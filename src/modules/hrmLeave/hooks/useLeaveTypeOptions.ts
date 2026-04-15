"use client";

import { useEffect, useState } from "react";
import { parseCookies } from "nookies";
import { HrmLeaveService } from "../services/hrmLeaveService";
import type { LeaveType } from "../types/api.types";

export interface LeaveTypeOption {
  value: string;
  label: string;
}

export function useLeaveTypeOptions(): {
  options: LeaveTypeOption[];
  leaveTypes: LeaveType[];
  loading: boolean;
} {
  const [options, setOptions] = useState<LeaveTypeOption[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const site = parseCookies().site;
    if (!site) return;
    let cancelled = false;
    setLoading(true);
    HrmLeaveService.getAllLeaveTypes({ site })
      .then((res) => {
        if (cancelled) return;
        const list = res ?? [];
        setLeaveTypes(list);
        setOptions(
          list.map((lt) => ({
            value: lt.code,
            label: `${lt.code} - ${lt.name}`,
          })),
        );
      })
      .catch(() => {
        // silent — caller still gets [] and a not-loading state
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { options, leaveTypes, loading };
}
