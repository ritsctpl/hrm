import type { TravelStatus, TravelType, TravelMode } from "../types/domain.types";

export const TRAVEL_STATUS_COLORS: Record<TravelStatus, string> = {
  DRAFT: "default",
  PENDING_APPROVAL: "warning",
  ESCALATED: "volcano",
  APPROVED: "success",
  REJECTED: "error",
  CANCELLED: "default",
};

export const TRAVEL_STATUS_LABELS: Record<TravelStatus, string> = {
  DRAFT: "Draft",
  PENDING_APPROVAL: "Pending Approval",
  ESCALATED: "Escalated",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const TRAVEL_TYPE_COLORS: Record<TravelType, string> = {
  LOCAL: "blue",
  DOMESTIC: "green",
  OVERSEAS: "purple",
};

export const TRAVEL_MODE_LABELS: Record<TravelMode, string> = {
  CAB: "Cab",
  AUTO: "Auto",
  BUS: "Bus",
  TRAIN: "Train",
  FLIGHT: "Flight",
};

export const ALLOWED_MODES_BY_TYPE: Record<TravelType, TravelMode[]> = {
  LOCAL: ["CAB", "AUTO", "BUS"],
  DOMESTIC: ["CAB", "BUS", "TRAIN", "FLIGHT"],
  OVERSEAS: ["FLIGHT"],
};

export const CANCELLABLE_STATUSES: TravelStatus[] = ["DRAFT", "PENDING_APPROVAL"];
export const RECALLABLE_STATUSES: TravelStatus[] = ["PENDING_APPROVAL", "ESCALATED"];

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
