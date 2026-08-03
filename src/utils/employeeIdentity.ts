/**
 * Employee identity arrives in two shapes and they are not interchangeable.
 *
 * The API stores an employee code ("R10138") but most read endpoints run it
 * through `EmployeeIdentityResolver`, which returns the composite
 * `"R10138 - Ravi Kumar"` — code, separator, live full name. So a response can
 * hand you `projectManagerId: "R10138 - Ravi Kumar"` while the signed-in user's
 * identity is the bare `"R10138"`.
 *
 * Comparing those two directly is always false, and feeding the composite to a
 * picker whose options are keyed by code matches nothing. Both failures are
 * silent: an owner-only action simply never appears, and a populated field
 * renders blank. Parse to the code before comparing or binding.
 *
 * Mirrors the backend's `EmployeeIdentityUtils` — same separator, same split.
 */
const SEPARATOR = ' - ';

/** The bare employee code, whichever shape came back. */
export const employeeCodeOf = (value?: string | null): string => {
  if (!value) return '';
  const index = value.indexOf(SEPARATOR);
  return (index >= 0 ? value.slice(0, index) : value).trim();
};

/** The name half of a composite, or "" when the value is just a code. */
export const employeeNameOf = (value?: string | null): string => {
  if (!value) return '';
  const index = value.indexOf(SEPARATOR);
  return index >= 0 ? value.slice(index + SEPARATOR.length).trim() : '';
};

/**
 * Whether two identities are the same person, in any combination of shapes.
 * Blank never matches blank — an absent identity is not "everyone".
 */
export const isSameEmployee = (a?: string | null, b?: string | null): boolean => {
  const codeA = employeeCodeOf(a);
  const codeB = employeeCodeOf(b);
  return !!codeA && !!codeB && codeA.toLowerCase() === codeB.toLowerCase();
};

/**
 * Best available label for an identity: an explicit name, else the name inside
 * a composite, else the code. Never returns a blank when anything is known —
 * a field that renders empty reads as missing data.
 */
export const employeeLabelOf = (
  id?: string | null,
  name?: string | null
): string => (name?.trim() || employeeNameOf(id) || employeeCodeOf(id) || '');
