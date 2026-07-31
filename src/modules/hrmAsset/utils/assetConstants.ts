/**
 * HRM Asset Module - Constants
 */

import type { AssetStatus, AssetRequestStatus } from '../types/domain.types';

export const ASSET_STATUS_CONFIG: Record<AssetStatus, { label: string; color: string }> = {
  IN_STORE: { label: 'In Store', color: 'default' },
  WORKING: { label: 'Working', color: 'success' },
  UNDER_REPAIR: { label: 'Under Repair', color: 'warning' },
  DAMAGED: { label: 'Damaged', color: 'error' },
  LOST: { label: 'Lost', color: 'error' },
  RETIRED: { label: 'Retired', color: 'default' },
};

export const REQUEST_STATUS_CONFIG: Record<AssetRequestStatus, { label: string; color: string }> = {
  DRAFT: { label: 'Draft', color: 'default' },
  PENDING_SUPERVISOR: { label: 'Pending Supervisor', color: 'processing' },
  PENDING_ADMIN: { label: 'Pending Admin', color: 'processing' },
  APPROVED: { label: 'Approved', color: 'success' },
  REJECTED: { label: 'Rejected', color: 'error' },
  PENDING_ALLOCATION: { label: 'Pending Allocation', color: 'warning' },
  ALLOCATED: { label: 'Allocated', color: 'cyan' },
  COMPLETED: { label: 'Completed', color: 'success' },
  CANCELLED: { label: 'Cancelled', color: 'default' },
};

export const ASSET_STATUS_OPTIONS = Object.entries(ASSET_STATUS_CONFIG).map(([value, { label }]) => ({
  value,
  label,
}));

/**
 * Why an asset was handed over directly, with no request and no approval.
 * Drives audit reporting. Codes match screen.md §4.3.
 *
 * These are the wire values, not just labels: the service validates against
 * the same seven strings (ASSIGNMENT_REASONS in AssetRegisterServiceImpl) and
 * rejects anything else with ASSET_011. Adding one here without adding it
 * there produces a form option that always fails on submit.
 */
export const ASSIGNMENT_REASONS = [
  { value: 'ONBOARDING', label: 'Onboarding / New joiner' },
  { value: 'REPLACEMENT', label: 'Replacement for faulty asset' },
  { value: 'PROJECT_REQUIREMENT', label: 'Project requirement' },
  { value: 'TEMPORARY_LOAN', label: 'Temporary loan' },
  { value: 'UPGRADE', label: 'Upgrade / refresh' },
  { value: 'DATA_MIGRATION', label: 'Data migration / backfill of existing custody' },
  { value: 'OTHER', label: 'Other (remarks mandatory)' },
] as const;

export type AssignmentReason = (typeof ASSIGNMENT_REASONS)[number]['value'];

/**
 * Display label for a stored reason code. Falls back to the raw code rather
 * than blanking the field: a code this build doesn't know is still the
 * accountability record for that hand-over, and hiding it would be worse than
 * showing it unprettified.
 */
export function assignmentReasonLabel(code?: string): string | undefined {
  if (!code) return undefined;
  return ASSIGNMENT_REASONS.find((r) => r.value === code)?.label ?? code;
}

/**
 * Free-text explanation required alongside `OTHER`. Mirrors
 * OTHER_REASON_MIN_REMARKS in AssetRegisterServiceImpl, which rejects a
 * shorter one with ASSET_012 — keep the two numbers equal or the user meets a
 * server error the form told them was fine.
 */
export const ASSIGNMENT_OTHER_MIN_REMARKS = 10;

/** Backdating window for a direct assignment, in days. */
export const ASSIGNMENT_BACKDATE_LIMIT_DAYS = 30;

/** Upper bound on how far out an expected return date may sit, in years. */
export const ASSIGNMENT_MAX_RETURN_YEARS = 5;

/**
 * The only asset status a direct assignment may start from. Everything else
 * gets a specific block reason (see `getDirectAssignBlockReason`).
 */
export const DIRECTLY_ASSIGNABLE_STATUSES: AssetStatus[] = ['IN_STORE'];

/** How many assets one bulk submission may carry. */
export const ASSIGNMENT_BULK_LIMIT = 25;

/**
 * In-flight requests during a bulk assignment. Each asset is its own call —
 * there is no batch endpoint — so this bounds the burst without serialising
 * 25 round trips.
 */
export const ASSIGNMENT_BULK_CONCURRENCY = 4;

/** Attachment limits for the handover slip / signed approval (screen.md R-12). */
export const ASSIGNMENT_ATTACHMENT_MAX_FILES = 3;
export const ASSIGNMENT_ATTACHMENT_MAX_MB = 5;
export const ASSIGNMENT_ATTACHMENT_ACCEPT = '.pdf,.png,.jpg,.jpeg';

/**
 * Lifecycle stages that bar an employee from receiving an asset. Mirrors
 * NON_ASSIGNABLE_EMPLOYMENT_STATUSES in AssetRegisterServiceImpl — the service
 * rejects these with ASSET_010 on the direct path, so the picker excludes them
 * rather than letting the user discover it at submit time.
 */
export const NON_ASSIGNABLE_EMPLOYMENT_STATUSES = [
  'RESIGNED',
  'RELIEVED',
  'TERMINATED',
  'EXITED',
  'RETIRED',
  'ABSCONDED',
];

/**
 * Lifecycle stages that are allowed but worth a second look — the assigner
 * gets a warning and an extra confirm rather than a block (screen.md §7.2).
 */
export const WARN_EMPLOYMENT_STATUSES = ['NOTICE_PERIOD'];

export const CATEGORY_DATA_TYPES = [
  { value: 'TEXT', label: 'Text' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'DATE', label: 'Date' },
  { value: 'BOOLEAN', label: 'Yes / No' },
];

export const DETAIL_TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'attributes', label: 'Attributes' },
  { key: 'attachments', label: 'Attachments' },
  { key: 'custody', label: 'Custody History' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'depreciation', label: 'Depreciation' },
] as const;

export const APPROVAL_TABS = [
  { key: 'supervisor', label: 'Pending Supervisor' },
  { key: 'admin', label: 'Pending Admin' },
  { key: 'allocation', label: 'Pending Allocation' },
] as const;
