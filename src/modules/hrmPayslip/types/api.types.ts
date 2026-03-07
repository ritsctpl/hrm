// api.types.ts — Raw API request shapes for payslip module

export interface GeneratePayslipsRequest {
  site: string;
  payrollRunId: string;
  payrollYear: number;
  payrollMonth: number;
  generatedBy: string;
  employeeIds: string[] | null;
}

export interface RegeneratePayslipRequest {
  site: string;
  employeeId: string;
  payrollYear: number;
  payrollMonth: number;
  regeneratedBy: string;
}

export interface DownloadPayslipRequest {
  site: string;
  employeeId: string;
  payrollYear: number;
  payrollMonth: number;
  requestedBy: string;
  ipAddress: string;
  accessType: "VIEW" | "DOWNLOAD";
}

export interface DownloadAllZipRequest {
  site: string;
  payrollRunId: string;
  payrollYear: number;
  payrollMonth: number;
  requestedBy: string;
}

export interface PayslipSearchRequest {
  site: string;
  payrollYear?: number;
  payrollMonth?: number;
  employeeSearch?: string;
  status?: string;
}

export interface PayslipTemplateRequest {
  site: string;
  templateCode: string;
  templateName: string;
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
  createdBy: string;
  modifiedBy?: string;
  handle?: string;
}

export interface SetActiveTemplateRequest {
  site: string;
  handle: string;
  updatedBy: string;
}

export interface EmailPayslipsRequest {
  site: string;
  payrollRunId: string;
  payrollYear: number;
  payrollMonth: number;
  employeeIds: string[] | null;
  sentBy: string;
}

export interface SavePasswordConfigRequest {
  site: string;
  passwordPattern: string;
  description: string;
  updatedBy: string;
}

export interface PasswordConfig {
  site: string;
  passwordPattern: string;
  description: string;
  updatedBy: string;
  updatedAt: string;
}

export interface RevokePayslipRequest {
  site: string;
  handle: string;
  revokedBy: string;
  reason: string;
}
