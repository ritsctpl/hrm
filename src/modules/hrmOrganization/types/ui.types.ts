/**
 * HRM Organization Module - UI Types
 * Types specific to component props and UI state
 */

import type { CompanyProfile, BusinessUnit, Department, DepartmentNode, Location, OrgHierarchy } from './domain.types';

// ============================================
// View & Tab Types
// ============================================
export type MainView = 'list' | 'detail';

export type DetailTabKey = 'profile' | 'businessUnits' | 'departments' | 'locations' | 'hierarchy' | 'audit' | 'reports';

export type CompanyTabKey = 'identity' | 'statutory' | 'bank' | 'address' | 'contact';

export type BusinessUnitTabKey = 'general' | 'contact' | 'address' | 'statutory';

export type StructureSubView = 'departments' | 'locations' | 'hierarchy';

// Keep backward compat alias
export type MainTabKey = DetailTabKey;

// ============================================
// Company List State (for list view)
// ============================================
export interface CompanyListState {
  items: CompanyListItem[];
  isLoading: boolean;
  searchText: string;
  statusFilter: 'all' | 'active' | 'inactive';
}

export interface CompanyListItem {
  handle: string;
  legalName: string;
  tradeName?: string;
  companyName?: string;
  industry?: string;
  industryType?: string;
  officialEmail: string;
  officialPhone: string;
  active: number;
  createdDateTime?: string;
}

// ============================================
// Store State Types
// ============================================
export interface CompanyProfileState {
  data: CompanyProfile | null;
  isEditing: boolean;
  isLoading: boolean;
  isSaving: boolean;
  activeTab: CompanyTabKey;
  errors: Record<string, string>;
  draft: Partial<CompanyProfile> | null;
}

export interface BusinessUnitState {
  list: BusinessUnit[];
  selected: BusinessUnit | null;
  isCreating: boolean;
  isLoading: boolean;
  isSaving: boolean;
  searchText: string;
  errors: Record<string, string>;
  draft: Partial<BusinessUnit> | null;
}

export interface DepartmentState {
  list: Department[];
  hierarchy: DepartmentNode[];
  selected: Department | null;
  selectedBuHandle: string | null;
  isCreating: boolean;
  isLoading: boolean;
  isSaving: boolean;
  expandedKeys: string[];
  searchText: string;
  errors: Record<string, string>;
  draft: Partial<Department> | null;
}

// ============================================
// Component Props
// ============================================
export interface OrgStatusTagProps {
  active: number;
}

export interface OrgFieldLabelProps {
  label: string;
  required?: boolean;
}

export interface OrgSaveButtonProps {
  loading: boolean;
  disabled?: boolean;
  onClick: () => void;
  label?: string;
}

export interface OrgSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface OrgFormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}

export interface OrgAddressFieldsProps {
  prefix: string;
  address: Partial<{
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
    pinCode: string;
    postalCode: string;
    country: string;
  }>;
  onChange: (field: string, value: string) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
}

export interface OrgBankAccountCardProps {
  bankName: string;
  branchName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
  isPrimary: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSetPrimary: () => void;
  disabled?: boolean;
}

export interface OrgBankAccountListProps {
  accounts: Array<{
    bankName: string;
    branch: string;
    branchName?: string;
    accountNumber: string;
    ifsc: string;
    ifscCode?: string;
    accountType: string;
    isPrimary: boolean;
  }>;
  onAdd: () => void;
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
  onSetPrimary: (index: number) => void;
  disabled?: boolean;
}

export interface CompanyIdentitySectionProps {
  disabled?: boolean;
}

export interface CompanyStatutorySectionProps {
  disabled?: boolean;
}

export interface CompanyBankSectionProps {
  disabled?: boolean;
}

export interface CompanyAddressSectionProps {
  disabled?: boolean;
}

export interface CompanyContactSectionProps {
  disabled?: boolean;
}

export interface BusinessUnitTableProps {
  onSelect: (bu: BusinessUnit) => void;
  onAdd: () => void;
}

export interface BusinessUnitFormProps {
  onClose: () => void;
}

export interface DepartmentTreeProps {
  onSelect: (dept: Department) => void;
  onAdd: () => void;
}

export interface DepartmentFormProps {
  onClose: () => void;
}

export interface TreeNodeData {
  key: string;
  title: string;
  children?: TreeNodeData[];
}

// ============================================
// Location State & Props
// ============================================
export interface LocationState {
  list: Location[];
  selected: Location | null;
  isCreating: boolean;
  isLoading: boolean;
  isSaving: boolean;
  searchText: string;
  errors: Record<string, string>;
  draft: Partial<Location> | null;
}

export interface LocationTableProps {
  onSelect: (loc: Location) => void;
  onAdd: () => void;
}

export interface LocationFormProps {
  onClose: () => void;
}

// ============================================
// Hierarchy State & Props
// ============================================
export interface HierarchyState {
  data: OrgHierarchy | null;
  isLoading: boolean;
}

export interface OrgHierarchyTreeProps {
  /* no external props needed; reads from store */
}
