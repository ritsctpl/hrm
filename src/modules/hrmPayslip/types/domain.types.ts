// domain.types.ts — Business entities for payslip module

export type PayslipStatus = "GENERATED" | "FAILED" | "REGENERATED";

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
