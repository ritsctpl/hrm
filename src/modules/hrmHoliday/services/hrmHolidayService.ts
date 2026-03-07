/**
 * HRM Holiday Module - Service Layer
 * Static class handling all API calls for holiday operations
 */

import api from '@/services/api';
import type {
  CreateHolidayGroupRequest,
  UpdateHolidayGroupRequest,
  HolidayGroupSearchRequest,
  CreateHolidayRequest,
  BulkCreateHolidayRequest,
  UpdateHolidayRequest,
  HolidayFetchRequest,
  HolidayListRequest,
  HolidayDeleteRequest,
  HolidayGroupDeleteRequest,
  PublishGroupRequest,
  LockGroupRequest,
  UnlockGroupRequest,
  AddBuMappingRequest,
  MappingRemoveRequest,
  MappingListRequest,
  ImportHolidayRequest,
  HolidayExportRequest,
  DuplicateGroupRequest,
  MyCalendarRequest,
  CreateCategoryRequest,
  UpdateCategoryRequest,
  CategoryListRequest,
  CategoryDeactivateRequest,
  HolidayGroupStatsRequest,
  HolidayAuditLogRequest,
  HolidayGroupResponse,
  HolidayResponse,
  HolidayBuMappingResponse,
  CalendarViewResponse,
  ImportHolidayResponse,
  DuplicateGroupResponse,
  HolidayCategoryConfigResponse,
  HolidayAuditLogResponse,
  HolidayStatsResponse,
  HolidayApiResponse,
} from '../types/api.types';

export class HrmHolidayService {
  private static readonly BASE = '/hrm-service';

  // ── Holiday Group CRUD ──────────────────────────────────────────────

  static async createGroup(
    payload: CreateHolidayGroupRequest
  ): Promise<HolidayApiResponse<HolidayGroupResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/create`, payload);
    return data;
  }

  static async listGroups(
    payload: HolidayGroupSearchRequest
  ): Promise<HolidayApiResponse<HolidayGroupResponse[]>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/retrieve-all`, payload);
    return data;
  }

  static async getGroup(
    payload: HolidayFetchRequest
  ): Promise<HolidayApiResponse<HolidayGroupResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/retrieve`, payload);
    return data;
  }

  static async updateGroup(
    payload: UpdateHolidayGroupRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/update`, payload);
    return data;
  }

  static async deleteGroup(
    payload: HolidayGroupDeleteRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/delete`, payload);
    return data;
  }

  // ── Publication Lifecycle ────────────────────────────────────────────

  static async publishGroup(
    payload: PublishGroupRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/publish`, payload);
    return data;
  }

  static async lockGroup(
    payload: LockGroupRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/lock`, payload);
    return data;
  }

  static async unlockGroup(
    payload: UnlockGroupRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/unlock`, payload);
    return data;
  }

  // ── Duplicate Group ──────────────────────────────────────────────────

  static async duplicateGroup(
    payload: DuplicateGroupRequest
  ): Promise<HolidayApiResponse<DuplicateGroupResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/duplicate`, payload);
    return data;
  }

  // ── Individual Holidays ──────────────────────────────────────────────

  static async createHoliday(
    payload: CreateHolidayRequest
  ): Promise<HolidayApiResponse<HolidayResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday/create`, payload);
    return data;
  }

  static async bulkCreateHolidays(
    payload: BulkCreateHolidayRequest
  ): Promise<HolidayApiResponse<HolidayResponse[]>> {
    const { data } = await api.post(`${this.BASE}/holiday/bulk-create`, payload);
    return data;
  }

  static async getHoliday(
    payload: HolidayFetchRequest
  ): Promise<HolidayApiResponse<HolidayResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday/retrieve`, payload);
    return data;
  }

  static async listHolidays(
    payload: HolidayListRequest
  ): Promise<HolidayApiResponse<HolidayResponse[]>> {
    const { data } = await api.post(`${this.BASE}/holiday/retrieve-all`, payload);
    return data;
  }

  static async updateHoliday(
    payload: UpdateHolidayRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday/update`, payload);
    return data;
  }

  static async deleteHoliday(
    payload: HolidayDeleteRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday/delete`, payload);
    return data;
  }

  // ── Calendar Views ───────────────────────────────────────────────────

  static async getCalendarView(
    payload: HolidayGroupSearchRequest
  ): Promise<HolidayApiResponse<CalendarViewResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday/calendar`, payload);
    return data;
  }

  static async getMyCalendar(
    payload: MyCalendarRequest
  ): Promise<HolidayApiResponse<CalendarViewResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday/my-calendar`, payload);
    return data;
  }

  // ── BU / Dept Mappings ───────────────────────────────────────────────

  static async addMapping(
    payload: AddBuMappingRequest
  ): Promise<HolidayApiResponse<HolidayBuMappingResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/mapping/add`, payload);
    return data;
  }

  static async removeMapping(
    payload: MappingRemoveRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/mapping/remove`, payload);
    return data;
  }

  static async listMappings(
    payload: MappingListRequest
  ): Promise<HolidayApiResponse<HolidayBuMappingResponse[]>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/mapping/retrieve-all`, payload);
    return data;
  }

  // ── Import / Export ──────────────────────────────────────────────────

  static async importHolidays(
    payload: ImportHolidayRequest
  ): Promise<HolidayApiResponse<ImportHolidayResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday/import`, payload);
    return data;
  }

  static async exportCsv(payload: HolidayExportRequest): Promise<Blob> {
    const response = await api.post(`${this.BASE}/holiday/export/csv`, payload, {
      responseType: 'blob',
    });
    return response.data;
  }

  static async exportIcal(payload: HolidayExportRequest): Promise<string> {
    const { data } = await api.post(`${this.BASE}/holiday/export/ical`, payload);
    return data;
  }

  // ── Category Configuration ───────────────────────────────────────────

  static async createCategory(
    payload: CreateCategoryRequest
  ): Promise<HolidayApiResponse<HolidayCategoryConfigResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday-category/create`, payload);
    return data;
  }

  static async listCategories(
    payload: CategoryListRequest
  ): Promise<HolidayApiResponse<HolidayCategoryConfigResponse[]>> {
    const { data } = await api.post(`${this.BASE}/holiday-category/retrieve-all`, payload);
    return data;
  }

  static async updateCategory(
    payload: UpdateCategoryRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-category/update`, payload);
    return data;
  }

  static async deactivateCategory(
    payload: CategoryDeactivateRequest
  ): Promise<HolidayApiResponse<string>> {
    const { data } = await api.post(`${this.BASE}/holiday-category/deactivate`, payload);
    return data;
  }

  // ── Statistics ───────────────────────────────────────────────────────

  static async getStatistics(
    payload: HolidayGroupStatsRequest
  ): Promise<HolidayApiResponse<HolidayStatsResponse>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/statistics`, payload);
    return data;
  }

  // ── Audit Log ────────────────────────────────────────────────────────

  static async getGroupAuditLog(
    payload: HolidayAuditLogRequest
  ): Promise<HolidayApiResponse<HolidayAuditLogResponse[]>> {
    const { data } = await api.post(`${this.BASE}/holiday-group/audit-log`, payload);
    return data;
  }
}
