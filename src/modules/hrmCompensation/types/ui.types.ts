/**
 * HRM Compensation Module — UI Types
 * Component prop types and UI state shapes
 */

import type {
  PayComponent,
  SalaryStructure,
  EmployeeCompensationResponse,
  SalaryRevisionRow,
} from './domain.types';

export type CompensationTabKey = 'components' | 'structures' | 'assignment' | 'revision' | 'approvals';
export type RevisionMode = 'individual' | 'bulk';

export interface PayComponentFormState {
  componentCode: string;
  componentName: string;
  componentType: 'EARNING' | 'DEDUCTION' | 'EMPLOYER_CONTRIBUTION';
  subType: string;
  calculationMethod: string;
  fixedAmount?: number;
  percentage?: number;
  baseComponentCode?: string;
  formula?: string;
  cap?: number;
  minimum?: number;
  taxable: boolean;
  statutoryLinkage: string;
  pfWage: boolean;
  esiWage: boolean;
  payFrequency: string;
  displayOrder: number;
  showOnPayslip: boolean;
  mandatory: boolean;
}

export interface PayComponentListProps {
  components: PayComponent[];
  loading: boolean;
  selectedCode: string | null;
  onSelect: (component: PayComponent) => void;
  onNew: () => void;
}

export interface PayComponentFormProps {
  component: PayComponent | null;
  allComponents: PayComponent[];
  onSave: (data: PayComponentFormState) => Promise<void>;
  onDelete: (componentCode: string) => Promise<void>;
  onCancel: () => void;
}

export interface SalaryStructureListProps {
  structures: SalaryStructure[];
  loading: boolean;
  selectedCode: string | null;
  onSelect: (structure: SalaryStructure) => void;
  onNew: () => void;
}

export interface SalaryStructureBuilderProps {
  structure: SalaryStructure | null;
  availableComponents: PayComponent[];
  onSave: (structure: SalaryStructure) => Promise<void>;
  onCancel: () => void;
}

export interface CompensationPreviewProps {
  data: EmployeeCompensationResponse;
}

export interface SalaryRevisionTableProps {
  rows: SalaryRevisionRow[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onIncrementChange: (employeeId: string, newPercent: number) => void;
}

export interface CompensationStatusTagProps {
  status: string;
}

export interface CalcMethodBadgeProps {
  method: string;
}

export interface CurrencyCellProps {
  value: number;
  colored?: boolean;
}

export interface VariancePillProps {
  value: number;
  suffix?: string;
}
