/**
 * HRM Asset Module - UI Types
 */

import type {
  Asset,
  AssetRequest,
  AssetCategory,
  AssetStatus,
  AssetRequestStatus,
  AssetDetailTab,
} from './domain.types';

export interface AssetListRowProps {
  asset: Asset;
  isSelected: boolean;
  onClick: (asset: Asset) => void;
  /**
   * Bulk direct assignment. When `selectable` is set the row shows a checkbox;
   * it is only ever passed for rows the user could actually assign, so there is
   * no "ticked but unassignable" state to reconcile at submit time.
   */
  selectable?: boolean;
  isChecked?: boolean;
  onToggleSelect?: (assetId: string) => void;
}

export interface AssetSummaryCardProps {
  label: string;
  value: number;
  colorVariant: 'default' | 'success' | 'warning' | 'danger' | 'info';
  onClick?: () => void;
}

export interface AssetStatusBadgeProps {
  status: AssetStatus;
}

export interface AssetRequestStatusBadgeProps {
  status: AssetRequestStatus;
  escalated?: boolean;
}

export interface AssetFormProps {
  asset?: Asset | null;
  categories: AssetCategory[];
  onSave: (payload: unknown) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

export interface AssetDetailPanelProps {
  asset: Asset;
  onClose: () => void;
  onStatusChange: (assetId: string, newStatus: AssetStatus, remarks: string) => Promise<void>;
  onAssign: () => void;
  onReturn: () => void;
}

export interface AssetRequestCardProps {
  request: AssetRequest;
  isSelected: boolean;
  onClick: (request: AssetRequest) => void;
}

export interface ApprovalActionBarProps {
  request: AssetRequest;
  onApprove: (requestId: string, remarks: string) => Promise<void>;
  onReject: (requestId: string, remarks: string) => Promise<void>;
}

export interface AssetFilterState {
  searchQuery: string;
  category: string;
  status: string;
  location: string;
}

export interface AssetSearchBarProps {
  searchQuery: string;
  filterCategory: string;
  filterStatus: string;
  filterLocation: string;
  categories: AssetCategory[];
  onSearchChange: (q: string) => void;
  onCategoryChange: (cat: string) => void;
  onStatusChange: (status: string) => void;
  onLocationChange: (loc: string) => void;
  onClear: () => void;
  /**
   * Shows the "Available to assign" shortcut chip (status = IN_STORE). Only
   * meaningful to users who can hand assets out, so the caller gates it on the
   * direct-assign grant rather than showing a dead filter to everyone.
   */
  showAvailableToAssign?: boolean;
}

export interface AssetMasterListProps {
  assets: Asset[];
  loading: boolean;
  selectedAssetId?: string;
  onSelect: (asset: Asset) => void;
  /** Bulk direct assignment — see AssetListRowProps.selectable. */
  selectable?: boolean;
  checkedAssetIds?: string[];
  onToggleSelect?: (assetId: string) => void;
  onSelectAll?: (assetIds: string[]) => void;
  onClearSelection?: () => void;
  /** Cap on how many rows may be ticked at once. */
  selectionLimit?: number;
}

export interface AssetDashboardHeaderProps {
  dashboard: import('./domain.types').AssetDashboard;
  loading: boolean;
}

export interface MaintenanceEventRowProps {
  event: import('./domain.types').AssetMaintenanceEvent;
}

export interface CustodyHistoryRowProps {
  custody: import('./domain.types').AssetCustody;
}

export interface DepreciationSnapshotRowProps {
  snapshot: import('./domain.types').AssetDepreciationSnapshot;
}

export type { AssetDetailTab };
