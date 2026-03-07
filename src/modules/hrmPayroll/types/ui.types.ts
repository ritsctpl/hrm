import type { PayrollRunSummary, PayrollEntry, TaxSlab, ProfessionalTaxSlab } from './domain.types';

export type PayrollTabKey = 'dashboard' | 'run' | 'review' | 'taxconfig';

export interface DashboardAlerts {
  missingCompensation: number;
  errorEmployees: number;
  pendingApprovals: number;
}

export interface WizardStepSelectMonthState {
  payrollYear: number;
  payrollMonth: number;
  payDate: string;
}

export interface LopInputState {
  employeeId: string;
  employeeName: string;
  lopDays: number;
  overtimeHours: number;
}

export interface PayrollSummaryCardProps {
  title: string;
  value: number | string;
  prefix?: string;
  variance?: number;
  valueColor?: 'green' | 'red' | 'blue' | 'default';
  icon?: React.ReactNode;
}

export interface PayrollRunsTableProps {
  runs: PayrollRunSummary[];
  loading: boolean;
  onRowClick: (run: PayrollRunSummary) => void;
}

export interface PayrollReviewTableProps {
  entries: PayrollEntry[];
  loading: boolean;
  onDetailsClick: (entry: PayrollEntry) => void;
}

export interface VarianceIndicatorProps {
  current: number;
  previous: number;
  thresholdWarning?: number;
  thresholdError?: number;
}

export interface TaxSlabRowProps {
  slab: TaxSlab;
  index: number;
  onChange: (index: number, slab: TaxSlab) => void;
  onDelete: (index: number) => void;
}

export interface PtSlabRowProps {
  slab: ProfessionalTaxSlab;
  index: number;
  onChange: (index: number, slab: ProfessionalTaxSlab) => void;
  onDelete: (index: number) => void;
}

export interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  isNextLoading?: boolean;
  isNextDisabled?: boolean;
  nextLabel?: string;
}
