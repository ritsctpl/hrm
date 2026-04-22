import type { TravelMode, TravelStatus, TravelType } from "./domain.types";

export interface SiteRequest {
  organizationId: string;
}

export interface TravelListRequest {
  organizationId: string;
  employeeId?: string;
  status?: TravelStatus;
  travelType?: TravelType;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

export interface TravelApproverInboxRequest {
  organizationId: string;
  empId: string;
  inboxType?: "PENDING" | "ESCALATED" | "DECIDED";
  travelType?: TravelType;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface GetTravelByHandleRequest {
  organizationId?: string;
  handle: string;
}

export interface TravelRequestCreatePayload {
  organizationId: string;
  travelType: TravelType;
  purpose: string;
  destinationCity: string;
  destinationState?: string;
  destinationCountry?: string;
  travelMode: TravelMode;
  startDate: string;
  endDate?: string;
  startHour?: string;
  endHour?: string;
  coTravellerEmpIds?: string[];
  attachmentRefs?: string[];
  remarks?: string;
  createdBy: string;
}

export interface TravelRequestUpdatePayload {
  handle: string;
  organizationId: string;
  travelType: TravelType;
  purpose: string;
  destinationCity: string;
  destinationState?: string;
  destinationCountry?: string;
  travelMode: TravelMode;
  startDate: string;
  endDate?: string;
  startHour?: string;
  endHour?: string;
  coTravellerEmpIds?: string[];
  attachmentRefs?: string[];
  remarks?: string;
  createdBy: string;
}

export interface TravelSubmitRequest {
  organizationId: string;
  handle: string;
  submittedBy: string;
}

export interface TravelApprovalPayload {
  organizationId: string;
  travelRequestHandle: string;
  action: "APPROVE";
  remarks?: string;
  actorEmpId: string;
  actorName: string;
  actorRole: string;
}

export interface TravelRejectPayload {
  organizationId: string;
  travelRequestHandle: string;
  action: "REJECT";
  remarks: string;
  actorEmpId: string;
  actorName: string;
  actorRole: string;
}

export interface TravelCancelRequest {
  organizationId?: string;
  handle: string;
  cancelledBy: string;
  reason: string;
}

export interface TravelRecallRequest {
  organizationId: string;
  handle: string;
  reason: string;
}

export interface CoTravellerSearchRequest {
  organizationId: string;
  empId: string;
  query?: string;
}

export interface TravelPolicyUpdatePayload {
  organizationId: string;
  travelType: TravelType;
  allowedModes: TravelMode[];
  escalationWindowDays: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxFileCount: number;
}

// ── Catalog ─────────────────────────────────────────────────────────

export interface TravelCatalogSaveRequest {
  organizationId: string;
  travelType: TravelType;
  allowedModes: TravelMode[];
  escalationWindowDays: number;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  maxFileCount?: number;
  createdBy: string;
}

export interface TravelCatalogGetRequest {
  organizationId: string;
  travelType: TravelType;
}

export interface TravelCatalogModesRequest {
  organizationId: string;
  travelType: TravelType;
}

// ── Reports ─────────────────────────────────────────────────────────

export interface TravelReportByTypeDateRequest {
  organizationId: string;
  fromDate: string;
  toDate: string;
  travelType?: TravelType;
}

export interface TravelReportPendingAgingRequest {
  organizationId: string;
  empId: string;
}

// ── Travel Advance ──────────────────────────────────────────────────

export interface TravelAdvanceRequestPayload {
  organizationId: string;
  travelHandle: string;
  employeeId: string;
  amount: number;
  currency: string;
  purpose: string;
  requestedBy: string;
}

export interface TravelAdvanceApproveRequest {
  organizationId: string;
  handle: string;
  approvedBy: string;
  remarks?: string;
}

export interface TravelAdvanceSettleRequest {
  organizationId: string;
  handle: string;
  expenseHandle: string;
  settledBy: string;
}

export interface TravelAdvanceRetrieveRequest {
  organizationId: string;
  handle: string;
}

export interface TravelAdvance {
  handle: string;
  site: string;
  travelHandle: string;
  employeeId: string;
  employeeName: string;
  amount: number;
  currency: string;
  purpose: string;
  status: "REQUESTED" | "APPROVED" | "SETTLED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: string;
  approvalRemarks?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionRemarks?: string;
  expenseHandle?: string;
  settledBy?: string;
  settledAt?: string;
  createdDateTime: string;
  createdBy: string;
}
