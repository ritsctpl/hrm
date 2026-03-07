'use client';

import { useMemo } from "react";
import { parseCookies } from "nookies";

export type AppraisalRole = "EMPLOYEE" | "MANAGER" | "HR" | "ADMIN";

export interface AppraisalAuthResult {
  role: AppraisalRole;
  isEmployee: boolean;
  isManager: boolean;
  isHr: boolean;
  isAdmin: boolean;
  canViewCalibration: boolean;
  canManageCycles: boolean;
  canReviewTeam: boolean;
  visibleTabs: string[];
}

export function useAppraisalAuth(): AppraisalAuthResult {
  const role = (parseCookies().role ?? "EMPLOYEE") as AppraisalRole;

  return useMemo(() => {
    const isEmployee = true;
    const isManager = role === "MANAGER" || role === "ADMIN";
    const isHr = role === "HR" || role === "ADMIN";
    const isAdmin = role === "ADMIN";

    const visibleTabs = ["my-appraisal"];
    if (isManager) visibleTabs.push("team-reviews");
    if (isHr) visibleTabs.push("calibration", "cycle-admin");

    return {
      role,
      isEmployee,
      isManager,
      isHr,
      isAdmin,
      canViewCalibration: isHr,
      canManageCycles: isHr,
      canReviewTeam: isManager,
      visibleTabs,
    };
  }, [role]);
}
