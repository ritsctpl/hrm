/**
 * HRM Holiday Module - Constants
 */

export const HOLIDAY_GROUP_STATUSES = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  LOCKED: 'LOCKED',
} as const;

export const HOLIDAY_STATUSES = {
  UPCOMING: 'UPCOMING',
  COMPLETED: 'COMPLETED',
} as const;

export const HOLIDAY_VISIBILITY = {
  PUBLIC: 'PUBLIC',
  BU_ONLY: 'BU_ONLY',
  DEPT_SPECIFIC: 'DEPT_SPECIFIC',
} as const;

export const SYSTEM_CATEGORIES = [
  { code: 'NATIONAL', label: 'National', color: '#1E88E5', shadePast: '#90CAF9' },
  { code: 'FESTIVAL', label: 'Festival', color: '#43A047', shadePast: '#A5D6A7' },
  { code: 'LOCAL', label: 'Local', color: '#FB8C00', shadePast: '#FFCC80' },
  { code: 'COMPENSATORY', label: 'Comp. Off', color: '#E53935', shadePast: '#EF9A9A' },
  { code: 'CUSTOM', label: 'Custom', color: '#8E24AA', shadePast: '#CE93D8' },
] as const;

export const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  PUBLISHED: 'success',
  LOCKED: 'processing',
};

export const STATUS_BG_COLORS: Record<string, string> = {
  DRAFT: '#f0f0f0',
  PUBLISHED: '#f6ffed',
  LOCKED: '#e6f4ff',
};

export const CALENDAR_VIEW_MODES = {
  MONTH: 'month',
  WEEK: 'week',
} as const;

export const VISIBILITY_OPTIONS = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'BU_ONLY', label: 'BU Only' },
  { value: 'DEPT_SPECIFIC', label: 'Department Specific' },
];

export const CATEGORY_OPTIONS = [
  { value: 'NATIONAL', label: 'National' },
  { value: 'FESTIVAL', label: 'Festival' },
  { value: 'LOCAL', label: 'Local' },
  { value: 'COMPENSATORY', label: 'Compensatory' },
  { value: 'CUSTOM', label: 'Custom' },
];

export const YEAR_RANGE_OFFSET = 5;

export const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
