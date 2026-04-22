import type { TravelMode, TravelType } from "./domain.types";

export type TravelScreenMode = "list" | "create" | "view";

export type TravelDetailTab = "details" | "cotravellers" | "attachments" | "timeline";

export type InboxTab = "pending" | "escalated" | "decided";

export interface TravelFormState {
  travelType: TravelType | null;
  purpose: string;
  destinationCity: string;
  destinationState: string;
  destinationCountry: string;
  travelMode: TravelMode | null;
  travelDate: string | null;
  startHour: string | null;
  endHour: string | null;
  startDate: string | null;
  endDate: string | null;
  remarks: string;
  coTravellerIds: string[];
}

export interface SlaInfo {
  daysRemaining: number | null;
  isOverdue: boolean;
  label: string;
  color: "success" | "warning" | "error";
}
