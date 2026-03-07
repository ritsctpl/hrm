import { DashboardRole, WidgetLayout } from "../types/domain.types";

export const EMPLOYEE_DEFAULT_WIDGETS = [
  "ProfileSummaryWidget",
  "LeaveBalanceWidget",
  "PendingRequestsWidget",
  "RecentPayslipsWidget",
  "MyGoalsWidget",
  "UpcomingHolidaysWidget",
  "AnnouncementsWidget",
];

export const MANAGER_DEFAULT_WIDGETS = [
  "TeamOverviewWidget",
  "PendingApprovalsWidget",
  "TeamLeaveCalendarWidget",
];

export const HR_DEFAULT_WIDGETS = [
  "HrKpiRow",
  "HeadcountTrendWidget",
  "DepartmentDistributionWidget",
  "AttritionGaugeWidget",
  "LeaveUtilizationWidget",
  "HrAlertsWidget",
];

export const ADMIN_DEFAULT_WIDGETS = [
  "SystemHealthWidget",
  "ModuleUsageWidget",
  "AuditActivityWidget",
  "AdminAlertsWidget",
];

export const WIDGET_LABELS: Record<string, string> = {
  ProfileSummaryWidget: "Profile Summary",
  LeaveBalanceWidget: "Leave Balance",
  PendingRequestsWidget: "Pending Requests",
  RecentPayslipsWidget: "Recent Payslips",
  MyGoalsWidget: "My Goals",
  UpcomingHolidaysWidget: "Upcoming Holidays",
  AnnouncementsWidget: "Announcements",
  TeamOverviewWidget: "Team Overview",
  PendingApprovalsWidget: "Pending Approvals",
  TeamLeaveCalendarWidget: "Team Leave Calendar",
  HrKpiRow: "HR KPIs",
  HeadcountTrendWidget: "Headcount Trend",
  DepartmentDistributionWidget: "Department Distribution",
  AttritionGaugeWidget: "Attrition Gauge",
  LeaveUtilizationWidget: "Leave Utilization",
  HrAlertsWidget: "HR Alerts",
  SystemHealthWidget: "System Health",
  ModuleUsageWidget: "Module Usage",
  AuditActivityWidget: "Audit Activity",
  AdminAlertsWidget: "Admin Alerts",
};

export const HR_ROLES: DashboardRole[] = ["HR", "HR_MANAGER"];
export const MANAGER_ROLES: DashboardRole[] = ["MANAGER", "HR_MANAGER"];
export const ADMIN_ROLES: DashboardRole[] = ["ADMIN", "SUPERADMIN"];

export function getDashboardRole(role: string): DashboardRole {
  if (ADMIN_ROLES.includes(role as DashboardRole)) return "ADMIN";
  if (HR_ROLES.includes(role as DashboardRole)) return "HR";
  if (MANAGER_ROLES.includes(role as DashboardRole)) return "MANAGER";
  return "EMPLOYEE";
}
