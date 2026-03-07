export type TravelStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "ESCALATED"
  | "APPROVED"
  | "REJECTED"
  | "CANCELLED";

export type TravelType = "LOCAL" | "DOMESTIC" | "OVERSEAS";

export type TravelMode = "CAB" | "AUTO" | "BUS" | "TRAIN" | "FLIGHT";

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
  status: TravelStatus;
  currentApproverId?: string;
  currentApproverName?: string;
  escalationLevel: number;
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
  OVERSEAS: TravelMode[];
}

export interface TravelPolicy {
  travelType: TravelType;
  allowedModes: TravelMode[];
  escalationWindowDays: number;
  allowedFileTypes: string[];
  maxFileSizeMb: number;
  maxFileCount: number;
}
