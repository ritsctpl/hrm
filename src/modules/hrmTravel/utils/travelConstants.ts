import type { TravelStatus, TravelType, TravelMode } from "../types/domain.types";

export const TRAVEL_STATUS_COLORS: Record<TravelStatus, string> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  ESCALATED: "volcano",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "default",
  RECALLED: "default",
};

export const TRAVEL_STATUS_LABELS: Record<TravelStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ESCALATED: "Escalated",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
  RECALLED: "Recalled",
};

export const TRAVEL_TYPE_COLORS: Record<TravelType, string> = {
  LOCAL: "blue",
  DOMESTIC: "green",
  INTERNATIONAL: "purple",
};

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  CAB: "Cab",
  AUTO: "Auto",
  BUS: "Bus",
  TRAIN: "Train",
  FLIGHT: "Flight",
  AIR: "Air",
};

export const ALLOWED_MODES_BY_TYPE: Record<TravelType, TravelMode[]> = {
  LOCAL: ["CAB", "AUTO", "BUS"],
  DOMESTIC: ["CAB", "BUS", "TRAIN", "FLIGHT"],
  INTERNATIONAL: ["FLIGHT", "AIR"],
};

export const CANCELLABLE_STATUSES: TravelStatus[] = ["DRAFT", "PENDING_APPROVAL"];
// Backend permits recall only on PENDING_APPROVAL — keep this aligned.
export const RECALLABLE_STATUSES: TravelStatus[] = ["PENDING_APPROVAL"];

export const SLA_WARNING_DAYS = 3;

export const DEFAULT_FORM_STATE = {
  travelType: null,
  purpose: "",
  destinationCity: "",
  destinationState: "",
  destinationCountry: "",
  travelMode: null,
  travelDate: null,
  startHour: null,
  endHour: null,
  startDate: null,
  endDate: null,
  remarks: "",
  coTravellerIds: [],
};
