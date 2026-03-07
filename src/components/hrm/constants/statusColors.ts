/**
 * HRM Status Color Mapping
 *
 * Maps HRM workflow statuses to Ant Design Tag preset color values.
 * Used by HrmStatusBadge and any component that needs to display
 * status-specific coloring consistently across all HRM modules.
 */
export const HRM_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'processing',
  PENDING_APPROVAL: 'warning',
  APPROVED: 'success',
  REJECTED: 'error',
  ESCALATED: 'volcano',
  CANCELLED: 'default',
  ACTIVE: 'success',
  INACTIVE: 'default',
  ON_HOLD: 'warning',
};
