"use client";

import { useEffect, useState } from "react";
import { getOrganizationId } from "@/utils/cookieUtils";
import { HrmEmployeeService } from "@/modules/hrmEmployee/services/hrmEmployeeService";

/**
 * Announcements identify people by employee code — `createdBy`,
 * `currentApproverId` and `supervisorId` are all codes, never names. "R10138"
 * tells a reader nothing about who wrote the notice or who is sitting on it,
 * so resolve codes to names from the employee directory.
 *
 * One fetch per page load, shared across every card and table that asks:
 * the module-level cache means twenty cards resolve twenty authors without
 * twenty requests. Unknown codes fall back to the code itself, which is still
 * more useful than a blank.
 */
const PAGE_SIZE = 500;

let cache: Record<string, string> | null = null;
let inFlight: Promise<Record<string, string>> | null = null;

async function loadNames(organizationId: string): Promise<Record<string, string>> {
  if (cache) return cache;
  inFlight ??= HrmEmployeeService.fetchDirectory({
    organizationId,
    isActive: true,
    page: 0,
    size: PAGE_SIZE,
  })
    .then((res) => {
      const map: Record<string, string> = {};
      for (const row of res?.employees ?? []) {
        if (row.employeeCode && row.fullName) map[row.employeeCode] = row.fullName;
      }
      cache = map;
      return map;
    })
    .catch(() => {
      // The directory is permission-gated and this is decoration, not
      // function. Cache the empty result so a denial is not retried on every
      // render; callers fall back to showing the code.
      cache = {};
      return cache;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

export function useEmployeeNames() {
  const organizationId = getOrganizationId();
  const [names, setNames] = useState<Record<string, string>>(cache ?? {});

  useEffect(() => {
    if (!organizationId) return;
    let alive = true;
    loadNames(organizationId).then((map) => {
      if (alive) setNames(map);
    });
    return () => {
      alive = false;
    };
  }, [organizationId]);

  /** The person's name, or the code when the directory doesn't know it. */
  const nameOf = (code?: string | null): string => (code ? names[code] ?? code : "");

  return { nameOf };
}
