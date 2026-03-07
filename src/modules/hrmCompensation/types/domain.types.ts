/**
 * HRM Compensation Module — Domain Types
 * Business entity interfaces
 */

export type ComponentType = 'EARNING' | 'DEDUCTION';
export type SubType = 'FIXED' | 'VARIABLE' | 'REIMBURSEMENT' | 'STATUTORY';
export type CalcMethod = 'FIXED' | 'PERCENTAGE' | 'FORMULA';
export type PayFrequency = 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'ONE_TIME';
export type StatutoryLinkage = 'PF' | 'ESI' | 'PT' | 'NONE';
export type CompensationStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED';

export interface PayComponent {
  handle: string;
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
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
  createdBy: string;
  modifiedBy: string;
}

export interface SalaryStructureComponent {
  componentCode: string;
  calculationMethod: CalcMethod;
  defaultAmount?: number;
  defaultPercentage?: number;
  formula?: string;
  displayOrder: number;
}

export interface SalaryStructure {
  handle: string;
  site: string;
  structureCode: string;
  structureName: string;
  description: string;
  applicableGrade: string;
  components: SalaryStructureComponent[];
  active: number;
  createdDateTime: string;
  modifiedDateTime: string;
}

export interface CompensationComponent {
  componentCode: string;
  componentName: string;
  componentType: ComponentType;
  calculationMethod: CalcMethod;
  amount?: number;
  percentage?: number;
  formula?: string;
  derivedAmount: number;
  taxable: boolean;
  displayOrder: number;
}

export interface CompensationAuditEntry {
  action: string;
  performedBy: string;
  performedAt: string;
  remarks: string;
}

export interface EmployeeCompensationResponse {
  handle: string;
  employeeId: string;
  employeeName: string;
  department: string;
  designation: string;
  effectiveFrom: string;
  effectiveTo?: string;
  structureCode: string;
  status: CompensationStatus;
  components: CompensationComponent[];
  grossEarnings: number;
  totalDeductions: number;
  netPay: number;
  monthlyCTC: number;
  annualCTC: number;
  revisionNumber: number;
  remarks: string;
  approvedBy?: string;
  approvedOn?: string;
  rejectedBy?: string;
  rejectionReason?: string;
  auditTrail: CompensationAuditEntry[];
}

export interface SalaryRevisionRow {
  employeeId: string;
  employeeName: string;
  department: string;
  currentBasic: number;
  currentGross: number;
  incrementPercent: number;
  newBasic: number;
  newGross: number;
  effectiveFrom: string;
  status: CompensationStatus;
}
