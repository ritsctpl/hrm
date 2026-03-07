const SENSITIVE_ROLES = ["HR_ADMIN", "HR_MANAGER", "SUPER_ADMIN"];

export function canViewSensitiveFields(userRole: string, targetHandle: string, selfHandle: string): boolean {
  if (targetHandle === selfHandle) return true;
  return SENSITIVE_ROLES.includes(userRole.toUpperCase());
}

export function canEditEmployee(userRole: string, targetHandle: string, selfHandle: string): boolean {
  if (targetHandle === selfHandle) return true;
  return SENSITIVE_ROLES.includes(userRole.toUpperCase());
}

export function canViewRemuneration(userRole: string): boolean {
  return SENSITIVE_ROLES.includes(userRole.toUpperCase());
}

export function maskGovtId(idNumber: string, idType: string): string {
  if (idType === "AADHAR") {
    return "**** **** " + idNumber.slice(-4);
  }
  if (idType === "PASSPORT") {
    return idNumber.slice(0, 2) + "***" + idNumber.slice(-3);
  }
  return idNumber;
}
