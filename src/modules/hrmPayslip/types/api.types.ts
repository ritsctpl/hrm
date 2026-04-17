// api.types.ts — Raw API request shapes for payslip module

export interface GeneratePayslipsRequest {
  organizationId: string;
  payrollRunId: string;
  payrollYear: number;
  payrollMonth: number;
  generatedBy: string;
  employeeIds?: string[] | null;
}

export interface RegeneratePayslipRequest {
  organizationId: string;
  employeeId: string;
  payrollYear: number;
  payrollMonth: number;
  regeneratedBy: string;
}

export interface DownloadPayslipRequest {
  organizationId: string;
  employeeId: string;
  payrollYear: number;
  payrollMonth: number;
  requestedBy: string;
  ipAddress?: string;
  accessType?: "VIEW" | "DOWNLOAD";
}

export interface DownloadPayslipByHrRequest {
  organizationId: string;
  handle: string;
  requestedBy: string;
}

export interface DownloadAllZipRequest {
  organizationId: string;
  payrollRunId: string;
}

export interface PayslipSearchRequest {
  organizationId: string;
  employeeId?: string;
  employeeNumber?: string;
  employeeName?: string;
  payrollYear?: number;
  payrollMonth?: number;
  requestedBy: string;
}

export interface PayslipTemplateRequest {
  organizationId: string;
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
  organizationId?: string;
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
  organizationId: string;
  handle: string;
  updatedBy: string;
}

export interface EmailPayslipsRequest {
  organizationId: string;
  payrollRunId: string;
  triggeredBy: string;
}

export interface SavePasswordConfigRequest {
  organizationId: string;
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
  organizationId: string;
  payslipId: string;
  reason: string;
  revokedBy: string;
}

export interface UploadTemplateLogoRequest {
  templateId: string;
  organizationId: string;
  logoUrl: string;
  updatedBy?: string;
}
