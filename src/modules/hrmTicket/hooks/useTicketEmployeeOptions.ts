'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';

export interface TicketEmployeeOption {
  /** Composite `"<employeeCode> - <fullName>"`, e.g. `"R10192 - Saurav Panth"`. */
  value: string;
  label: string;
  employeeCode: string;
  handle: string;
  department?: string;
  designation?: string;
}

/**
 * The employee directory, for every place the ticket module names a person: support-group members
 * and leads, watchers, and who a ticket is raised on behalf of.
 *
 * <p>Values are the composite `"CODE - Full Name"` rather than a bare code. The ticket backend runs
 * every one of these fields through `EmployeeIdentityUtils.parseCode`, so it accepts either — but
 * the composite is what the rest of HRM stores, and it is the only form that stays readable in an
 * audit entry months later when the picker is nowhere in sight.
 *
 * <p>Sourced from `HrmEmployeeService` directly rather than from another feature module's hook:
 * the dependency that belongs here is ticket → employee, and routing it through Leave would make
 * this module break when Leave changes.
 */
export function useTicketEmployeeOptions(): {
  options: TicketEmployeeOption[];
  employees: EmployeeDirectoryRow[];
  loading: boolean;
  /** Normalises a stored bare code to its composite, so saved values match the picker's options. */
  toComposite: (codeOrComposite?: string) => string | undefined;
  toCompositeList: (codes?: string[]) => string[];
} {
  const [employees, setEmployees] = useState<EmployeeDirectoryRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const organizationId = getOrganizationId();
    if (!organizationId) return undefined;
    let cancelled = false;
    setLoading(true);
    // One page large enough for the whole directory: these are pickers, and paging them would mean
    // an agent who happens to sort late in the alphabet simply cannot be selected.
    HrmEmployeeService.fetchDirectory({ organizationId, page: 0, size: 1000 })
      .then((res) => {
        if (!cancelled) setEmployees(res?.employees ?? []);
      })
      .catch(() => {
        // Silent: the forms still accept free text, so a failed directory degrades to typing a
        // code rather than blocking the screen.
        if (!cancelled) setEmployees([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo<TicketEmployeeOption[]>(
    () =>
      employees
        .filter((emp) => emp.employeeCode)
        .map((emp) => {
          const composite = emp.fullName ? `${emp.employeeCode} - ${emp.fullName}` : emp.employeeCode;
          return {
            value: composite,
            label: composite,
            employeeCode: emp.employeeCode,
            handle: emp.handle,
            department: emp.department,
            designation: emp.designation,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [employees],
  );

  const byCode = useMemo(() => {
    const map = new Map<string, string>();
    options.forEach((o) => map.set(o.employeeCode, o.value));
    return map;
  }, [options]);

  const toComposite = useCallback(
    (codeOrComposite?: string) => {
      if (!codeOrComposite) return undefined;
      // Already composite, or an unknown code we pass through untouched — a member who has since
      // left the directory must still show in the group they are listed in, not vanish from it.
      if (codeOrComposite.includes(' - ')) return codeOrComposite;
      return byCode.get(codeOrComposite) ?? codeOrComposite;
    },
    [byCode],
  );

  const toCompositeList = useCallback(
    (codes?: string[]) => (codes ?? []).map((c) => toComposite(c) as string).filter(Boolean),
    [toComposite],
  );

  return { options, employees, loading, toComposite, toCompositeList };
}
