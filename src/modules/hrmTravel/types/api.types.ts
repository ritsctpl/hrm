import type { TravelMode, TravelStatus, TravelType } from "./domain.types";

export interface SiteRequest {
  site: string;
}

export interface TravelListRequest {
  site: string;
  employeeId?: string;
  status?: TravelStatus;
  travelType?: TravelType;
  searchTerm?: string;
  fromDate?: string;
  toDate?: string;
}

export interface TravelApproverInboxRequest {
  site: string;
  empId: string;
  inboxType?: "PENDING" | "ESCALATED" | "DECIDED";
  travelType?: TravelType;
  fromDate?: string;
  toDate?: string;
  searchTerm?: string;
}

export interface GetTravelByHandleRequest {
  site?: string;
  handle: string;
}

export interface TravelRequestCreatePayload {
  site: string;
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
  site: string;
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
  site: string;
  handle: string;
  submittedBy: string;
}

export interface TravelApprovalPayload {
  site: string;
  travelRequestHandle: string;
  action: "APPROVE";
  remarks?: string;
  actorEmpId: string;
  actorName: string;
  actorRole: string;
}

export interface TravelRejectPayload {
  site: string;
  travelRequestHandle: string;
  action: "REJECT";
  remarks: string;
  actorEmpId: string;
  actorName: string;
  actorRole: string;
}

export interface TravelCancelRequest {
  site?: string;
  handle: string;
  cancelledBy: string;
  reason: string;
}

export interface TravelRecallRequest {
  site: string;
  handle: string;
  reason: string;
}

export interface CoTravellerSearchRequest {
  site: string;
  empId: string;
  query?: string;
}

export interface TravelPolicyUpdatePayload {
  site: string;
  travelType: TravelType;
  allowedModes: TravelMode[];
  escalationWindowDays: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxFileCount: number;
}

// ── Catalog ─────────────────────────────────────────────────────────

export interface TravelCatalogSaveRequest {
  site: string;
  travelType: TravelType;
  allowedModes: TravelMode[];
  escalationWindowDays: number;
  allowedFileTypes?: string[];
  maxFileSizeMb?: number;
  maxFileCount?: number;
  createdBy: string;
}

export interface TravelCatalogGetRequest {
  site: string;
  travelType: TravelType;
}

export interface TravelCatalogModesRequest {
  site: string;
  travelType: TravelType;
}

// ── Reports ─────────────────────────────────────────────────────────

export interface TravelReportByTypeDateRequest {
  site: string;
  fromDate: string;
  toDate: string;
  travelType?: TravelType;
}

export interface TravelReportPendingAgingRequest {
  site: string;
  empId: string;
}

// ── Travel Advance ──────────────────────────────────────────────────

export interface TravelAdvanceRequestPayload {
  site: string;
  travelHandle: string;
  employeeId: string;
  amount: number;
  currency: string;
  purpose: string;
  requestedBy: string;
}

export interface TravelAdvanceApproveRequest {
  site: string;
  handle: string;
  approvedBy: string;
  remarks?: string;
}

export interface TravelAdvanceSettleRequest {
  site: string;
  handle: string;
  expenseHandle: string;
  settledBy: string;
}

export interface TravelAdvanceRetrieveRequest {
  site: string;
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
  approvalRemarks?: string;
  expenseHandle?: string;
  settledBy?: string;
  settledAt?: string;
  createdDateTime: string;
  createdBy: string;
}
