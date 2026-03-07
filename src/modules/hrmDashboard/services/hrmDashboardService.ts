import api from "@/services/api";
import {
  GetEmployeeDashboardPayload,
  GetManagerDashboardPayload,
  GetHrDashboardPayload,
  GetAdminDashboardPayload,
  SaveLayoutPayload,
} from "../types/api.types";

const BASE = "app/v1/hrm-service/dashboard";

export class HrmDashboardService {
  static async getEmployeeDashboard(payload: GetEmployeeDashboardPayload) {
    const res = await api.post(`${BASE}/employee`, payload);
    return res.data;
  }

  static async getManagerDashboard(payload: GetManagerDashboardPayload) {
    const res = await api.post(`${BASE}/manager`, payload);
    return res.data;
  }

  static async getHrDashboard(payload: GetHrDashboardPayload) {
    const res = await api.post(`${BASE}/hr`, payload);
    return res.data;
  }

  static async getAdminDashboard(payload: GetAdminDashboardPayload) {
    const res = await api.post(`${BASE}/admin`, payload);
    return res.data;
  }

  static async getLeaveBalances(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/leave-balances`, { site, employeeId });
    return res.data;
  }

  static async getPendingRequests(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/pending-requests`, { site, employeeId });
    return res.data;
  }

  static async getRecentPayslips(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/recent-payslips`, { site, employeeId });
    return res.data;
  }

  static async getMyGoals(site: string, employeeId: string) {
    const res = await api.post(`${BASE}/my-goals`, { site, employeeId });
    return res.data;
  }

  static async getUpcomingHolidays(site: string) {
    const res = await api.post(`${BASE}/upcoming-holidays`, { site });
    return res.data;
  }

  static async getTeamOverview(site: string, managerId: string) {
    const res = await api.post(`${BASE}/team-overview`, { site, managerId });
    return res.data;
  }

  static async getPendingApprovals(site: string, managerId: string) {
    const res = await api.post(`${BASE}/pending-approvals`, { site, managerId });
    return res.data;
  }

  static async getHrKpis(site: string, fiscalYear?: string) {
    const res = await api.post(`${BASE}/hr-kpis`, { site, fiscalYear });
    return res.data;
  }

  static async getHeadcountTrend(site: string, months: number = 12) {
    const res = await api.post(`${BASE}/headcount-trend`, { site, months });
    return res.data;
  }

  static async getDeptDistribution(site: string) {
    const res = await api.post(`${BASE}/dept-distribution`, { site });
    return res.data;
  }

  static async getAttritionData(site: string, fiscalYear?: string) {
    const res = await api.post(`${BASE}/attrition`, { site, fiscalYear });
    return res.data;
  }

  static async getLeaveUtilization(site: string, fiscalYear?: string) {
    const res = await api.post(`${BASE}/leave-utilization`, { site, fiscalYear });
    return res.data;
  }

  static async getHrAlerts(site: string) {
    const res = await api.post(`${BASE}/hr-alerts`, { site });
    return res.data;
  }

  static async getSystemHealth(site: string) {
    const res = await api.post(`${BASE}/system-health`, { site });
    return res.data;
  }

  static async getModuleUsage(site: string) {
    const res = await api.post(`${BASE}/module-usage`, { site });
    return res.data;
  }

  static async getAuditActivity(site: string, limit: number = 10) {
    const res = await api.post(`${BASE}/audit-activity`, { site, limit });
    return res.data;
  }

  static async getAdminAlerts(site: string) {
    const res = await api.post(`${BASE}/admin-alerts`, { site });
    return res.data;
  }

  static async saveLayout(payload: SaveLayoutPayload): Promise<void> {
    await api.post(`${BASE}/save-layout`, payload);
  }

  static async getLayout(site: string, employeeId: string, role: string) {
    const res = await api.post(`${BASE}/get-layout`, { site, employeeId, role });
    return res.data;
  }

  static async resetLayout(site: string, employeeId: string, role: string): Promise<void> {
    await api.post(`${BASE}/reset-layout`, { site, employeeId, role });
  }
}
