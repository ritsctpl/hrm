export interface CreatePayrollRunRequest {
  site: string;
  company: string;
  payrollYear: number;
  payrollMonth: number;
  payDate: string;
  createdBy: string;
}

export interface LopInputRequest {
  site: string;
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
  site: string;
  payrollRunId: string;
  employeeId: string;
  adjustmentType: AdjustmentType;
  description: string;
  amount: number;
  addedBy: string;
}

export interface RunCalculationRequest {
  site: string;
  payrollRunId: string;
  performedBy: string;
}

export type PayrollApprovalAction = 'VALIDATE' | 'APPROVE' | 'FINALIZE' | 'PUBLISH';

export interface PayrollApprovalRequest {
  site: string;
  payrollRunId: string;
  action: PayrollApprovalAction;
  performedBy: string;
  remarks: string;
}
