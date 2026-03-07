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
