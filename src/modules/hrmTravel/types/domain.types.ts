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

export interface TravelPolicy {
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
}
