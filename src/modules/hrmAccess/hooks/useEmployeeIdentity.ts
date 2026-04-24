"use client";

import { parseCookies } from "nookies";
import { useCurrentEmployeeStore } from "../stores/currentEmployeeStore";

/**
 * Canonical identity of the signed-in employee.
 *
 * Use this hook EVERYWHERE a module needs the current user's employee
 * identifier for backend calls. Avoid inlining cookie-fallback chains in
 * individual modules — those have caused incidents where:
 *   - email leaks into `submittedBy` / `actorEmpId` fields causing
 *     "Employee not found" errors on endpoints that resolve the employee
 *   - the UUID `handle` is sent to endpoints that filter by the
 *     human-readable `employeeCode`, returning empty lists with no error
 *
 * Contract by field:
 *   - `employeeCode` — HR business identifier (e.g., "EMP0012"). Use for
 *     ALL backend payload fields named `employeeId`, `empId`, `submittedBy`,
 *     `actorEmpId`, `createdBy`, `modifiedBy`, `deletedBy`, `recalledBy`,
 *     `markedBy`. This matches how records are indexed server-side.
 *   - `handle` — internal UUID. Use only for cross-module foreign keys
 *     like `linkedAdvanceHandle`, `travelRequestHandle`, etc., or when
 *     a specific backend explicitly documents it.
 *   - `workEmail` — login email. Use for display / mailto only, never
 *     as a backend identifier.
 *   - `fullName` — for audit trails that store actor name alongside id.
 *   - `isReady` — `true` once currentEmployeeStore has resolved the
 *     employee record. Until then, `employeeCode` may fall back to a
 *     cookie value (possibly email). Callers making identity-sensitive
 *     queries should early-return while `!isReady`.
 *
 * Resolution order for `employeeCode`:
 *   1. currentEmployeeStore.data.employeeCode (authoritative — resolved
 *      from directory search by login email).
 *   2. cookies.employeeCode
 *   3. cookies.employeeId
 *   4. cookies.userId / cookies.user / cookies.rl_user_id (last resort;
 *      typically the email — gate your calls on `isReady` to avoid this).
 */
export interface EmployeeIdentity {
  employeeCode: string;
  handle: string;
  fullName: string;
  workEmail: string;
  /**
   * Composite identifier: `"<employeeCode> - <fullName>"` (e.g.
   * `"EMP0012 - John Doe"`). This is the value every non-employee HRM
   * module should send in employee-identifier fields (employeeId, empId,
   * createdBy, modifiedBy, submittedBy, actorEmpId, etc.) once the
   * backend composite-id change is live.
   *
   * If fullName hasn't resolved yet, this falls back to just the
   * employeeCode — consumers should still gate identity-sensitive calls
   * on `isReady` to avoid sending the code with no name. See
   * `splitCompositeId` / `formatCompositeId` in
   * `../utils/employeeIdentity.ts` for parsing + formatting helpers.
   */
  employeeIdWithName: string;
  isReady: boolean;
}

export function useEmployeeIdentity(): EmployeeIdentity {
  const data = useCurrentEmployeeStore((s) => s.data);
  const cookies = parseCookies();

  const cookieFallback =
    cookies.employeeCode ??
    cookies.employeeId ??
    cookies.userId ??
    cookies.user ??
    cookies.rl_user_id ??
    "";

  const employeeCode = data?.employeeCode ?? cookieFallback;
  const fullName = data?.fullName ?? cookies.userName ?? "";
  const employeeIdWithName =
    employeeCode && fullName ? `${employeeCode} - ${fullName}` : employeeCode;

  return {
    employeeCode,
    handle: data?.handle ?? "",
    fullName,
    workEmail: data?.workEmail ?? cookies.userId ?? "",
    employeeIdWithName,
    isReady: !!data?.employeeCode,
  };
}
