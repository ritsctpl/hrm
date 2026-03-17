/**
 * HRM Employee UI Types
 * Types for component props, UI state, and view concerns
 */

import type { EmployeeStatus, EmployeeSummary, EmployeeProfile, Skill } from './domain.types';

/** View mode for employee directory */
export type DirectoryViewMode = 'table' | 'card';

/** Profile tab keys */
export type ProfileTabKey =
  | 'overview'
  | 'contactFamily'
  | 'career'
  | 'documentsAssets'
  | 'compensation';

/** Directory filter state */
export interface DirectoryFilters {
  departmentFilter: string | null;
  statusFilter: EmployeeStatus | null;
  buFilter: string | null;
}

/** Onboarding wizard steps */
export type OnboardingStep = 0 | 1 | 2 | 3;

/** Status badge props */
export interface EmpStatusBadgeProps {
  status: EmployeeStatus;
  size?: 'small' | 'default';
}

/** Avatar props */
export interface EmpAvatarProps {
  name: string;
  photoUrl?: string;
  photoBase64?: string;
  size?: number;
  shape?: 'circle' | 'passport';
}

/** Field label props */
export interface EmpFieldLabelProps {
  label: string;
  value: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
}

/** Search bar props */
export interface EmpSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/** Filter bar props */
export interface EmpFilterBarProps {
  filters: DirectoryFilters;
  onFilterChange: (filters: Partial<DirectoryFilters>) => void;
  departments: string[];
  businessUnits: string[];
}

/** Basic card props */
export interface EmpBasicCardProps {
  employee: EmployeeSummary;
  onClick: (handle: string) => void;
}

/** Skill tag props */
export interface EmpSkillTagProps {
  skill: Skill;
  onRemove?: (skillId: string) => void;
  removable?: boolean;
}

/** Document row props */
export interface EmpDocumentRowProps {
  docId: string;
  docType: string;
  fileName: string;
  uploadedAt: string;
  expiryDate?: string;
  onDownload: (docId: string) => void;
  onDelete: (docId: string) => void;
}

/** Employee table props */
export interface EmployeeTableProps {
  data: EmployeeSummary[];
  loading: boolean;
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
  onRowClick: (handle: string) => void;
}

/** Employee card grid props */
export interface EmployeeCardGridProps {
  data: EmployeeSummary[];
  loading: boolean;
  onCardClick: (handle: string) => void;
}

/** Tab props (shared across profile tabs) */
export interface ProfileTabProps {
  profile: EmployeeProfile;
  isEditing: boolean;
  isSaving: boolean;
  onSave: (section: string, data: Record<string, unknown>) => Promise<void>;
  onEdit?: () => void;
  onSectionSave?: () => Promise<void>;
  editingSection?: string | null;
  sectionKey?: string;
}

/** Onboarding wizard props */
export interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

/** Bulk import panel props */
export interface BulkImportPanelProps {
  open: boolean;
  onClose: () => void;
}

/** Empty state props */
export interface EmpEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}

/** Save button props */
export interface EmpSaveButtonProps {
  loading?: boolean;
  onClick?: () => void;
  label?: string;
}

/** Asset row display props */
export interface EmpAssetRowProps {
  assetName: string;
  serialNumber: string;
  assetType: string;
  condition: string;
  issuedDate: string;
  returnedDate?: string;
}

/** Government ID field props */
export interface EmpGovtIdFieldProps {
  idType: string;
  idNumber: string;
  verified?: boolean;
  isEditing?: boolean;
  onRemove?: () => void;
}
