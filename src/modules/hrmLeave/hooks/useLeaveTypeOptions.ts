"use client";

import { useEffect, useMemo, useState } from "react";
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmLeaveService } from "../services/hrmLeaveService";
import type { LeaveType } from "../types/api.types";

export interface LeaveTypeOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface LeaveTypeFilters {
  employeeGender?: string;
  employeeJoiningDate?: string;
}

/**
 * Fetches all leave types and returns them as select options, optionally
 * filtering by employee gender and probation status.
 *
 * - Gender filter: if the leave type has `applicableGender` that is not 'ALL'
 *   and does not match `employeeGender`, the option is marked disabled with a
 *   "(Not applicable)" suffix.
 * - Probation filter: TODO — requires fetching effective policies per leave
 *   type which is expensive; the backend already validates at submit time.
 */
export function useLeaveTypeOptions(filters?: LeaveTypeFilters): {
  options: LeaveTypeOption[];
  leaveTypes: LeaveType[];
  loading: boolean;
} {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;
    let cancelled = false;
    setLoading(true);
    HrmLeaveService.getAllLeaveTypes({ organizationId })
      .then((res) => {
        if (cancelled) return;
        setLeaveTypes(res ?? []);
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

  const options = useMemo(() => {
    const gender = filters?.employeeGender?.toUpperCase();

    return leaveTypes.map((lt): LeaveTypeOption => {
      // Gender check: treat missing / 'ALL' as universally applicable
      const applicable = lt.applicableGender ?? 'ALL';
      const genderMismatch =
        gender && applicable !== 'ALL' && applicable !== gender;

      // TODO: probation check requires policy data per leave type.
      // The backend already rejects requests with state "probation_restricted"
      // so for now we only do a client-side gender filter.

      if (genderMismatch) {
        return {
          value: lt.code,
          label: `${lt.code} - ${lt.name} (Not applicable)`,
          disabled: true,
        };
      }

      return {
        value: lt.code,
        label: `${lt.code} - ${lt.name}`,
      };
    });
  }, [leaveTypes, filters?.employeeGender]);

  return { options, leaveTypes, loading };
}
