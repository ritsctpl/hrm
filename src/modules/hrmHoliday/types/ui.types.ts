/**
 * HRM Holiday Module - UI Types
 * Component prop types and UI state interfaces
 */

import type {
  Holiday,
  HolidayGroup,
  HolidayCategoryConfig,
  HolidayBuMapping,
  HolidayGroupStatus,
} from './domain.types';

export interface HolidayGroupSearchParams {
  year: number;
  status?: HolidayGroupStatus;
  search?: string;
  buHandle?: string;
  deptHandle?: string;
}

export interface HolidayGroupCardProps {
  group: HolidayGroup;
  isSelected: boolean;
  onClick: (group: HolidayGroup) => void;
}

export interface HolidayTableRowProps {
  holiday: Holiday;
  onEdit?: (holiday: Holiday) => void;
  onDelete?: (handle: string) => void;
  isEditable: boolean;
}

export interface HolidayFormPanelProps {
  open: boolean;
  groupHandle: string;
  groupYear: number;
  groupStatus: HolidayGroupStatus;
  holiday?: Holiday | null;
  onClose: () => void;
  onSaved: (holiday: Holiday) => void;
}

export interface BuMappingPanelProps {
  open: boolean;
  groupHandle: string;
  mappings: HolidayBuMapping[];
  onClose: () => void;
  onMappingChanged: () => void;
}

export interface HolidayCalendarViewProps {
  holidays: Holiday[];
  categories: HolidayCategoryConfig[];
  year: number;
  month: number;
  onMonthChange: (month: number) => void;
  onHolidayClick?: (holiday: Holiday) => void;
}

export interface HolidayLegendProps {
  categories: HolidayCategoryConfig[];
}

export interface HolidayStatusChipProps {
  status: HolidayGroupStatus;
}

export interface HolidayCategoryTagProps {
  categoryCode: string;
  displayName: string;
  colorHex: string;
  isFaded?: boolean;
}

export interface ImportPanelProps {
  open: boolean;
  groupHandle: string;
  groupName: string;
  onClose: () => void;
  onImported: () => void;
}

export interface GroupCreateModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (group: HolidayGroup) => void;
}

export interface DuplicateGroupModalProps {
  open: boolean;
  sourceGroup: HolidayGroup;
  onClose: () => void;
  onDuplicated: (newGroupHandle: string) => void;
}

export interface PublishConfirmModalProps {
  open: boolean;
  groupName: string;
  onClose: () => void;
  onConfirm: (comment?: string) => Promise<void>;
}

export interface LockConfirmModalProps {
  open: boolean;
  groupName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export interface UnlockConfirmModalProps {
  open: boolean;
  groupName: string;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export interface CategorySettingsPanelProps {
  categories: HolidayCategoryConfig[];
  onCategoryChange: () => void;
}

export interface HolidayPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canPublish: boolean;
  canLock: boolean;
  canUnlock: boolean;
  canImport: boolean;
  canExport: boolean;
  canMapBu: boolean;
  canManageSettings: boolean;
  seeDraftGroups: boolean;
}

export interface GroupStatsBarProps {
  total: number;
  upcoming: number;
  completed: number;
}

export interface HolidayGroupsTableProps {
  groups: HolidayGroup[];
  loading: boolean;
  error: string | null;
  selectedHandle?: string;
  onRowClick: (group: HolidayGroup) => void;
}

export interface HolidayListTableProps {
  holidays: Holiday[];
  loading: boolean;
  groupStatus: HolidayGroupStatus;
  onEdit?: (holiday: Holiday) => void;
  onAddHoliday?: () => void;
}

export interface AuditLogDrawerProps {
  groupHandle: string;
  site: string;
}

export interface HrmHolidayScreenProps {
  group: HolidayGroup;
  site: string;
  permissions: HolidayPermissions;
}

export interface HolidayGroupSearchBarProps {
  searchParams: HolidayGroupSearchParams;
  onSearchChange: (params: Partial<HolidayGroupSearchParams>) => void;
  onNewGroup?: () => void;
  onDuplicateYear?: () => void;
  canManageSettings: boolean;
}
