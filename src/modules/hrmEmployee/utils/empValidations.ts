export function validateBasicDetails(draft: {
  fullName?: string;
  workEmail?: string;
  phone?: string;
  status?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.fullName?.trim()) errors.fullName = "Full name is required";
  if (!draft.workEmail?.trim()) {
    errors.workEmail = "Work email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.workEmail)) {
    errors.workEmail = "Invalid email format";
  }
  if (!draft.phone?.trim()) errors.phone = "Phone is required";
  if (!draft.status) errors.status = "Status is required";
  return errors;
}

export function validateOfficialDetails(draft: {
  firstName?: string;
  lastName?: string;
  title?: string;
  department?: string;
  role?: string;
  location?: string;
  businessUnits?: string[];
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.firstName?.trim()) errors.firstName = "First name is required";
  if (!draft.lastName?.trim()) errors.lastName = "Last name is required";
  if (!draft.title) errors.title = "Title is required";
  if (!draft.department) errors.department = "Department is required";
  if (!draft.role) errors.role = "Role is required";
  if (!draft.location) errors.location = "Location is required";
  if (!draft.businessUnits?.length) errors.businessUnits = "At least one business unit required";
  return errors;
}

export function validateContactDetails(draft: {
  presentAddress?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  pinZip?: string | null;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.presentAddress?.trim()) errors.presentAddress = "Present address is required";
  if (!draft.city?.trim()) errors.city = "City is required";
  if (!draft.state?.trim()) errors.state = "State is required";
  if (!draft.pinZip?.trim()) errors.pinZip = "PIN/ZIP is required";
  return errors;
}

export function validateOnboardingBasic(draft: {
  fullName: string;
  workEmail: string;
  phone: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.fullName.trim()) errors.fullName = "Full name is required";
  if (!draft.workEmail.trim()) {
    errors.workEmail = "Work email is required";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.workEmail)) {
    errors.workEmail = "Invalid email format";
  }
  if (!draft.phone.trim()) errors.phone = "Phone is required";
  return errors;
}

export function validateOnboardingOfficial(draft: {
  firstName: string;
  lastName: string;
  title: string;
  department: string;
  role: string;
  reportingManager: string;
  location: string;
  businessUnits: string[];
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!draft.firstName.trim()) errors.firstName = "First name is required";
  if (!draft.lastName.trim()) errors.lastName = "Last name is required";
  if (!draft.title) errors.title = "Title is required";
  if (!draft.department) errors.department = "Department is required";
  if (!draft.role) errors.role = "Role is required";
  if (!draft.location) errors.location = "Location is required";
  if (!draft.businessUnits.length) errors.businessUnits = "At least one business unit required";
  return errors;
}
