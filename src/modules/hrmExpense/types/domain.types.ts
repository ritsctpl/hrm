export type ExpenseStatus =
  | "DRAFT"
  | "PENDING_SUPERVISOR"
  | "ESCALATED"
  | "PENDING_FINANCE"
  | "APPROVED"
  | "REJECTED"
  | "PAID"
  | "RECALLED"
  | "CANCELLED";

export type ExpenseType = "ADVANCE" | "REIMBURSEMENT" | "MILEAGE" | "TRAVEL" | "GENERAL";

export type PaymentMode = "NEFT" | "IMPS" | "CHEQUE" | "CASH";

export interface ExpenseReport {
  handle: string;
  requestId: string;
  site?: string;
  employeeId: string;
  employeeName: string;
  expenseType: ExpenseType;
  purpose: string;
  travelRequestId?: string;
  costCenter?: string;
  projectCode?: string;
  wbsCode?: string;
  currency: string;
  exchangeRate: number;
  totalClaimedAmount: number;
  totalClaimedAmountInr: number;
  sanctionedAmount?: number;
  perDiemAmount?: number;
  outOfPolicy: boolean;
  outOfPolicyJustification?: string;
  lateSubmission?: boolean;
  originalsReceived?: boolean;
  paymentMode?: PaymentMode;
  paymentReference?: string;
  paymentDate?: string;
  financeRemarks?: string;
  financeUserId?: string;
  financeUserName?: string;
  items: ExpenseItem[];
  approvalHistory: ExpenseApprovalAction[];
  status: ExpenseStatus;
  currentApproverId?: string;
  currentApproverName?: string;
  supervisorId?: string;
  supervisorName?: string;
  escalationLevel?: number;
  slaDeadline?: string;
  slaBreached?: boolean;
  submittedAt?: string;
  createdDateTime: string;
  createdBy?: string;
  active?: number;
}

export interface ExpenseItem {
  handle: string;
  categoryId: string;
  categoryName?: string;
  expenseDate: string;
  description: string;
  amount: number;
  currency: string;
  fromLocation?: string;
  toLocation?: string;
  distanceKm?: number;
  ratePerKm?: number;
  mileageAmount?: number;
  /** Mileage mode of travel — e.g. "CAR" or "BIKE". Backend matches against MileageRateConfig.vehicles. */
  mode?: string;
  attachmentRefs?: string[];
  outOfPolicy: boolean;
}

export interface ExpenseApprovalAction {
  actorName?: string;
  actorRole: string;
  action: string;
  remarks?: string;
  sanctionedAmount?: number;
  paymentReference?: string;
  paymentMode?: PaymentMode;
  actionAt: string;
}

export interface ExpenseCategory {
  handle: string;
  site: string;
  categoryCode: string;
  categoryName: string;
  description?: string;
  dailyLimit?: number;
  perTripLimit?: number;
  requiresAttachment?: boolean;
  mileageCategory?: boolean;
  mileageRatePerKm?: number;
  active: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface MileageConfig {
  site: string;
  ratePerKm: number;
  effectiveFrom: string;
}

/**
 * Petrol-price-driven mileage rate config. Per-mode rate is derived as
 * `currentPetrolPriceInr / kmPerLitre`. See backend prompt §2 for the contract.
 */
export interface VehicleEfficiency {
  mode: string;            // "CAR" | "BIKE"
  label: string;           // "Car" | "Bike / Two-wheeler"
  kmPerLitre: number;
}

export interface MileageRateConfig {
  organizationId: string;
  currentPetrolPriceInr: number;
  vehicles: VehicleEfficiency[];
  modifiedAt?: string;
}

export interface EmployeeBankDetails {
  accountHolder: string;
  bankName: string;
  accountNumberMasked: string;
  ifsc: string;
}
