/** be-spec §9: CREATED -> APPROVED -> PAID -> LOCKED. Creation now computes, so the separate
 *  DRAFT/PROCESSING/COMPUTED states no longer exist. */
export type PayrollRunStatus =
  | 'CREATED'
  | 'APPROVED'
  | 'PAID'
  | 'LOCKED';

export type PayrollEntryStatus = 'COMPUTED' | 'ERROR' | 'ADJUSTED' | 'LOCKED';

export interface PayrollRunSummary {
  handle: string;
  /** COMPUTED by the engine, or IMPORT from the history back-load. be-spec §4.6. */
  origin?: string | null;
  runId: string;
  site?: string;
  company?: string;
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
  compensationDataReady?: boolean;
  leaveLedgerReady?: boolean;
  timesheetReady?: boolean;
  holidayCalendarReady?: boolean;
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
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy: string;
  modifiedBy?: string;
}

/** One parsed row of a history CSV, with the verdict on it. be-spec §11. */
export interface PayrollHistoryRow {
  rowNumber: number;
  employeeCode: string | null;
  employeeName: string | null;
  payrollYear: number | null;
  payrollMonth: number | null;
  payPeriodLabel: string | null;
  payableDays: number | null;
  lopDays: number | null;
  grossEarnings: number | null;
  grossDeductions: number | null;
  netPay: number | null;
  status: 'OK' | 'WARN' | 'ERROR';
  message: string | null;
}

export interface PayrollHistoryPreview {
  uploadRef: string;
  totalRows: number;
  okCount: number;
  warnCount: number;
  errorCount: number;
  periods: string[] | null;
  rows: PayrollHistoryRow[] | null;
  /** Always true on a preview — the screen says it out loud. */
  nothingWritten: boolean;
}

export interface PayrollHistoryCommitResult {
  runsCreated: number;
  payslipsCreated: number;
  rowsSkipped: number;
  periods: string[] | null;
  messages: string[] | null;
}
