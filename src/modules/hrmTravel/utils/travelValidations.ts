import dayjs from "dayjs";
import type { TravelFormState } from "../types/ui.types";
import type { CoTravellerDto } from "../types/domain.types";

export interface TravelFormErrors {
  travelType?: string;
  purpose?: string;
  destinationCity?: string;
  destinationState?: string;
  destinationCountry?: string;
  travelMode?: string;
  travelDate?: string;
  startHour?: string;
  endHour?: string;
  startDate?: string;
  endDate?: string;
  coTravellers?: string;
}

export interface TravelValidationContext {
  coTravellers?: CoTravellerDto[];
  /** When true, allows back-dated travel (use for view/legacy scenarios). Default false. */
  allowBackdated?: boolean;
}

const HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateTravelForm(
  form: TravelFormState,
  ctx: TravelValidationContext = {},
): TravelFormErrors {
  const errors: TravelFormErrors = {};
  const today = dayjs().startOf("day");

  if (!form.travelType) errors.travelType = "Travel type is required.";
  if (!form.purpose.trim()) errors.purpose = "Purpose is required.";
  if (form.purpose.trim().length > 500) errors.purpose = "Purpose must be under 500 characters.";
  if (!form.destinationCity.trim()) errors.destinationCity = "Destination city is required.";
  if (!form.travelMode) errors.travelMode = "Travel mode is required.";

  if (form.travelType === "LOCAL") {
    if (!form.travelDate) errors.travelDate = "Travel date is required.";
    if (!form.startHour) errors.startHour = "Start hour is required.";
    if (!form.endHour) errors.endHour = "End hour is required.";

    // BV4: travel date should be today or later
    if (!ctx.allowBackdated && form.travelDate && dayjs(form.travelDate).isBefore(today, "day")) {
      errors.travelDate = "Travel date cannot be in the past.";
    }

    // BV3: endHour must be after startHour on same day
    if (form.startHour && form.endHour && HOUR_RE.test(form.startHour) && HOUR_RE.test(form.endHour)) {
      if (form.endHour <= form.startHour) {
        errors.endHour = "End hour must be after start hour.";
      }
    }
  } else if (form.travelType === "DOMESTIC" || form.travelType === "INTERNATIONAL") {
    if (!form.destinationState.trim()) errors.destinationState = "Destination state is required.";
    if (!form.startDate) errors.startDate = "Start date is required.";
    if (!form.endDate) errors.endDate = "End date is required.";
    if (form.travelType === "INTERNATIONAL" && !form.destinationCountry.trim()) {
      errors.destinationCountry = "Destination country is required.";
    }

    // BV4: start date should be today or later
    if (!ctx.allowBackdated && form.startDate && dayjs(form.startDate).isBefore(today, "day")) {
      errors.startDate = "Start date cannot be in the past.";
    }

    // BV2: endDate >= startDate
    if (form.startDate && form.endDate && dayjs(form.endDate).isBefore(dayjs(form.startDate), "day")) {
      errors.endDate = "End date must be on or after start date.";
    }
  }

  // BR2: block submit when any selected co-traveller has a conflict
  if (ctx.coTravellers && ctx.coTravellers.length > 0) {
    const conflicted = ctx.coTravellers.filter(
      (t) => form.coTravellerIds.includes(t.employeeId) && t.hasConflict,
    );
    if (conflicted.length > 0) {
      errors.coTravellers = `${conflicted.length} co-traveller${conflicted.length > 1 ? "s have" : " has"} a conflicting travel — remove or resolve before submit.`;
    }
  }

  return errors;
}

export function isTravelFormValid(
  form: TravelFormState,
  ctx: TravelValidationContext = {},
): boolean {
  return Object.keys(validateTravelForm(form, ctx)).length === 0;
}
