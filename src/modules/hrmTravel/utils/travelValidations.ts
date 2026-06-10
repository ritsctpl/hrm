import dayjs from "dayjs";
import type { TravelFormState } from "../types/ui.types";
import type { CoTravellerDto, BlackoutPeriod, TravelPolicy } from "../types/domain.types";

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
  projectCode?: string;
  coTravellers?: string;
  policy?: string;
}

export interface TravelValidationContext {
  coTravellers?: CoTravellerDto[];
  /** When true, allows back-dated travel (use for view/legacy scenarios). Default false. */
  allowBackdated?: boolean;
  /** Blackout periods to check against travel dates */
  blackoutPeriods?: BlackoutPeriod[];
  /** Policy to validate against */
  policy?: TravelPolicy;
}

const HOUR_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Validate travel request against fresh policy constraints (called on Save/Submit)
 */
export function validateAgainstFreshPolicy(form: TravelFormState, policy?: TravelPolicy): string | undefined {
  if (!policy) return undefined;

  // Check if travel type matches policy
  if (form.travelType !== policy.travelType) {
    return `Travel type ${form.travelType} does not match policy for ${policy.travelType}.`;
  }

  // Check if travel mode is allowed
  if (!policy.allowedModes.includes(form.travelMode)) {
    return `Travel mode ${form.travelMode} is not allowed. Allowed modes: ${policy.allowedModes.join(", ")}.`;
  }

  // Check visa requirements for international travel
  if (form.travelType === "INTERNATIONAL" && policy.visaRequiredDaysBefore) {
    if (form.startDate) {
      const startDate = dayjs(form.startDate, "DD/MM/YYYY");
      const today = dayjs();
      const daysUntilTravel = startDate.diff(today, "day");
      if (daysUntilTravel < policy.visaRequiredDaysBefore) {
        return `Visa required ${policy.visaRequiredDaysBefore} days before travel. Current booking is only ${daysUntilTravel} days away.`;
      }
    }
  }

  // Check blackout periods
  if (policy.blackoutPeriods && policy.blackoutPeriods.length > 0) {
    if (form.travelType === "LOCAL" && form.travelDate) {
      const blackoutPeriod = isDateInBlackoutPeriod(form.travelDate, policy.blackoutPeriods);
      if (blackoutPeriod) {
        return `Travel is restricted from ${blackoutPeriod.startDate} to ${blackoutPeriod.endDate}. Reason: ${blackoutPeriod.reason}`;
      }
    } else if ((form.travelType === "DOMESTIC" || form.travelType === "INTERNATIONAL") && form.startDate && form.endDate) {
      const blackoutPeriod = isDateRangeInBlackoutPeriod(form.startDate, form.endDate, policy.blackoutPeriods);
      if (blackoutPeriod) {
        return `Travel is restricted from ${blackoutPeriod.startDate} to ${blackoutPeriod.endDate}. Reason: ${blackoutPeriod.reason}`;
      }
    }
  }

  // Check insurance requirement for international travel
  if (policy.insuranceMandatory && form.travelType === "INTERNATIONAL") {
    // This would require checking if insurance is selected in the form
    // For now, we'll just note that this should be validated
  }

  // Check mandatory documents
  if (policy.mandatoryDocuments && policy.mandatoryDocuments.length > 0) {
    // This would require checking if required documents are attached
    // For now, we'll just note that this should be validated
  }

  return undefined;
}

/**
 * Check if a single date falls within any blackout period.
 * Date format: DD/MM/YYYY
 */
function isDateInBlackoutPeriod(dateStr: string, blackoutPeriods?: BlackoutPeriod[]): BlackoutPeriod | undefined {
  if (!dateStr || !blackoutPeriods || blackoutPeriods.length === 0) return undefined;
  
  const date = dayjs(dateStr, "DD/MM/YYYY");
  if (!date.isValid()) return undefined;

  return blackoutPeriods.find((period) => {
    const start = dayjs(period.startDate, "YYYY-MM-DD");
    const end = dayjs(period.endDate, "YYYY-MM-DD");
    // Check if date is within the blackout period (inclusive of start and end dates)
    const isAfterOrEqualStart = date.isAfter(start, "day") || date.isSame(start, "day");
    const isBeforeOrEqualEnd = date.isBefore(end, "day") || date.isSame(end, "day");
    return isAfterOrEqualStart && isBeforeOrEqualEnd;
  });
}

/**
 * Check if a date range overlaps with any blackout period.
 * Date format: DD/MM/YYYY
 */
function isDateRangeInBlackoutPeriod(
  startDateStr: string,
  endDateStr: string,
  blackoutPeriods?: BlackoutPeriod[],
): BlackoutPeriod | undefined {
  if (!startDateStr || !endDateStr || !blackoutPeriods || blackoutPeriods.length === 0) return undefined;

  const startDate = dayjs(startDateStr, "DD/MM/YYYY");
  const endDate = dayjs(endDateStr, "DD/MM/YYYY");
  if (!startDate.isValid() || !endDate.isValid()) return undefined;

  return blackoutPeriods.find((period) => {
    const blackoutStart = dayjs(period.startDate, "YYYY-MM-DD");
    const blackoutEnd = dayjs(period.endDate, "YYYY-MM-DD");
    // Check if ranges overlap: start <= blackoutEnd AND end >= blackoutStart
    const startBeforeOrEqualBlackoutEnd = startDate.isBefore(blackoutEnd, "day") || startDate.isSame(blackoutEnd, "day");
    const endAfterOrEqualBlackoutStart = endDate.isAfter(blackoutStart, "day") || endDate.isSame(blackoutStart, "day");
    return startBeforeOrEqualBlackoutEnd && endAfterOrEqualBlackoutStart;
  });
}

export function validateTravelForm(
  form: TravelFormState,
  ctx: TravelValidationContext = {},
): TravelFormErrors {
  const errors: TravelFormErrors = {};
  const currentMonthStart = dayjs().startOf("month");

  if (!form.travelType) errors.travelType = "Travel type is required.";
  if (!form.purpose.trim()) errors.purpose = "Purpose is required.";
  if (form.purpose.trim().length > 500) errors.purpose = "Purpose must be under 500 characters.";
  if (!form.destinationCity.trim()) errors.destinationCity = "Destination city is required.";
  if (!form.travelMode) errors.travelMode = "Travel mode is required.";

  if (form.travelType === "LOCAL") {
    if (!form.travelDate) errors.travelDate = "Travel date is required.";
    if (!form.startHour) errors.startHour = "Start hour is required.";
    if (!form.endHour) errors.endHour = "End hour is required.";

    // BV4: travel date cannot be in past months (current month and future allowed)
    if (!ctx.allowBackdated && form.travelDate) {
      const travelDate = dayjs(form.travelDate, "DD/MM/YYYY");
      // Check if date is before current month start (i.e., in a past month)
      if (travelDate.isBefore(currentMonthStart, "day")) {
        errors.travelDate = "Travel date cannot be in past months.";
      }
    }

    // Check blackout periods for LOCAL travel
    if (form.travelDate && !errors.travelDate) {
      const blackoutPeriod = isDateInBlackoutPeriod(form.travelDate, ctx.blackoutPeriods);
      if (blackoutPeriod) {
        errors.travelDate = `Travel is restricted from ${blackoutPeriod.startDate} to ${blackoutPeriod.endDate}. Reason: ${blackoutPeriod.reason}`;
      }
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

    // BV4: start date cannot be in past months (current month and future allowed)
    if (!ctx.allowBackdated && form.startDate) {
      const startDate = dayjs(form.startDate, "DD/MM/YYYY");
      // Check if date is before current month start (i.e., in a past month)
      if (startDate.isBefore(currentMonthStart, "day")) {
        errors.startDate = "Start date cannot be in past months.";
      }
    }

    // BV2: endDate >= startDate
    if (form.startDate && form.endDate && dayjs(form.endDate, "DD/MM/YYYY").isBefore(dayjs(form.startDate, "DD/MM/YYYY"), "day")) {
      errors.endDate = "End date must be on or after start date.";
    }

    // Check blackout periods for DOMESTIC/INTERNATIONAL travel
    if (form.startDate && form.endDate && !errors.startDate && !errors.endDate) {
      const blackoutPeriod = isDateRangeInBlackoutPeriod(form.startDate, form.endDate, ctx.blackoutPeriods);
      if (blackoutPeriod) {
        errors.startDate = `Travel is restricted from ${blackoutPeriod.startDate} to ${blackoutPeriod.endDate}. Reason: ${blackoutPeriod.reason}`;
      }
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
