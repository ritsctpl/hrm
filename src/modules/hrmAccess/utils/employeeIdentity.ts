/**
 * Composite employee-identifier helpers.
 *
 * Wire format across every HRM module EXCEPT hrmEmployee:
 *   `"<employeeCode> - <fullName>"` e.g. `"EMP0012 - John Doe"`.
 *
 * These helpers are the single source of truth for splitting and joining
 * the composite so modules don't roll their own string ops (which have a
 * tendency to drift: some use ` - `, some use ` – `, some trim differently).
 *
 * See also: `useEmployeeIdentity().employeeIdWithName` for outbound use.
 */

export const COMPOSITE_SEPARATOR = ' - ';

export interface SplitCompositeId {
  employeeCode: string;
  fullName: string;
}

/**
 * Split a composite employee id into its code + name parts. Tolerant of
 * the plain-code form ("EMP0012") — fullName comes back empty in that
 * case, which is fine for display logic.
 *
 * Splits on the FIRST occurrence of `" - "` so names like
 * "Jane - Consultant" still parse correctly (code is on the left).
 */
export function splitCompositeId(value: string | null | undefined): SplitCompositeId {
  if (!value) return { employeeCode: '', fullName: '' };
  const idx = value.indexOf(COMPOSITE_SEPARATOR);
  if (idx === -1) return { employeeCode: value.trim(), fullName: '' };
  return {
    employeeCode: value.slice(0, idx).trim(),
    fullName: value.slice(idx + COMPOSITE_SEPARATOR.length).trim(),
  };
}

/**
 * Build a composite id from parts. If `fullName` is missing, returns just
 * the code — never produces a dangling `"EMP0012 - "` tail.
 */
export function formatCompositeId(
  employeeCode: string | null | undefined,
  fullName: string | null | undefined,
): string {
  const code = (employeeCode ?? '').trim();
  const name = (fullName ?? '').trim();
  if (!code) return '';
  if (!name) return code;
  return `${code}${COMPOSITE_SEPARATOR}${name}`;
}

/** Quick accessor for just the code portion — common display case. */
export function getEmployeeCodeFromComposite(value: string | null | undefined): string {
  return splitCompositeId(value).employeeCode;
}

/** Quick accessor for just the name portion. */
export function getFullNameFromComposite(value: string | null | undefined): string {
  return splitCompositeId(value).fullName;
}
