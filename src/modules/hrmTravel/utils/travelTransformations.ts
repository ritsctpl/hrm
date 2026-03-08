import type { TravelRequest } from "../types/domain.types";
import type { SlaInfo } from "../types/ui.types";
import { SLA_WARNING_DAYS } from "./travelConstants";
import dayjs from "dayjs";

export function computeSlaInfo(request: TravelRequest): SlaInfo {
  if (!request.slaDeadline) {
    return { daysRemaining: null, isOverdue: false, label: "", color: "success" };
  }
  const now = dayjs();
  const deadline = dayjs(request.slaDeadline);
  const days = deadline.diff(now, "day");
  if (days < 0) {
    return { daysRemaining: days, isOverdue: true, label: "Overdue", color: "error" };
  }
  if (days <= SLA_WARNING_DAYS) {
    return { daysRemaining: days, isOverdue: false, label: `Due ${days}d`, color: "warning" };
  }
  return { daysRemaining: days, isOverdue: false, label: `Due ${days}d`, color: "success" };
}

export function formatDateRange(request: TravelRequest): string {
  if (request.travelType === "LOCAL" && request.travelDate) {
    return dayjs(request.travelDate).format("DD MMM YYYY");
  }
  if (request.startDate && request.endDate) {
    return `${dayjs(request.startDate).format("DD MMM")} – ${dayjs(request.endDate).format("DD MMM YYYY")}`;
  }
  return "—";
}

export function formatDestination(request: TravelRequest): string {
  const parts: string[] = [request.destinationCity];
  if (request.destinationState) parts.push(request.destinationState);
  if (request.destinationCountry && request.travelType === "INTERNATIONAL") {
    parts.push(request.destinationCountry);
  }
  return parts.join(", ");
}
