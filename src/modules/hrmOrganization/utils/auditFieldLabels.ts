/**
 * Audit log field-label map + formatters.
 * Converts raw JSON diff into a human-readable view for the audit log.
 */

// Fields never shown in the diff (system/metadata).
export const AUDIT_HIDDEN_FIELDS = new Set<string>([
  'handle',
  'site',
  'organizationId',
  'createdBy',
  'modifiedBy',
  'createdDateTime',
  'modifiedDateTime',
  'createdAt',
  'modifiedAt',
  'updatedAt',
]);

// Human-readable labels for known fields (flat + dotted for nested).
const LABEL_MAP: Record<string, string> = {
  // Company
  companyCode: 'Company Code',
  companyName: 'Company Name',
  legalName: 'Legal Name',
  dateOfIncorporation: 'Date of Incorporation',
  industryType: 'Industry Type',
  companyLogo: 'Company Logo',

  // Business Unit
  buCode: 'BU Code',
  buName: 'BU Name',
  buType: 'BU Type',
  state: 'State',
  placeOfSupply: 'Place of Supply',
  gstin: 'GSTIN',
  primaryContact: 'Primary Contact',
  companyHandle: 'Company',

  // Department
  deptCode: 'Department Code',
  deptName: 'Department Name',
  parentDeptHandle: 'Parent Department',
  parentDeptName: 'Parent Department',
  managerRoleCode: 'Manager Role',
  headOfDepartmentEmployeeId: 'Head of Department',
  buHandle: 'Business Unit',

  // Location
  locationCode: 'Location Code',
  locationName: 'Location Name',
  locationType: 'Location Type',

  // Common
  active: 'Status',
  contactEmail: 'Contact Email',
  contactPhone: 'Contact Phone',
  city: 'City',

  // Address (flattened)
  'address.line1': 'Address Line 1',
  'address.line2': 'Address Line 2',
  'address.city': 'City',
  'address.state': 'State',
  'address.country': 'Country',
  'address.pincode': 'PIN Code',
  'address.pinCode': 'PIN Code',
  'registeredOfficeAddress.line1': 'Registered Address Line 1',
  'registeredOfficeAddress.city': 'Registered Office City',
  'registeredOfficeAddress.state': 'Registered Office State',
  'registeredOfficeAddress.country': 'Registered Office Country',
  'registeredOfficeAddress.pincode': 'Registered Office PIN',
};

/** Convert `camelCase` or `dotted.key` to a spaced Title Case fallback. */
const humanize = (key: string): string =>
  key
    .split('.')
    .map((seg) =>
      seg
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(' — ');

export const getFieldLabel = (key: string): string =>
  LABEL_MAP[key] ?? humanize(key);

/** Readable value for scalars; nested objects/arrays handled by the caller via flattenObject. */
export const formatValue = (key: string, value: unknown): string => {
  if (value === null || value === undefined || value === '') return '—';

  // Special: `active` flag (0/1 or boolean)
  if (key === 'active') {
    return value === 1 || value === true || value === '1' ? 'Active' : 'Inactive';
  }

  if (typeof value === 'boolean') return value ? 'Yes' : 'No';

  if (Array.isArray(value)) {
    return value.length === 0 ? '—' : `${value.length} item${value.length === 1 ? '' : 's'}`;
  }

  if (typeof value === 'object') {
    // Fallback compact JSON (shouldn't hit this path because flatten handles nested).
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
};

/**
 * Flatten nested object into dotted keys, e.g.
 *  { address: { line1: 'x', city: 'y' } } -> { 'address.line1': 'x', 'address.city': 'y' }
 * Arrays are left as-is (handled by formatValue).
 */
export const flattenObject = (
  input: unknown,
  prefix = '',
  out: Record<string, unknown> = {}
): Record<string, unknown> => {
  if (input === null || input === undefined) return out;
  if (typeof input !== 'object' || Array.isArray(input)) {
    if (prefix) out[prefix] = input;
    return out;
  }
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const nextKey = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      flattenObject(v, nextKey, out);
    } else {
      out[nextKey] = v;
    }
  }
  return out;
};

export interface AuditChangeRow {
  key: string;
  label: string;
  before: string;
  after: string;
}

/** Compare flattened before/after and return only changed, non-hidden fields. */
export const computeChanges = (
  beforeRaw: unknown,
  afterRaw: unknown
): AuditChangeRow[] => {
  const before = flattenObject(beforeRaw);
  const after = flattenObject(afterRaw);
  const keys = Array.from(
    new Set<string>([...Object.keys(before), ...Object.keys(after)])
  );
  const rows: AuditChangeRow[] = [];
  for (const key of keys) {
    const topLevel = key.split('.')[0];
    if (AUDIT_HIDDEN_FIELDS.has(topLevel)) continue;
    const bv = before[key];
    const av = after[key];
    if (JSON.stringify(bv) === JSON.stringify(av)) continue;
    rows.push({
      key,
      label: getFieldLabel(key),
      before: formatValue(key, bv),
      after: formatValue(key, av),
    });
  }
  // Sort by label for consistency
  rows.sort((a, b) => a.label.localeCompare(b.label));
  return rows;
};

/** Render flattened object as Field|Value rows (for CREATE/DELETE). */
export const objectToRows = (raw: unknown): { key: string; label: string; value: string }[] => {
  const flat = flattenObject(raw);
  const rows: { key: string; label: string; value: string }[] = [];
  for (const [key, val] of Object.entries(flat)) {
    const topLevel = key.split('.')[0];
    if (AUDIT_HIDDEN_FIELDS.has(topLevel)) continue;
    if (val === null || val === undefined || val === '') continue;
    rows.push({ key, label: getFieldLabel(key), value: formatValue(key, val) });
  }
  rows.sort((a, b) => a.label.localeCompare(b.label));
  return rows;
};

/** Try to pull a friendly entity name from a value blob (for CREATE/DELETE summaries). */
export const extractEntityName = (raw: unknown): string | null => {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const nameKey = ['companyName', 'buName', 'deptName', 'locationName'].find(
    (k) => typeof obj[k] === 'string' && obj[k]
  );
  const codeKey = ['companyCode', 'buCode', 'deptCode', 'locationCode'].find(
    (k) => typeof obj[k] === 'string' && obj[k]
  );
  if (nameKey && codeKey) return `${obj[nameKey]} (${obj[codeKey]})`;
  if (nameKey) return String(obj[nameKey]);
  if (codeKey) return String(obj[codeKey]);
  return null;
};
