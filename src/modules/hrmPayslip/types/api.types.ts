// api.types.ts — Raw API request shapes for payslip module

export interface GeneratePayslipsRequest {
  site: string;
  payrollRunId: string;
  payrollYear: number;
  payrollMonth: number;
  generatedBy: string;
  employeeIds?: string[] | null;
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
  ipAddress?: string;
  accessType?: "VIEW" | "DOWNLOAD";
}

export interface DownloadPayslipByHrRequest {
  site: string;
  handle: string;
  requestedBy: string;
}

export interface DownloadAllZipRequest {
  site: string;
  payrollRunId: string;
}

export interface PayslipSearchRequest {
  site: string;
  employeeId?: string;
  employeeNumber?: string;
  employeeName?: string;
  payrollYear?: number;
  payrollMonth?: number;
  requestedBy: string;
}

export interface PayslipTemplateRequest {
  site: string;
  templateCode: string;
  templateName: string;
  companyName?: string;
  companyAddress?: string;
  companyLogoPath?: string;
  cin?: string;
  gstin?: string;
  showAttendanceSection?: boolean;
  showEarningsSection?: boolean;
  showDeductionsSection?: boolean;
  showTaxSection?: boolean;
  showNetPayInWords?: boolean;
  showFooterSignature?: boolean;
  footerNote?: string;
  signatureLabel?: string;
  earningsSectionLabel?: string;
  deductionsSectionLabel?: string;
  createdBy: string;
}

export interface UpdatePayslipTemplateRequest {
  handle: string;
  site?: string;
  templateName?: string;
  companyName?: string;
  companyAddress?: string;
  footerNote?: string;
  signatureLabel?: string;
  earningsSectionLabel?: string;
  deductionsSectionLabel?: string;
  updatedBy: string;
}

export interface SetActiveTemplateRequest {
  site: string;
  handle: string;
  updatedBy: string;
}

export interface EmailPayslipsRequest {
  site: string;
  payrollRunId: string;
  triggeredBy: string;
}

export interface SavePasswordConfigRequest {
  site: string;
  enabled: boolean;
  pattern: string;
  updatedBy?: string;
}

export interface PasswordConfig {
  handle: string;
  site: string;
  enabled: boolean;
  pattern: string;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface RevokePayslipRequest {
  site: string;
  payslipId: string;
  reason: string;
  revokedBy: string;
}

export interface UploadTemplateLogoRequest {
  templateId: string;
  site: string;
  logoUrl: string;
  updatedBy?: string;
}
