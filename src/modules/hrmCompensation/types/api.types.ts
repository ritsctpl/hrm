/**
 * HRM Compensation Module — API Types
 * Raw request/response shapes for all compensation API endpoints
 */

export type ComponentType = 'EARNING' | 'DEDUCTION';
export type SubType = 'FIXED' | 'VARIABLE' | 'REIMBURSEMENT' | 'STATUTORY';
export type CalcMethod = 'FIXED' | 'PERCENTAGE' | 'FORMULA';
export type PayFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
export type StatutoryLinkage = 'PF' | 'ESI' | 'PT' | 'NONE';
export type CompensationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface PayComponentRequest {
  site: string;
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  subType: SubType;
  calculationMethod: CalcMethod;
  fixedAmount?: number;
  percentage?: number;
  baseComponentCode?: string;
  formula?: string;
  cap?: number;
  minimum?: number;
  taxable: boolean;
  statutoryLinkage: StatutoryLinkage;
  pfWage: boolean;
  esiWage: boolean;
  payFrequency: PayFrequency;
  displayOrder: number;
  showOnPayslip: boolean;
  mandatory: boolean;
  createdBy?: string;
  modifiedBy?: string;
}

export interface DeactivateComponentRequest {
  site: string;
  componentCode: string;
  updatedBy: string;
}

export interface SalaryStructureComponentRequest {
  componentCode: string;
  calculationMethod: CalcMethod;
  defaultAmount?: number;
  defaultPercentage?: number;
  formula?: string;
  displayOrder: number;
}

export interface SalaryStructureRequest {
  site: string;
  structureCode: string;
  structureName: string;
  description: string;
  applicableGrade: string;
  components: SalaryStructureComponentRequest[];
  createdBy?: string;
  modifiedBy?: string;
}

export interface CompensationComponentRequest {
  componentCode: string;
  calculationMethod: CalcMethod;
  amount?: number;
  percentage?: number;
  formula?: string;
}

export interface EmployeeCompensationRequest {
  site: string;
  employeeId: string;
  effectiveFrom: string;
  structureCode: string;
  components: CompensationComponentRequest[];
  remarks: string;
  createdBy: string;
}

export type PreviewCompensationRequest = EmployeeCompensationRequest;

export interface SubmitForApprovalRequest {
  site: string;
  handle: string;
  submittedBy: string;
}

export interface CompensationApprovalRequest {
  site: string;
  handle: string;
  action: 'APPROVE' | 'REJECT';
  remarks: string;
  performedBy: string;
}

// ─── Update Employee Compensation ────────────────────────────────────────────

export interface UpdateEmployeeCompensationRequest {
  site: string;
  handle: string;
  components: CompensationComponentRequest[];
  remarks: string;
  modifiedBy: string;
}

// ─── Bulk Import ─────────────────────────────────────────────────────────────

export interface BulkImportCompensationRequest {
  site: string;
  entries: {
    employeeId: string;
    effectiveFrom: string;
    structureCode: string;
    components: CompensationComponentRequest[];
    remarks?: string;
  }[];
  importedBy: string;
}

// ─── Revision Report ─────────────────────────────────────────────────────────

export interface RevisionReportResponse {
  periodStart: string;
  periodEnd: string;
  totalRevisions: number;
  revisions: {
    employeeId: string;
    employeeName: string;
    department: string;
    previousGross: number;
    newGross: number;
    incrementPercent: number;
    effectiveFrom: string;
    status: CompensationStatus;
  }[];
}
