/**
 * HRM Holiday Module - Domain Types
 * Core business entity interfaces
 */

export type HolidayGroupStatus = 'DRAFT' | 'PUBLISHED' | 'LOCKED';
export type HolidayCategory = 'NATIONAL' | 'FESTIVAL' | 'LOCAL' | 'COMPENSATORY' | string;
export type HolidayStatus = 'UPCOMING' | 'COMPLETED';
export type HolidayVisibility = 'PUBLIC' | 'BU_ONLY' | 'DEPT_SPECIFIC';

export interface HolidayGroup {
  handle: string;
  groupName: string;
  year: number;
  description?: string;
  status: HolidayGroupStatus;
  colorScheme?: Record<string, string>;
  totalHolidays: number;
  upcomingCount: number;
  completedCount: number;
  publishedBy?: string;
  publishedAt?: string;
  mappings: HolidayBuMapping[];
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
}

export interface Holiday {
  handle: string;
  groupHandle: string;
  name: string;
  date: string;
  day: string;
  category: HolidayCategory;
  categoryDisplayName: string;
  categoryColorHex: string;
  reason?: string;
  compensatory: boolean;
  compWindowStart?: string;
  compWindowEnd?: string;
  locationScope?: string;
  optional: boolean;
  visibility: HolidayVisibility;
  notes?: string;
  holidayStatus: HolidayStatus;
  version: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface HolidayBuMapping {
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

export interface HolidayCategoryConfig {
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

export interface CalendarViewData {
  year: number;
  month?: number;
  holidays: Holiday[];
  legend: HolidayCategoryConfig[];
  totalCount: number;
  upcomingCount: number;
  completedCount: number;
  nextFiveHolidays: Holiday[];
}

export interface HolidayAuditLog {
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

export interface ImportResult {
  totalRows: number;
  successCount: number;
  failureCount: number;
  committed: boolean;
  errors: ImportError[];
  importJobId: string;
  preview?: Holiday[];
}

export interface ImportError {
  rowNumber: number;
  holidayName: string;
  errorCode: string;
  errorMessage: string;
}
