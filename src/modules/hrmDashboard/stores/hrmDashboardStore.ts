import { create } from "zustand";
import {
  DashboardRole,
  EmployeeProfile,
  LeaveBalance,
  PendingRequest,
  PayslipSummary,
  GoalProgress,
  HolidayItem,
  AnnouncementAlert,
  TeamOverviewStats,
  TeamMember,
  ApprovalCount,
  HeadcountTrendData,
  DeptDistributionItem,
  AttritionData,
  LeaveUtilizationItem,
  HrAlert,
  SystemHealthData,
  ModuleUsageItem,
  AuditActivityItem,
  KpiData,
  WidgetLayout,
} from "../types/domain.types";

interface HrmDashboardState {
  dashboardRole: DashboardRole;
  activeWidgets: string[];
  widgetLayout: WidgetLayout[];
  showCustomizeDrawer: boolean;

  // Employee data
  employeeProfile: EmployeeProfile | null;
  leaveBalances: LeaveBalance[];
  pendingRequests: PendingRequest[];
  recentPayslips: PayslipSummary[];
  myGoals: GoalProgress[];
  goalsOverall: number;
  upcomingHolidays: HolidayItem[];
  announcementAlerts: AnnouncementAlert[];

  // Manager data
  teamOverviewStats: TeamOverviewStats | null;
  teamMembers: TeamMember[];
  pendingApprovals: ApprovalCount[];

  // HR data
  hrKpis: KpiData[];
  headcountTrend: HeadcountTrendData[];
  deptDistribution: DeptDistributionItem[];
  attritionData: AttritionData | null;
  leaveUtilization: LeaveUtilizationItem[];
  hrAlerts: HrAlert[];

  // Admin data
  systemHealth: SystemHealthData | null;
  moduleUsage: ModuleUsageItem[];
  auditActivity: AuditActivityItem[];
  adminAlerts: HrAlert[];

  // Loading states
  loadingProfile: boolean;
  loadingLeaveBalances: boolean;
  loadingPendingRequests: boolean;
  loadingPayslips: boolean;
  loadingGoals: boolean;
  loadingHolidays: boolean;
  loadingAnnouncements: boolean;
  loadingTeamOverview: boolean;
  loadingApprovals: boolean;
  loadingHrData: boolean;
  loadingAdminData: boolean;

  // Actions
  setDashboardRole: (role: DashboardRole) => void;
  setActiveWidgets: (widgets: string[]) => void;
  setWidgetLayout: (layout: WidgetLayout[]) => void;
  setShowCustomizeDrawer: (v: boolean) => void;
  setEmployeeProfile: (profile: EmployeeProfile | null) => void;
  setLeaveBalances: (balances: LeaveBalance[]) => void;
  setPendingRequests: (requests: PendingRequest[]) => void;
  setRecentPayslips: (payslips: PayslipSummary[]) => void;
  setMyGoals: (goals: GoalProgress[], overall: number) => void;
  setUpcomingHolidays: (holidays: HolidayItem[]) => void;
  setAnnouncementAlerts: (announcements: AnnouncementAlert[]) => void;
  setTeamOverviewStats: (stats: TeamOverviewStats | null) => void;
  setTeamMembers: (members: TeamMember[]) => void;
  setPendingApprovals: (approvals: ApprovalCount[]) => void;
  setHrKpis: (kpis: KpiData[]) => void;
  setHeadcountTrend: (data: HeadcountTrendData[]) => void;
  setDeptDistribution: (data: DeptDistributionItem[]) => void;
  setAttritionData: (data: AttritionData | null) => void;
  setLeaveUtilization: (data: LeaveUtilizationItem[]) => void;
  setHrAlerts: (alerts: HrAlert[]) => void;
  setSystemHealth: (data: SystemHealthData | null) => void;
  setModuleUsage: (data: ModuleUsageItem[]) => void;
  setAuditActivity: (data: AuditActivityItem[]) => void;
  setAdminAlerts: (alerts: HrAlert[]) => void;
  setLoadingProfile: (v: boolean) => void;
  setLoadingLeaveBalances: (v: boolean) => void;
  setLoadingPendingRequests: (v: boolean) => void;
  setLoadingPayslips: (v: boolean) => void;
  setLoadingGoals: (v: boolean) => void;
  setLoadingHolidays: (v: boolean) => void;
  setLoadingAnnouncements: (v: boolean) => void;
  setLoadingTeamOverview: (v: boolean) => void;
  setLoadingApprovals: (v: boolean) => void;
  setLoadingHrData: (v: boolean) => void;
  setLoadingAdminData: (v: boolean) => void;
}

export const useHrmDashboardStore = create<HrmDashboardState>((set) => ({
  dashboardRole: "EMPLOYEE",
  activeWidgets: [],
  widgetLayout: [],
  showCustomizeDrawer: false,
  employeeProfile: null,
  leaveBalances: [],
  pendingRequests: [],
  recentPayslips: [],
  myGoals: [],
  goalsOverall: 0,
  upcomingHolidays: [],
  announcementAlerts: [],
  teamOverviewStats: null,
  teamMembers: [],
  pendingApprovals: [],
  hrKpis: [],
  headcountTrend: [],
  deptDistribution: [],
  attritionData: null,
  leaveUtilization: [],
  hrAlerts: [],
  systemHealth: null,
  moduleUsage: [],
  auditActivity: [],
  adminAlerts: [],
  loadingProfile: false,
  loadingLeaveBalances: false,
  loadingPendingRequests: false,
  loadingPayslips: false,
  loadingGoals: false,
  loadingHolidays: false,
  loadingAnnouncements: false,
  loadingTeamOverview: false,
  loadingApprovals: false,
  loadingHrData: false,
  loadingAdminData: false,

  setDashboardRole: (dashboardRole) => set({ dashboardRole }),
  setActiveWidgets: (activeWidgets) => set({ activeWidgets }),
  setWidgetLayout: (widgetLayout) => set({ widgetLayout }),
  setShowCustomizeDrawer: (showCustomizeDrawer) => set({ showCustomizeDrawer }),
  setEmployeeProfile: (employeeProfile) => set({ employeeProfile }),
  setLeaveBalances: (leaveBalances) => set({ leaveBalances }),
  setPendingRequests: (pendingRequests) => set({ pendingRequests }),
  setRecentPayslips: (recentPayslips) => set({ recentPayslips }),
  setMyGoals: (myGoals, goalsOverall) => set({ myGoals, goalsOverall }),
  setUpcomingHolidays: (upcomingHolidays) => set({ upcomingHolidays }),
  setAnnouncementAlerts: (announcementAlerts) => set({ announcementAlerts }),
  setTeamOverviewStats: (teamOverviewStats) => set({ teamOverviewStats }),
  setTeamMembers: (teamMembers) => set({ teamMembers }),
  setPendingApprovals: (pendingApprovals) => set({ pendingApprovals }),
  setHrKpis: (hrKpis) => set({ hrKpis }),
  setHeadcountTrend: (headcountTrend) => set({ headcountTrend }),
  setDeptDistribution: (deptDistribution) => set({ deptDistribution }),
  setAttritionData: (attritionData) => set({ attritionData }),
  setLeaveUtilization: (leaveUtilization) => set({ leaveUtilization }),
  setHrAlerts: (hrAlerts) => set({ hrAlerts }),
  setSystemHealth: (systemHealth) => set({ systemHealth }),
  setModuleUsage: (moduleUsage) => set({ moduleUsage }),
  setAuditActivity: (auditActivity) => set({ auditActivity }),
  setAdminAlerts: (adminAlerts) => set({ adminAlerts }),
  setLoadingProfile: (loadingProfile) => set({ loadingProfile }),
  setLoadingLeaveBalances: (loadingLeaveBalances) => set({ loadingLeaveBalances }),
  setLoadingPendingRequests: (loadingPendingRequests) => set({ loadingPendingRequests }),
  setLoadingPayslips: (loadingPayslips) => set({ loadingPayslips }),
  setLoadingGoals: (loadingGoals) => set({ loadingGoals }),
  setLoadingHolidays: (loadingHolidays) => set({ loadingHolidays }),
  setLoadingAnnouncements: (loadingAnnouncements) => set({ loadingAnnouncements }),
  setLoadingTeamOverview: (loadingTeamOverview) => set({ loadingTeamOverview }),
  setLoadingApprovals: (loadingApprovals) => set({ loadingApprovals }),
  setLoadingHrData: (loadingHrData) => set({ loadingHrData }),
  setLoadingAdminData: (loadingAdminData) => set({ loadingAdminData }),
}));
