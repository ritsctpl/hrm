import type { AdjustmentType } from '../types/api.types';

/**
 * The month's variable inputs — the columns the source workbook marks
 * "Edit only AH, AI & AK" (shift allowance, extra work pay, arrears) and
 * "Edit only AO, AP & AQ" (TDS, professional tax, LOP). fe-spec §7.
 *
 * Everything else on a payslip is derived from compensation; these six plus LOP days are the only
 * values that genuinely change month to month.
 */
export interface MonthlyInputRow {
  employeeId: string;
  employeeName: string;
  lopDays: number;
  shiftAllowance: number;
  extraWorkPay: number;
  arrears: number;
  incomeTax: number;
  professionalTax: number;
  /** Cells changed by a CSV upload, so the grid can mark what came from the file. */
  touched?: Record<string, number>;
}

/** Each money column maps to an adjustment the backend already accepts. */
export const MONEY_COLUMNS: {
  key: keyof MonthlyInputRow;
  label: string;
  adjustmentType: AdjustmentType;
  description: string;
}[] = [
  { key: 'shiftAllowance', label: 'Shift allowance', adjustmentType: 'OTHER', description: 'Shift Allowance' },
  { key: 'extraWorkPay', label: 'Extra work pay', adjustmentType: 'INCENTIVE', description: 'Extra Work Pay' },
  { key: 'arrears', label: 'Arrears', adjustmentType: 'ARREAR', description: 'Arrears' },
  { key: 'incomeTax', label: 'Income tax (TDS)', adjustmentType: 'DEDUCTION', description: 'Income tax (TDS)' },
  { key: 'professionalTax', label: 'Professional tax', adjustmentType: 'DEDUCTION', description: 'Professional tax' },
];

export const MONTHLY_INPUT_COLUMNS = [
  'employeeCode', 'lopDays', 'shiftAllowance', 'extraWorkPay', 'arrears',
  'incomeTax', 'professionalTax',
];

/** The template carries the run's own employees, so HR fills rows rather than inventing them. */
export function buildMonthlyInputTemplate(rows: MonthlyInputRow[]): string {
  const header = MONTHLY_INPUT_COLUMNS.join(',');
  const body = rows.map((r) => [
    r.employeeId, r.lopDays ?? 0, r.shiftAllowance ?? 0, r.extraWorkPay ?? 0,
    r.arrears ?? 0, r.incomeTax ?? 0, r.professionalTax ?? 0,
  ].join(','));
  return [header, ...body].join('\n') + '\n';
}

export interface ParsedMonthlyInputs {
  updates: Record<string, Partial<MonthlyInputRow>>;
  /** Rows whose employee is not in this run — reported, never silently dropped. */
  ignored: string[];
  error?: string;
}

/**
 * Parses the uploaded CSV in the browser. Deliberately client-side: the values commit through the
 * existing per-employee endpoints, so no new backend contract is needed for this.
 */
export function parseMonthlyInputsCsv(text: string, knownEmployeeIds: string[]): ParsedMonthlyInputs {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { updates: {}, ignored: [], error: 'The file is empty.' };

  const header = lines[0].split(',').map((h) => h.trim());
  const missing = MONTHLY_INPUT_COLUMNS.filter(
    (c) => !header.some((h) => h.toLowerCase() === c.toLowerCase()),
  );
  if (missing.length > 0) {
    return { updates: {}, ignored: [],
      error: `The file is missing these columns: ${missing.join(', ')}. Download the template instead.` };
  }
  const index = (name: string) => header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
  const known = new Set(knownEmployeeIds);
  const updates: Record<string, Partial<MonthlyInputRow>> = {};
  const ignored: string[] = [];

  for (const line of lines.slice(1)) {
    const cells = line.split(',');
    const id = (cells[index('employeeCode')] ?? '').trim();
    if (!id) continue;
    if (!known.has(id)) { ignored.push(id); continue; }
    const num = (name: string) => {
      const raw = (cells[index(name)] ?? '').replace(/[,₹]/g, '').trim();
      const v = Number(raw);
      return Number.isFinite(v) ? v : 0;
    };
    updates[id] = {
      lopDays: num('lopDays'),
      shiftAllowance: num('shiftAllowance'),
      extraWorkPay: num('extraWorkPay'),
      arrears: num('arrears'),
      incomeTax: num('incomeTax'),
      professionalTax: num('professionalTax'),
    };
  }
  return { updates, ignored };
}
