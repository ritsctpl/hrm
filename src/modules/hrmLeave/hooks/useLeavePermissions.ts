"use client";

import { useMemo } from "react";
import { useCan } from "../../hrmAccess/hooks/useCan";
import { LeavePermissions } from "../types/ui.types";
import { HR_ROLES, SUPERVISOR_ROLES } from "../utils/constants";

/**
 * Enhanced RBAC-based permissions for Leave Management module.
 * Uses granular object-level permissions from the RBAC system.
 * 
 * Object codes from moduleObjectRegistry:
 * - leave_module: Module Access
 * - leave_request: Leave Request
 * - leave_balance: Balance
 * - leave_policy: Policy
 * - leave_approval: Approval Queue
 * - leave_hr_queue: HR Queue
 * - leave_calendar: Calendar
 * - leave_team_calendar: Team Calendar
 * - leave_accrual: Accrual
 * - leave_comp_off: Comp Off
 * - leave_adjustment: Ledger Adjustment
 * - leave_ledger: Ledger
 * - leave_report: Reports
 * - leave_year_end: Year-End Operations
 * - leave_payroll_export: Payroll Export
 * - leave_payroll_lock: Payroll Lock
 * - leave_approval_config: Approval Config
 */
export function useLeavePermissions(role: string): LeavePermissions {
  // Get RBAC permissions for each object
  const modulePerms = useCan("HRM_LEAVE", "leave_module");
  const requestPerms = useCan("HRM_LEAVE", "leave_request");
  const balancePerms = useCan("HRM_LEAVE", "leave_balance");
  const policyPerms = useCan("HRM_LEAVE", "leave_policy");
  const approvalPerms = useCan("HRM_LEAVE", "leave_approval");
  const hrQueuePerms = useCan("HRM_LEAVE", "leave_hr_queue");
  const calendarPerms = useCan("HRM_LEAVE", "leave_calendar");
  const teamCalendarPerms = useCan("HRM_LEAVE", "leave_team_calendar");
  const accrualPerms = useCan("HRM_LEAVE", "leave_accrual");
  const compOffPerms = useCan("HRM_LEAVE", "leave_comp_off");
  const adjustmentPerms = useCan("HRM_LEAVE", "leave_adjustment");
  const ledgerPerms = useCan("HRM_LEAVE", "leave_ledger");
  const reportPerms = useCan("HRM_LEAVE", "leave_report");
  const yearEndPerms = useCan("HRM_LEAVE", "leave_year_end");
  const payrollExportPerms = useCan("HRM_LEAVE", "leave_payroll_export");
  const payrollLockPerms = useCan("HRM_LEAVE", "leave_payroll_lock");
  const approvalConfigPerms = useCan("HRM_LEAVE", "leave_approval_config");

  return useMemo(() => {
    const isHr = HR_ROLES.includes(role);
    const isSuperadmin = role === "SUPERADMIN";
    const isSupervisor = SUPERVISOR_ROLES.includes(role);
    const isEmployee = role === "EMPLOYEE";

    return {
      // Module access
      canViewModule: modulePerms.canView,
      
      // Leave Request permissions
      canViewRequests: requestPerms.canView,
      canApply: requestPerms.canAdd,
      canEditRequests: requestPerms.canEdit,
      canDeleteRequests: requestPerms.canDelete,
      canCancel: requestPerms.canEdit || (isEmployee || isSupervisor || isHr),
      
      // Balance permissions
      canViewBalance: balancePerms.canView,
      canEditBalance: balancePerms.canEdit,
      
      // Policy permissions
      canViewPolicy: policyPerms.canView,
      canEditPolicy: policyPerms.canEdit,
      canAddPolicy: policyPerms.canAdd,
      canDeletePolicy: policyPerms.canDelete,
      canManagePolicy: policyPerms.canEdit || policyPerms.canAdd || policyPerms.canDelete,
      
      // Approval Queue permissions
      canViewApprovalQueue: approvalPerms.canView,
      canApprove: approvalPerms.canEdit,
      canReject: approvalPerms.canEdit,
      canEscalate: approvalPerms.canEdit && isHr,
      canReassign: approvalPerms.canEdit && isHr,
      canOverride: approvalPerms.canEdit && isHr,
      
      // HR Queue permissions
      canViewHrQueue: hrQueuePerms.canView,
      canViewAll: hrQueuePerms.canView,
      
      // Calendar permissions
      canViewCalendar: calendarPerms.canView,
      canViewTeamCalendar: teamCalendarPerms.canView,
      
      // Accrual permissions
      canViewAccrual: accrualPerms.canView,
      canPostAccrual: accrualPerms.canAdd,
      canEditAccrual: accrualPerms.canEdit,
      
      // Comp Off permissions
      canViewCompOff: compOffPerms.canView,
      canAddCompOff: compOffPerms.canAdd,
      canEditCompOff: compOffPerms.canEdit,
      canCreditCompOff: compOffPerms.canAdd,
      
      // Ledger Adjustment permissions
      canViewAdjustment: adjustmentPerms.canView,
      canAdjust: adjustmentPerms.canAdd || adjustmentPerms.canEdit,
      canAddAdjustment: adjustmentPerms.canAdd,
      canEditAdjustment: adjustmentPerms.canEdit,
      
      // Ledger permissions
      canViewLedger: ledgerPerms.canView,
      canEditLedger: ledgerPerms.canEdit,
      
      // Reports permissions
      canViewReports: reportPerms.canView,
      canExportReports: reportPerms.canEdit,
      
      // Year-End Operations permissions
      canViewYearEnd: yearEndPerms.canView,
      canRunYearEnd: yearEndPerms.canAdd || (isSuperadmin && yearEndPerms.canView),
      
      // Payroll Export permissions
      canViewPayrollExport: payrollExportPerms.canView,
      canExportPayroll: payrollExportPerms.canAdd,
      
      // Payroll Lock permissions
      canViewPayrollLock: payrollLockPerms.canView,
      canLockPayrollMonth: payrollLockPerms.canAdd,
      
      // Approval Config permissions
      canViewApprovalConfig: approvalConfigPerms.canView,
      canEditApprovalConfig: approvalConfigPerms.canEdit,
    };
  }, [
    modulePerms, requestPerms, balancePerms, policyPerms, approvalPerms,
    hrQueuePerms, calendarPerms, teamCalendarPerms, accrualPerms, compOffPerms,
    adjustmentPerms, ledgerPerms, reportPerms, yearEndPerms, payrollExportPerms,
    payrollLockPerms, approvalConfigPerms, role
  ]);
}

/**
 * Legacy hook for backward compatibility.
 * @deprecated Use useLeavePermissions instead for RBAC-based permissions.
 */
export function useLeavePermissionsLegacy(role: string): LeavePermissions {
  return useMemo(() => {
    const isHr = HR_ROLES.includes(role);
    const isSuperadmin = role === "SUPERADMIN";
    const isSupervisor = SUPERVISOR_ROLES.includes(role);
    const isEmployee = role === "EMPLOYEE";

    return {
      canViewModule: true,
      canViewRequests: true,
      canApply: isEmployee || isSupervisor || isHr,
      canEditRequests: isEmployee || isSupervisor || isHr,
      canDeleteRequests: isEmployee || isSupervisor || isHr,
      canCancel: isEmployee || isSupervisor || isHr,
      canViewBalance: true,
      canEditBalance: isHr,
      canViewPolicy: isHr,
      canEditPolicy: isHr,
      canAddPolicy: isHr,
      canDeletePolicy: isHr,
      canManagePolicy: isHr,
      canViewApprovalQueue: isSupervisor || isHr,
      canApprove: isSupervisor || isHr,
      canReject: isSupervisor || isHr,
      canEscalate: isHr,
      canReassign: isHr,
      canOverride: isHr,
      canViewHrQueue: isHr,
      canViewAll: isHr,
      canViewCalendar: true,
      canViewTeamCalendar: isSupervisor || isHr,
      canViewAccrual: isHr,
      canPostAccrual: isHr,
      canEditAccrual: isHr,
      canViewCompOff: true,
      canAddCompOff: isEmployee || isSupervisor || isHr,
      canEditCompOff: isSupervisor || isHr,
      canCreditCompOff: isHr,
      canViewAdjustment: isHr,
      canAdjust: isHr,
      canAddAdjustment: isHr,
      canEditAdjustment: isHr,
      canViewLedger: isHr,
      canEditLedger: isHr,
      canViewReports: isHr,
      canExportReports: isHr,
      canViewYearEnd: isSuperadmin,
      canRunYearEnd: isSuperadmin,
      canViewPayrollExport: isHr,
      canExportPayroll: isHr,
      canViewPayrollLock: isHr,
      canLockPayrollMonth: isHr,
      canViewApprovalConfig: isHr,
      canEditApprovalConfig: isHr,
    };
  }, [role]);
}
