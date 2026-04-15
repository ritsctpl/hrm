export function resolveEmployeeId(cookies: Record<string, string | undefined>): string {
  return cookies.employeeId ?? cookies.employeeCode ?? cookies.userId ?? '';
}
