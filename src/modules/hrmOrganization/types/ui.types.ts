/**
 * HRM Organization Module - UI Types
 * Types specific to component props and UI state
 */

import type { CompanyProfile, BusinessUnit, Department, DepartmentNode } from './domain.types';

// ============================================
// Tab Types
// ============================================
export type MainTabKey = 'company' | 'businessUnit' | 'department';

export type CompanyTabKey = 'identity' | 'statutory' | 'bank' | 'address' | 'contact';

export type BusinessUnitTabKey = 'general' | 'contact' | 'address' | 'statutory';

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
    pinCode: string;
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
    branchName: string;
    accountNumber: string;
    ifscCode: string;
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
