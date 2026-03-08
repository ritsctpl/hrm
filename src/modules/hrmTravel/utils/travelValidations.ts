import type { TravelFormState } from "../types/ui.types";

export interface TravelFormErrors {
  travelType?: string;
  purpose?: string;
  destinationCity?: string;
  travelMode?: string;
  travelDate?: string;
  startHour?: string;
  endHour?: string;
  startDate?: string;
  endDate?: string;
}

export function validateTravelForm(form: TravelFormState): TravelFormErrors {
  const errors: TravelFormErrors = {};

  if (!form.travelType) errors.travelType = "Travel type is required.";
  if (!form.purpose.trim()) errors.purpose = "Purpose is required.";
  if (form.purpose.trim().length > 500) errors.purpose = "Purpose must be under 500 characters.";
  if (!form.destinationCity.trim()) errors.destinationCity = "Destination city is required.";
  if (!form.travelMode) errors.travelMode = "Travel mode is required.";

  if (form.travelType === "LOCAL") {
    if (!form.travelDate) errors.travelDate = "Travel date is required.";
    if (!form.startHour) errors.startHour = "Start hour is required.";
    if (!form.endHour) errors.endHour = "End hour is required.";
  } else if (form.travelType === "DOMESTIC" || form.travelType === "INTERNATIONAL") {
    if (!form.startDate) errors.startDate = "Start date is required.";
    if (!form.endDate) errors.endDate = "End date is required.";
  }

  return errors;
}

export function isTravelFormValid(form: TravelFormState): boolean {
  return Object.keys(validateTravelForm(form)).length === 0;
}
