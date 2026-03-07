'use client';
// src/modules/hrmTimesheet/services/hrmTimesheetService.ts
import api from '@/services/api';
import type {
  TimesheetRequest,
  TimesheetResponse,
  WeeklyTimesheetResponse,
  TimesheetSubmitRequest,
  WeeklyBulkSubmitRequest,
  BulkSubmitResponse,
  TimesheetApprovalRequest,
  BulkTimesheetApprovalRequest,
  BulkApprovalResponse,
  TimesheetReopenRequest,
  TeamTimesheetSummaryResponse,
  UnplannedCategoryResponse,
  PayrollExportRow,
  SubmissionComplianceReport,
  UnplannedWorkReport,
  HolidayWorkingSummary,
} from '../types/api.types';

export class HrmTimesheetService {
  private static readonly BASE = '/hrm-service/timesheet';

  // ─── Timesheet CRUD ───────────────────────────────────────────────────────

  static async saveTimesheet(payload: TimesheetRequest): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/save`, payload);
    return res.data;
  }

  static async getTimesheet(site: string, handle: string): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/getByDate`, { site, handle });
    return res.data;
  }

  static async getTimesheetByDate(site: string, employeeId: string, date: string): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/getByDate`, { site, employeeId, date });
    return res.data;
  }

  static async getWeeklyTimesheet(site: string, employeeId: string, weekStartDate: string): Promise<WeeklyTimesheetResponse> {
    const res = await api.post(`${this.BASE}/weeklyView`, { site, employeeId, weekStartDate });
    return res.data;
  }

  static async listTimesheets(site: string, employeeId: string, startDate: string, endDate: string): Promise<TimesheetResponse[]> {
    const res = await api.post(`${this.BASE}/list`, { site, employeeId, startDate, endDate });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  static async submitTimesheet(payload: TimesheetSubmitRequest): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/submit`, payload);
    return res.data;
  }

  static async bulkSubmitWeekly(payload: WeeklyBulkSubmitRequest): Promise<BulkSubmitResponse> {
    const res = await api.post(`${this.BASE}/bulkSubmit`, payload);
    return res.data;
  }

  // ─── Approval ─────────────────────────────────────────────────────────────

  static async approveOrReject(payload: TimesheetApprovalRequest): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/approve`, payload);
    return res.data;
  }

  static async bulkApproveOrReject(payload: BulkTimesheetApprovalRequest): Promise<BulkApprovalResponse> {
    const res = await api.post(`${this.BASE}/bulkApprove`, payload);
    return res.data;
  }

  // ─── Reopen ───────────────────────────────────────────────────────────────

  static async reopenTimesheet(payload: TimesheetReopenRequest): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/reopen`, payload);
    return res.data;
  }

  // ─── Team View ────────────────────────────────────────────────────────────

  static async getTeamTimesheets(site: string, supervisorId: string, startDate: string, endDate: string): Promise<TeamTimesheetSummaryResponse[]> {
    const res = await api.post(`${this.BASE}/teamView`, { site, supervisorId, startDate, endDate });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPendingApprovals(site: string, supervisorId: string): Promise<TimesheetResponse[]> {
    const res = await api.post(`${this.BASE}/pendingApprovals`, { site, supervisorId });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Copy / Quick Fill ────────────────────────────────────────────────────

  static async copyFromPreviousDay(site: string, employeeId: string, targetDate: string, createdBy: string): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/copyFromPrevious`, { site, employeeId, targetDate, createdBy });
    return res.data;
  }

  // ─── Unplanned Categories ─────────────────────────────────────────────────

  static async getUnplannedCategories(site: string): Promise<UnplannedCategoryResponse[]> {
    const res = await api.post(`${this.BASE}/unplannedCategory/list`, { site });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async createUnplannedCategory(site: string, label: string, description: string, displayOrder: number, createdBy: string): Promise<UnplannedCategoryResponse> {
    const res = await api.post(`${this.BASE}/unplannedCategory/create`, { site, label, description, displayOrder, createdBy });
    return res.data;
  }

  static async updateUnplannedCategory(site: string, handle: string, label: string, description: string, displayOrder: number, modifiedBy: string): Promise<UnplannedCategoryResponse> {
    const res = await api.post(`${this.BASE}/unplannedCategory/update`, { site, handle, label, description, displayOrder, modifiedBy });
    return res.data;
  }

  static async deleteUnplannedCategory(site: string, handle: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/unplannedCategory/delete`, { site, handle, deletedBy });
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  static async exportPayroll(site: string, startDate: string, endDate: string, department?: string): Promise<PayrollExportRow[]> {
    const res = await api.post(`${this.BASE}/payrollExport`, { site, startDate, endDate, department });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getComplianceReport(site: string, startDate: string, endDate: string, department?: string): Promise<SubmissionComplianceReport> {
    const res = await api.post(`${this.BASE}/complianceReport`, { site, startDate, endDate, department });
    return res.data;
  }

  static async getUnplannedWorkReport(site: string, startDate: string, endDate: string, department?: string): Promise<UnplannedWorkReport> {
    const res = await api.post(`${this.BASE}/unplannedWorkReport`, { site, startDate, endDate, department });
    return res.data;
  }

  static async getHolidayWorkingSummary(site: string, startDate: string, endDate: string): Promise<HolidayWorkingSummary> {
    const res = await api.post(`${this.BASE}/report/holidayWorking`, { site, startDate, endDate });
    return res.data;
  }
}
