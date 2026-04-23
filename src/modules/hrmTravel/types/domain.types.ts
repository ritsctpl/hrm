export type TravelStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ESCALATED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED"
  | "RECALLED";

export type TravelType = "LOCAL" | "DOMESTIC" | "INTERNATIONAL";

export type TravelMode = "CAB" | "AUTO" | "BUS" | "TRAIN" | "FLIGHT" | "AIR";

export interface TravelRequest {
  handle: string;
  requestId: string;
  site: string;
  employeeId: string;
  employeeName: string;
  travelType: TravelType;
  purpose: string;
  destinationCity: string;
  destinationState?: string;
  destinationCountry?: string;
  travelMode: TravelMode;
  travelDate?: string;
  startHour?: string;
  endHour?: string;
  startDate?: string;
  endDate?: string;
  remarks?: string;
  onDutyApplied: boolean;
  onDutyEntryRef?: string;
  status: TravelStatus;
  currentApproverId?: string;
  currentApproverName?: string;
  approverChainSnapshot?: ApproverChainEntry[];
  escalationLevel: number;
  escalationDueDate?: string;
  slaDeadline?: string;
  slaBreached: boolean;
  rejectionReason?: string;
  cancellationReason?: string;
  coTravellers: CoTravellerDto[];
  attachments: TravelAttachment[];
  actionHistory: TravelAction[];
  submittedAt?: string;
  createdDateTime: string;
  createdBy: string;
  active: number;
}

export interface CoTravellerDto {
  employeeId: string;
  employeeName: string;
  department: string;
  hasConflict: boolean;
  conflictReason?: string;
  onDutyEntryRef?: string;
  localStartTime?: string;
  localEndTime?: string;
}

export interface ApproverChainEntry {
  level: number;
  approverId: string;
  approverName?: string;
  approverRole?: string;
  status?: "PENDING" | "APPROVED" | "REJECTED" | "ESCALATED" | "SKIPPED";
  actionAt?: string;
}

export interface TravelAttachment {
  attachmentId: string;
  fileName: string;
  fileSizeBytes: number;
  uploadedAt: string;
  uploadedBy: string;
}

export interface TravelAction {
  actionId: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  fromStatus: string;
  toStatus: string;
  remarks?: string;
  escalationLevel: number;
  actionDateTime: string;
}

export interface TravelModeCatalog {
  LOCAL: TravelMode[];
  DOMESTIC: TravelMode[];
  INTERNATIONAL: TravelMode[];
}

export interface GradeEntitlement {
  grade: string;
  travelClass: "ECONOMY" | "PREMIUM_ECONOMY" | "BUSINESS" | "FIRST";
  hotelCategory: "3_STAR" | "4_STAR" | "5_STAR" | "PREMIUM";
  perDiemAmount: number;
  perDiemCurrency: string;
}

export interface ApprovalLevel {
  level: number;
  upToAmount: number;
  approverRole: string;
  slaHours: number;
}

export interface BlackoutPeriod {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface TravelPolicy {
  // Core (existing, backward compatible)
  handle?: string;
  site?: string;
  travelType: TravelType;
  allowedModes: TravelMode[];
  escalationWindowDays: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxFileCount: number;
  active?: number;
  createdDateTime?: string;
  modifiedDateTime?: string;
  createdBy?: string;
  modifiedBy?: string;

  // Grade entitlements (travel class, hotel, per-diem by grade)
  gradeEntitlements?: GradeEntitlement[];

  // Expense caps (daily ceilings)
  maxLodgingPerDay?: number;
  maxMealsPerDay?: number;
  maxIncidentalsPerDay?: number;
  expenseCurrency?: string;

  // Advance policy
  advanceEnabled?: boolean;
  maxAdvanceAmount?: number;
  maxAdvancePercent?: number;
  advanceSettlementDays?: number;

  // Booking rules
  advanceBookingWindowDays?: number;
  preferredVendors?: string[];
  selfBookingThreshold?: number;

  // Approval matrix
  approvalMatrix?: ApprovalLevel[];

  // Claim submission
  claimDeadlineDaysAfterReturn?: number;
  mandatoryDocuments?: string[];

  // International specifics (only relevant for INTERNATIONAL type)
  visaRequiredDaysBefore?: number;
  forexLimitAmount?: number;
  forexLimitCurrency?: string;
  insuranceMandatory?: boolean;
  vaccinationRequirements?: string;

  // Cancellation
  cancellationRefundWindowDays?: number;
  cancellationChargePercent?: number;

  // Leave integration
  autoOnDutyOnApproval?: boolean;

  // Blackout periods
  blackoutPeriods?: BlackoutPeriod[];
}
