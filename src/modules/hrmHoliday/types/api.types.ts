/**
 * HRM Holiday Module - API Types
 * Request/response DTOs for all holiday API operations
 */

// ── Generic API Wrapper ─────────────────────────────────────────────

export interface HolidayApiResponse<T> {
  success: boolean;
  message: string;
  messageCode: string;
  data: T;
  timestamp: string;
}

// ── Request DTOs ────────────────────────────────────────────────────

export interface CreateHolidayGroupRequest {
  site: string;
  groupName: string;
  year: number;
  description?: string;
  colorScheme?: Record<string, string>;
  createdBy: string;
}

export interface UpdateHolidayGroupRequest {
  site: string;
  handle: string;
  groupName?: string;
  description?: string;
  colorScheme?: Record<string, string>;
  modifiedBy: string;
}

export interface HolidayGroupSearchRequest {
  site: string;
  year?: number;
  buHandle?: string;
  deptHandle?: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'LOCKED';
  category?: string;
  month?: number;
  requestingUserRole: string;
}

export interface HolidayFetchRequest {
  site: string;
  handle: string;
  requestingRole?: string;
}

export interface HolidayListRequest {
  site: string;
  groupHandle: string;
  category?: string;
  month?: number;
}

export interface HolidayGroupDeleteRequest {
  site: string;
  handle: string;
  deletedBy: string;
}

export interface CreateHolidayRequest {
  site: string;
  groupHandle: string;
  name: string;
  date: string;
  category: string;
  reason?: string;
  compensatory?: boolean;
  compWindowStart?: string;
  compWindowEnd?: string;
  locationScope?: string;
  optional?: boolean;
  visibility?: 'PUBLIC' | 'BU_ONLY' | 'DEPT_SPECIFIC';
  notes?: string;
  createdBy: string;
}

export interface UpdateHolidayRequest {
  site: string;
  handle: string;
  name?: string;
  date?: string;
  category?: string;
  reason?: string;
  compensatory?: boolean;
  compWindowStart?: string;
  compWindowEnd?: string;
  locationScope?: string;
  optional?: boolean;
  visibility?: 'PUBLIC' | 'BU_ONLY' | 'DEPT_SPECIFIC';
  notes?: string;
  modifiedBy: string;
}

export interface BulkCreateHolidayRequest {
  site: string;
  groupHandle: string;
  holidays: CreateHolidayRequest[];
  createdBy: string;
}

export interface HolidayDeleteRequest {
  site: string;
  handle: string;
  deletedBy: string;
}

export interface PublishGroupRequest {
  site: string;
  groupHandle: string;
  comment?: string;
  publishedBy: string;
}

export interface LockGroupRequest {
  site: string;
  groupHandle: string;
  reason: string;
  lockedBy: string;
}

export interface UnlockGroupRequest {
  site: string;
  groupHandle: string;
  reason: string;
  unlockedBy: string;
}

export interface AddBuMappingRequest {
  site: string;
  groupHandle: string;
  buHandle?: string;
  deptHandle?: string;
  primaryFlag?: boolean;
  mappedBy: string;
}

export interface MappingRemoveRequest {
  site: string;
  groupHandle: string;
  mappingHandle: string;
  removedBy: string;
}

export interface MappingListRequest {
  site: string;
  groupHandle: string;
}

export interface ImportHolidayRequest {
  site: string;
  groupHandle: string;
  dryRun: boolean;
  importedBy: string;
  rows: HolidayImportRow[];
}

export interface HolidayImportRow {
  name: string;
  date: string;
  category: string;
  reason?: string;
  isCompensatory?: string;
  compWindowStart?: string;
  compWindowEnd?: string;
  locationScope?: string;
  isOptional?: string;
}

export interface HolidayExportRequest {
  site: string;
  groupHandle: string;
}

export interface DuplicateGroupRequest {
  site: string;
  sourceGroupHandle: string;
  targetYear: number;
  newGroupName: string;
  shiftWeekends?: boolean;
  createdBy: string;
}

export interface MyCalendarRequest {
  site: string;
  buHandle: string;
  deptHandle?: string;
  year: number;
  month?: number;
  requestingRole: string;
}

export interface CreateCategoryRequest {
  site: string;
  categoryCode: string;
  displayName: string;
  colorHex: string;
  shadePast: string;
  shadeUpcoming: string;
  displayOrder?: number;
  createdBy: string;
}

export interface UpdateCategoryRequest {
  site: string;
  handle: string;
  displayName?: string;
  colorHex?: string;
  shadePast?: string;
  shadeUpcoming?: string;
  displayOrder?: number;
  modifiedBy: string;
}

export interface CategoryListRequest {
  site: string;
  activeOnly?: boolean;
}

export interface CategoryDeactivateRequest {
  site: string;
  categoryCode: string;
  modifiedBy: string;
}

export interface HolidayGroupStatsRequest {
  site: string;
  year: number;
  buHandle?: string;
}

export interface HolidayAuditLogRequest {
  site: string;
  groupHandle: string;
  from?: string;
  to?: string;
}

// ── Response DTOs ───────────────────────────────────────────────────

export interface HolidayGroupResponse {
  handle: string;
  groupName: string;
  year: number;
  description?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'LOCKED';
  colorScheme?: Record<string, string>;
  totalHolidays: number;
  upcomingCount: number;
  completedCount: number;
  publishedBy?: string;
  publishedAt?: string;
  mappings: HolidayBuMappingResponse[];
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
}

export interface HolidayResponse {
  handle: string;
  groupHandle: string;
  name: string;
  date: string;
  day: string;
  category: string;
  categoryDisplayName: string;
  categoryColorHex: string;
  reason?: string;
  compensatory: boolean;
  compWindowStart?: string;
  compWindowEnd?: string;
  locationScope?: string;
  optional: boolean;
  visibility: 'PUBLIC' | 'BU_ONLY' | 'DEPT_SPECIFIC';
  notes?: string;
  holidayStatus: 'UPCOMING' | 'COMPLETED';
  version: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface HolidayBuMappingResponse {
  handle: string;
  groupHandle: string;
  buHandle: string;
  buName: string;
  deptHandle?: string;
  deptName?: string;
  primaryFlag: boolean;
  mappedAt: string;
  mappedBy: string;
}

export interface CalendarViewResponse {
  year: number;
  month?: number;
  holidays: HolidayResponse[];
  legend: HolidayCategoryConfigResponse[];
  totalCount: number;
  upcomingCount: number;
  completedCount: number;
  nextFiveHolidays: HolidayResponse[];
}

export interface ImportHolidayResponse {
  totalRows: number;
  successCount: number;
  failureCount: number;
  committed: boolean;
  errors: HolidayImportError[];
  importJobId: string;
  preview?: HolidayResponse[];
}

export interface HolidayImportError {
  rowNumber: number;
  holidayName: string;
  errorCode: string;
  errorMessage: string;
}

export interface DuplicateGroupResponse {
  newGroupHandle: string;
  groupName: string;
  targetYear: number;
  holidaysCopied: number;
  warnings: string[];
}

export interface HolidayCategoryConfigResponse {
  handle: string;
  categoryCode: string;
  displayName: string;
  colorHex: string;
  shadePast: string;
  shadeUpcoming: string;
  systemCategory: boolean;
  active: boolean;
  displayOrder: number;
}

export interface HolidayAuditLogResponse {
  handle: string;
  groupHandle: string;
  holidayHandle?: string;
  action: string;
  oldValue?: unknown;
  newValue?: unknown;
  performedBy: string;
  performedByRole: string;
  performedAt: string;
  comment?: string;
}

export interface HolidayStatsResponse {
  site: string;
  year: number;
  totalHolidays: number;
  byCategory: Record<string, number>;
  byBu: Record<string, number>;
  byMonth: Record<string, number>;
  compensatoryCount: number;
  optionalCount: number;
}
