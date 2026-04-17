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
  TimesheetLockPeriodRequest,
  TimesheetLockPeriodResponse,
} from '../types/api.types';

export class HrmTimesheetService {
  private static readonly BASE = '/hrm-service/timesheet';

  // ─── Timesheet CRUD ───────────────────────────────────────────────────────

  static async saveTimesheet(payload: TimesheetRequest): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/save`, payload);
    return res.data;
  }

  static async getTimesheet(organizationId: string, handle: string): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/retrieve`, { organizationId, handle });
    return res.data;
  }

  static async getTimesheetByDate(organizationId: string, employeeId: string, date: string): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/retrieveByDate`, { organizationId, employeeId, date });
    return res.data;
  }

  static async getWeeklyTimesheet(organizationId: string, employeeId: string, weekStartDate: string): Promise<WeeklyTimesheetResponse> {
    const res = await api.post(`${this.BASE}/retrieveWeekly`, { organizationId, employeeId, weekStartDate });
    return res.data;
  }

  static async listTimesheets(organizationId: string, employeeId: string, startDate: string, endDate: string): Promise<TimesheetResponse[]> {
    const res = await api.post(`${this.BASE}/list`, { organizationId, employeeId, startDate, endDate });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Submit ───────────────────────────────────────────────────────────────

  static async submitTimesheet(payload: TimesheetSubmitRequest): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/submit`, payload);
    return res.data;
  }

  static async bulkSubmitWeekly(payload: WeeklyBulkSubmitRequest): Promise<BulkSubmitResponse> {
    const res = await api.post(`${this.BASE}/submitWeekly`, payload);
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

  static async getTeamTimesheets(organizationId: string, supervisorId: string, startDate: string, endDate: string): Promise<TeamTimesheetSummaryResponse[]> {
    const res = await api.post(`${this.BASE}/team/list`, { organizationId, supervisorId, startDate, endDate });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getPendingApprovals(organizationId: string, supervisorId: string): Promise<TimesheetResponse[]> {
    const res = await api.post(`${this.BASE}/team/pendingApprovals`, { organizationId, supervisorId });
    return Array.isArray(res.data) ? res.data : [];
  }

  // ─── Copy / Quick Fill ────────────────────────────────────────────────────

  static async copyFromPreviousDay(organizationId: string, employeeId: string, targetDate: string, createdBy: string): Promise<TimesheetResponse> {
    const res = await api.post(`${this.BASE}/copyFromPrevious`, { organizationId, employeeId, targetDate, createdBy });
    return res.data;
  }

  // ─── Unplanned Categories ─────────────────────────────────────────────────

  static async getUnplannedCategories(organizationId: string): Promise<UnplannedCategoryResponse[]> {
    const res = await api.post(`${this.BASE}/category/list`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async createUnplannedCategory(organizationId: string, label: string, description: string, displayOrder: number, createdBy: string): Promise<UnplannedCategoryResponse> {
    const res = await api.post(`${this.BASE}/category/create`, { organizationId, label, description, displayOrder, createdBy });
    return res.data;
  }

  static async updateUnplannedCategory(organizationId: string, handle: string, label: string, description: string, displayOrder: number, modifiedBy: string): Promise<UnplannedCategoryResponse> {
    const res = await api.post(`${this.BASE}/category/update`, { organizationId, handle, label, description, displayOrder, modifiedBy });
    return res.data;
  }

  static async deleteUnplannedCategory(organizationId: string, handle: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/category/delete`, { organizationId, handle, deletedBy });
  }

  // ─── Reports ──────────────────────────────────────────────────────────────

  static async exportPayroll(organizationId: string, startDate: string, endDate: string, department?: string): Promise<PayrollExportRow[]> {
    const res = await api.post(`${this.BASE}/export/payroll`, { organizationId, startDate, endDate, department });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async getComplianceReport(organizationId: string, startDate: string, endDate: string, department?: string): Promise<SubmissionComplianceReport> {
    const res = await api.post(`${this.BASE}/report/submissionCompliance`, { organizationId, startDate, endDate, department });
    return res.data;
  }

  static async getUnplannedWorkReport(organizationId: string, startDate: string, endDate: string, department?: string): Promise<UnplannedWorkReport> {
    const res = await api.post(`${this.BASE}/report/unplannedWork`, { organizationId, startDate, endDate, department });
    return res.data;
  }

  static async getHolidayWorkingSummary(organizationId: string, startDate: string, endDate: string): Promise<HolidayWorkingSummary> {
    const res = await api.post(`${this.BASE}/report/holidayWorking`, { organizationId, startDate, endDate });
    return res.data;
  }

  // ─── CSV Export ────────────────────────────────────────────────────────────

  static async exportCsv(organizationId: string, startDate: string, endDate: string, department?: string): Promise<string> {
    const res = await api.post(
      `${this.BASE}/export/csv`,
      { organizationId, startDate, endDate, department },
      { responseType: 'text' }
    );
    return res.data as string;
  }

  // ─── Lock Periods ──────────────────────────────────────────────────────────

  static async saveLockPeriod(payload: TimesheetLockPeriodRequest): Promise<TimesheetLockPeriodResponse> {
    const res = await api.post(`${this.BASE}/lockPeriod/save`, payload);
    return res.data;
  }

  static async getLockPeriods(organizationId: string): Promise<TimesheetLockPeriodResponse[]> {
    const res = await api.post(`${this.BASE}/lockPeriod/retrieve`, { organizationId });
    return Array.isArray(res.data) ? res.data : [];
  }

  static async deleteLockPeriod(organizationId: string, handle: string, deletedBy: string): Promise<void> {
    await api.post(`${this.BASE}/lockPeriod/delete`, { organizationId, handle, deletedBy });
  }
}
