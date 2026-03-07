import api from "@/services/api";
import {
  GetEmployeeDashboardPayload,
  GetManagerDashboardPayload,
  GetHrDashboardPayload,
  GetAdminDashboardPayload,
  SaveLayoutPayload,
} from "../types/api.types";

const BASE = "/hrm-service/dashboard";

export class HrmDashboardService {
  static async getEmployeeDashboard(payload: GetEmployeeDashboardPayload) {
    const res = await api.post(`${BASE}/getEmployeeDashboard`, payload);
    return res.data;
  }

  static async getManagerDashboard(payload: GetManagerDashboardPayload) {
    const res = await api.post(`${BASE}/getManagerDashboard`, payload);
    return res.data;
  }

  static async getHrDashboard(payload: GetHrDashboardPayload) {
    const res = await api.post(`${BASE}/getHrDashboard`, payload);
    return res.data;
  }

  static async getAdminDashboard(payload: GetAdminDashboardPayload) {
    const res = await api.post(`${BASE}/getAdminDashboard`, payload);
    return res.data;
  }

  static async getLeaveBalances(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, employeeId, widgetType: "LEAVE_BALANCES" });
    return res.data;
  }

  static async getPendingRequests(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, employeeId, widgetType: "PENDING_REQUESTS" });
    return res.data;
  }

  static async getRecentPayslips(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, employeeId, widgetType: "RECENT_PAYSLIPS" });
    return res.data;
  }

  static async getMyGoals(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, employeeId, widgetType: "MY_GOALS" });
    return res.data;
  }

  static async getUpcomingHolidays(site: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, widgetType: "UPCOMING_HOLIDAYS" });
    return res.data;
  }

  static async getTeamOverview(site: string, managerId: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, managerId, widgetType: "TEAM_OVERVIEW" });
    return res.data;
  }

  static async getPendingApprovals(site: string, managerId: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, managerId, widgetType: "PENDING_APPROVALS" });
    return res.data;
  }

  static async getHrKpis(site: string, fiscalYear?: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, fiscalYear, widgetType: "HR_KPIS" });
    return res.data;
  }

  static async getHeadcountTrend(site: string, months: number = 12) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, months, widgetType: "HEADCOUNT_TREND" });
    return res.data;
  }

  static async getDeptDistribution(site: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, widgetType: "DEPT_DISTRIBUTION" });
    return res.data;
  }

  static async getAttritionData(site: string, fiscalYear?: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, fiscalYear, widgetType: "ATTRITION" });
    return res.data;
  }

  static async getLeaveUtilization(site: string, fiscalYear?: string) {
    const res = await api.post(`${BASE}/getWidgetData`, { site, fiscalYear, widgetType: "LEAVE_UTILIZATION" });
    return res.data;
  }

  static async getHrAlerts(site: string) {
    const res = await api.post(`${BASE}/getAlerts`, { site });
    return res.data;
  }

  static async getSystemHealth(site: string) {
    const res = await api.post(`${BASE}/getSnapshot`, { site, snapshotType: "SYSTEM_HEALTH" });
    return res.data;
  }

  static async getModuleUsage(site: string) {
    const res = await api.post(`${BASE}/getSnapshot`, { site, snapshotType: "MODULE_USAGE" });
    return res.data;
  }

  static async getAuditActivity(site: string, limit: number = 10) {
    const res = await api.post(`${BASE}/getSnapshot`, { site, snapshotType: "AUDIT_ACTIVITY", limit });
    return res.data;
  }

  static async getAdminAlerts(site: string) {
    const res = await api.post(`${BASE}/getAlerts`, { site, alertType: "ADMIN" });
    return res.data;
  }

  static async saveLayout(payload: SaveLayoutPayload): Promise<void> {
    await api.post(`${BASE}/saveLayout`, payload);
  }

  static async getLayout(site: string, employeeId: string, role: string) {
    const res = await api.post(`${BASE}/getLayout`, { site, employeeId, role });
    return res.data;
  }

  static async resetLayout(site: string, employeeId: string, role: string): Promise<void> {
    await api.post(`${BASE}/resetLayout`, { site, employeeId, role });
  }

  static async getComplianceDashboard(site: string) {
    const res = await api.post(`${BASE}/getComplianceDashboard`, { site });
    return res.data;
  }

  static async getAuditDashboard(site: string) {
    const res = await api.post(`${BASE}/getAuditDashboard`, { site });
    return res.data;
  }
}
