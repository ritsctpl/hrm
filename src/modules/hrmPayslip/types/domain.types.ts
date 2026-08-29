// domain.types.ts — Business entities for payslip module

export type PayslipStatus = "ISSUED" | "REVOKED" | "GENERATED" | "FAILED" | "REGENERATED";

export interface PayslipListItem {
  handle: string;
  site: string;
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  designation: string;
  payrollRunId: string;
  payrollYear: number;
  payrollMonth: number;
  payPeriodLabel: string;
  templateCode: string;
  templateVersion: number;
  generatedBy: string;
  generatedAt: string;
  regenerationCount: number;
  status: PayslipStatus;
}

export interface PayslipGenerationResult {
  payrollRunId: string;
  payPeriodLabel: string;
  totalRequested: number;
  successCount: number;
  failureCount: number;
  failedEmployeeIds: string[];
  generatedAt: string;
}

export interface PayslipTemplate {
  handle: string;
  site: string;
  templateCode: string;
  templateName: string;
  isActive: boolean;
  companyName: string;
  companyAddress: string;
  companyLogoPath: string;
  cin: string;
  gstin: string;
  showAttendanceSection: boolean;
  showEarningsSection: boolean;
  showDeductionsSection: boolean;
  showTaxSection: boolean;
  showNetPayInWords: boolean;
  showFooterSignature: boolean;
  footerNote: string;
  signatureLabel: string;
  earningsSectionLabel: string;
  deductionsSectionLabel: string;
  version: number;
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface PayslipComponentValue {
  componentCode: string;
  componentName: string;
  componentType: "EARNING" | "DEDUCTION";
  proratedAmount: number;
  monthlyAmount: number;
  isStatutory: boolean;
  displayOrder: number;
}

export interface PayslipRenderData {
  companyName: string;
  companyAddress: string;
  companyLogoPath: string;
  cin: string;
  gstin: string;
  payPeriodLabel: string;
  payrollYear: number;
  payrollMonth: number;
  employeeName: string;
  employeeId: string;
  employeeNumber: string;
  designation: string;
  department: string;
  location: string;
  dateOfJoining: string;
  bankAccountNumber: string;
  bankIfscCode: string;
  workingDays: number;
  paidDays: number;
  lopDays: number;
  earnings: PayslipComponentValue[];
  grossEarnings: number;
  deductions: PayslipComponentValue[];
  totalDeductions: number;
  netPay: number;
  netPayInWords: string;
  earningsSectionLabel: string;
  deductionsSectionLabel: string;
  showAttendanceSection: boolean;
  showNetPayInWords: boolean;
  showFooterSignature: boolean;
  footerNote: string;
  signatureLabel: string;
}

/**
 * The frozen payslip, as the backend returns it. be-spec §4.7.
 *
 * No PDF is stored server-side: this object IS the payslip, and the browser renders both the
 * preview and the downloadable file from it, so the two cannot drift.
 */
export interface PayslipSnapshotLine {
  componentCode: string;
  componentName: string;
  amount: number | null;
  displayOrder: number | null;
}

export interface PayslipSnapshot {
  companyName: string | null;
  companyAddress: string | null;
  companyLogoPath: string | null;
  footerNote: string | null;

  employeeId: string | null;
  employeeNumber: string | null;
  employeeName: string | null;
  designation: string | null;
  department: string | null;
  gender: string | null;
  dateOfJoining: string | null;
  /** Already masked by the server — the unmasked value never leaves the employee master. */
  panMasked: string | null;
  uan: string | null;
  bankIfsc: string | null;
  accountNumberMasked: string | null;

  payrollYear: number;
  payrollMonth: number;
  payPeriodLabel: string | null;
  payableDays: number | null;
  lopDays: number | null;

  earnings: PayslipSnapshotLine[] | null;
  deductions: PayslipSnapshotLine[] | null;

  grossEarnings: number | null;
  grossDeductions: number | null;
  netPay: number | null;

  /** Casual leave only — site RITS has no comp-off leave type. Operator decision 2026-08-28. */
  casualLeaveBalance: number | null;

  templateHandle: string | null;
  templateVersion: number | null;
  showLeaveBalance: boolean | null;

  /** Inputs the client derives the PDF password from. be-spec §12. */
  passwordEnabled: boolean | null;
  passwordPattern: string | null;
  passwordPanPrefix: string | null;
  passwordDobDdmm: string | null;
  passwordDobDdmmyyyy: string | null;
}

export interface PayslipPasswordConfig {
  enabled: boolean;
  pattern: string | null;
}
