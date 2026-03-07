"use client";

import { useMemo } from "react";
import { LeavePermissions } from "../types/ui.types";
import { HR_ROLES, SUPERVISOR_ROLES } from "../utils/constants";

export function useLeavePermissions(role: string): LeavePermissions {
  return useMemo(() => {
    const isHr = HR_ROLES.includes(role);
    const isSuperadmin = role === "SUPERADMIN";
    const isSupervisor = SUPERVISOR_ROLES.includes(role);
    const isEmployee = role === "EMPLOYEE";

    return {
      canApply: isEmployee || isSupervisor || isHr,
      canCancel: isEmployee || isSupervisor || isHr,
      canApprove: isSupervisor || isHr,
      canReject: isSupervisor || isHr,
      canEscalate: isHr,
      canReassign: isHr,
      canOverride: isHr,
      canViewAll: isHr,
      canPostAccrual: isHr,
      canAdjust: isHr,
      canCreditCompOff: isHr,
      canManagePolicy: isHr,
      canExportPayroll: isHr,
      canLockPayrollMonth: isHr,
      canRunYearEnd: isSuperadmin,
    };
  }, [role]);
}
