export type PayrollRunStatus =
  | 'DRAFT'
  | 'VALIDATED'
  | 'APPROVED'
  | 'FINALIZED'
  | 'PUBLISHED';

export type PayrollEntryStatus = 'COMPUTED' | 'ERROR' | 'ADJUSTED' | 'LOCKED';

export interface PayrollRunSummary {
  handle: string;
  runId: string;
  site: string;
  company: string;
  payrollYear: number;
  payrollMonth: number;
  payrollPeriodLabel: string;
  payDate: string;
  status: PayrollRunStatus;
  totalEmployees: number;
  processedEmployees: number;
  errorEmployees: number;
  totalGrossEarnings: number;
  totalDeductions: number;
  totalNetPay: number;
  /** Convenience aliases used by dashboard and wizard components */
  totalGross?: number;
  totalNet?: number;
  missingCompensation?: number;
  pendingApprovals?: number;
  compensationDataReady: boolean;
  leaveLedgerReady: boolean;
  timesheetReady: boolean;
  holidayCalendarReady: boolean;
}

export interface PayrollComponentValue {
  componentCode: string;
  componentName: string;
  componentType: 'EARNING' | 'DEDUCTION';
  monthlyAmount: number;
  proratedAmount: number;
  isStatutory: boolean;
  displayOrder: number;
}

export interface PayrollAdjustment {
  adjustmentType: string;
  description: string;
  amount: number;
  addedBy: string;
  addedAt: string;
}

export interface PayrollEntry {
  handle: string;
  site: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  location: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  calendarDays: number;
  weeklyOffs: number;
  holidays: number;
  workingDays: number;
  lopDays: number;
  paidDays: number;
  isMidMonthJoiner: boolean;
  isMidMonthExit: boolean;
  earnings: PayrollComponentValue[];
  grossEarnings: number;
  deductions: PayrollComponentValue[];
  totalDeductions: number;
  pfEmployee: number;
  pfEmployer: number;
  esiEmployee: number;
  esiEmployer: number;
  professionalTax: number;
  incomeTax: number;
  annualizedIncome: number;
  taxableIncome: number;
  taxForYear: number;
  monthlyTds: number;
  adjustments: PayrollAdjustment[];
  totalAdjustments: number;
  arrearAmount: number;
  netPay: number;
  previousNetPay?: number;
  status: PayrollEntryStatus;
  errorDetails: string | null;
  errorMessage?: string;
}

export interface TaxSlab {
  fromAmount: number;
  toAmount: number | null;
  taxRate: number;
}

export interface TaxConfiguration {
  handle: string;
  site: string;
  financialYearStart: number;
  financialYearEnd: number;
  regime: 'OLD' | 'NEW';
  slabs: TaxSlab[];
  surchargeThreshold1: number;
  surchargeRate1: number;
  surchargeThreshold2: number;
  surchargeRate2: number;
  healthAndEducationCess: number;
  standardDeduction: number;
  rebateIncomeLimit: number;
  rebateAmount: number;
  active: number;
  createdBy: string;
}

export interface ProfessionalTaxSlab {
  fromSalary: number;
  toSalary: number | null;
  monthlyPT: number;
}

export interface StatutoryConfig {
  handle: string;
  site: string;
  configType: 'PF' | 'ESI' | 'PT';
  pfEmployeeRate?: number;
  pfEmployerRate?: number;
  pfWageCeiling?: number;
  pfOnActualWage?: boolean;
  esiEmployeeRate?: number;
  esiEmployerRate?: number;
  esiWageCeiling?: number;
  ptSlabs?: ProfessionalTaxSlab[];
  state?: string;
  active: number;
  createdBy: string;
}
