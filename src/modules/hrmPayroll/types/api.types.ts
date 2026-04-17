export interface CreatePayrollRunRequest {
  organizationId: string;
  company: string;
  payrollYear: number;
  payrollMonth: number;
  payDate: string;
  createdBy: string;
}

export interface LopInputRequest {
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  lopDays: number;
  updatedBy: string;
}

export type AdjustmentType =
  | 'BONUS'
  | 'INCENTIVE'
  | 'REIMBURSEMENT'
  | 'DEDUCTION'
  | 'ARREAR'
  | 'OTHER';

export interface PayrollAdjustmentRequest {
  organizationId: string;
  payrollRunId: string;
  employeeId: string;
  adjustmentType: AdjustmentType;
  description: string;
  amount: number;
  addedBy: string;
}

export interface RunCalculationRequest {
  organizationId: string;
  payrollRunId: string;
  performedBy: string;
}

export type PayrollApprovalAction = 'VALIDATE' | 'APPROVE' | 'FINALIZE' | 'PUBLISH';

export interface PayrollApprovalRequest {
  organizationId: string;
  payrollRunId: string;
  action: PayrollApprovalAction;
  performedBy: string;
  remarks: string;
}

// ─── Tax Declaration Types ───────────────────────────────────────────────────

export interface TaxDeclarationRequest {
  organizationId: string;
  employeeId: string;
  financialYear: string;
  regime: 'OLD' | 'NEW';
  declarations: TaxDeclarationItem[];
  submittedBy: string;
}

export interface TaxDeclarationItem {
  section: string;
  description: string;
  declaredAmount: number;
  proofSubmitted: boolean;
  proofUrl?: string;
  approvedAmount?: number;
}

export interface TaxDeclarationResponse {
  handle: string;
  site: string;
  employeeId: string;
  employeeName?: string;
  financialYear: string;
  regime: 'OLD' | 'NEW';
  declarations: TaxDeclarationItem[];
  totalDeclaredAmount?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  remarks?: string;
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface TaxDeclarationApprovalRequest {
  organizationId: string;
  employeeId: string;
  financialYear: string;
  approvedBy: string;
}

// ─── Loan Types ──────────────────────────────────────────────────────────────

export interface LoanRequest {
  organizationId: string;
  employeeId: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiStartMonth: string;
  remarks?: string;
  createdBy: string;
}

export interface LoanResponse {
  handle: string;
  site: string;
  employeeId: string;
  employeeName: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  emiStartMonth: string;
  totalRepaid: number;
  outstandingBalance: number;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  remarks?: string;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface LoanStatusUpdateRequest {
  organizationId: string;
  loanHandle: string;
  status: 'ACTIVE' | 'CLOSED' | 'CANCELLED';
  performedBy: string;
}

// ─── Payroll Summary Types ───────────────────────────────────────────────────

export interface PayrollSummaryResponse {
  payrollRunId: string;
  payrollPeriodLabel: string;
  status: string;
  totalEmployees: number;
  totalGrossEarnings: number;
  totalDeductions: number;
  totalNetPay: number;
  totalPfContribution: number;
  totalEsiContribution: number;
  totalProfessionalTax: number;
  totalTds: number;
  departmentBreakdown: {
    department: string;
    headcount: number;
    grossEarnings: number;
    deductions: number;
    netPay: number;
  }[];
}

// ─── Statutory Config Update ─────────────────────────────────────────────────

// ─── Variance Report Types ──────────────────────────────────────────────────

export interface VarianceReportRequest {
  organizationId: string;
  currentRunId: string;
  previousRunId: string;
}

export interface VarianceReportEntry {
  employeeId: string;
  employeeName: string | null;
  previousNetPay: number;
  currentNetPay: number;
  netPayVariance: number;
  previousGrossEarnings: number;
  currentGrossEarnings: number;
  grossVariance: number;
  previousTotalDeductions: number;
  currentTotalDeductions: number;
  deductionVariance: number;
}

// ─── Bank File Types ────────────────────────────────────────────────────────

export interface GenerateBankFileRequest {
  organizationId: string;
  payrollRunId: string;
  bankFormat?: 'NEFT' | 'RTGS' | 'IMPS';
}

// ─── Payroll Schedule Types ─────────────────────────────────────────────────

export interface PayrollScheduleRequest {
  organizationId: string;
  name: string;
  frequency: 'MONTHLY' | 'BIWEEKLY';
  payDay: number;
  cutoffDay: number;
  active?: boolean;
  createdBy: string;
}

export interface PayrollScheduleResponse {
  handle: string;
  site: string;
  name: string;
  frequency: 'MONTHLY' | 'BIWEEKLY';
  payDay: number;
  cutoffDay: number;
  active: boolean;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string | null;
}

// ─── Statutory Config Update ─────────────────────────────────────────────────

export interface UpdateStatutoryConfigRequest {
  handle: string;
  organizationId?: string;
  configType?: 'PF' | 'ESI' | 'PT';
  pfEmployeeRate?: number;
  pfEmployerRate?: number;
  pfWageCeiling?: number;
  pfOnActualWage?: boolean;
  esiEmployeeRate?: number;
  esiEmployerRate?: number;
  esiWageCeiling?: number;
  updatedBy: string;
}
