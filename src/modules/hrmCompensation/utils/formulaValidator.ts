/**
 * HRM Compensation Module — Formula Validator
 * Client-side validation for compensation formula expressions.
 * Formulas can reference component codes like BASIC, HRA, etc.
 */

import type { PayComponent, SalaryStructureComponent } from '../types/domain.types';

const KNOWN_CODES_PLACEHOLDER = /\b[A-Z][A-Z0-9_]*\b/g;
const ALLOWED_OPS = /^[\s\d+\-*/().A-Z_]+$/;

export interface FormulaValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a formula expression string.
 * Replaces known component references with 1 and evaluates safely.
 */
export function validateFormula(formula: string): FormulaValidationResult {
  if (!formula || !formula.trim()) {
    return { valid: false, error: 'Formula cannot be empty' };
  }

  const trimmed = formula.trim();

  if (!ALLOWED_OPS.test(trimmed)) {
    return {
      valid: false,
      error: 'Formula contains invalid characters. Use only numbers, operators (+−×÷), parentheses, and component codes.',
    };
  }

  // Replace component code references with 1 for eval test
  const testExpr = trimmed.replace(KNOWN_CODES_PLACEHOLDER, '1');

  try {
    // Use Function constructor for safer eval (no global scope access)
    const result = new Function(`"use strict"; return (${testExpr})`)();
    if (typeof result !== 'number' || !isFinite(result)) {
      return { valid: false, error: 'Formula does not produce a valid numeric result' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Formula syntax error — check parentheses and operators' };
  }
}

// ---------------------------------------------------------------------------
// Earnings 100%-of-CTC tally
// ---------------------------------------------------------------------------

/** Matches the server guard (hrm-service SalaryStructureTally, COMP_013). */
export const TALLY_TOLERANCE = 0.01;

export interface EarningsTallyResult {
  /** Sum of resolved percentages of the PERCENT_OF_CTC earnings (0 when a BALANCE absorbs). */
  totalPct: number;
  /** True when the structure allocates a valid 100% of CTC (or a BALANCE absorbs the remainder). */
  balanced: boolean;
  /** True when at least one earning resolves to BALANCE (absorbs the remainder). */
  hasBalance: boolean;
  /** Human-readable status, mirroring the server message when invalid. */
  message: string;
}

const round2 = (n: number): number => Math.round(n * 100) / 100;

/**
 * Live mirror of the backend SalaryStructureTally guard (error COMP_013, tolerance ±0.01).
 *
 * For each structure line it resolves the EARNING component's calculation method + percentage
 * via the pay_component master (a line carries `componentCode`; `calculationMethod` /
 * `defaultPercentage` are OPTIONAL per-line overrides — when omitted the master's values are used).
 * Only EARNING components (by the master's `componentType`) participate; deductions, statutory and
 * employer-contribution lines are excluded.
 *
 * Rule (matches the engine, which only hard-rejects over-allocation):
 *  - any earning resolves to BALANCE                     → complete (BALANCE absorbs remainder) → balanced
 *  - no BALANCE, only PERCENT_OF_CTC earnings            → their percentages must total 100 ±0.01
 *  - no BALANCE, a mix with FIXED/FORMULA/percent-of-base→ reject only when PERCENT_OF_CTC total exceeds 100
 *
 * Pure — no side effects, no store access. Pass the masters in from the store.
 */
export function validateEarningsTally(
  components: SalaryStructureComponent[],
  masters: PayComponent[],
): EarningsTallyResult {
  const masterByCode = new Map(masters.map((m) => [m.componentCode, m]));

  let hasBalance = false;
  let percentOfCtcTotal = 0;
  let hasPercentOfCtc = false;
  let hasOtherEarning = false; // FIXED / FORMULA / PERCENTAGE (percent-of-base)

  for (const line of components ?? []) {
    const master = masterByCode.get(line.componentCode);
    // Cannot classify an unknown component — the server resolves it against the master too, so skip.
    if (!master || master.componentType !== 'EARNING') continue;

    const method = String(line.calculationMethod ?? master.calculationMethod ?? '');

    if (method === 'BALANCE') {
      hasBalance = true;
      continue;
    }
    if (method === 'PERCENT_OF_CTC') {
      hasPercentOfCtc = true;
      const pct = line.defaultPercentage ?? master.percentage ?? 0;
      percentOfCtcTotal += pct;
    } else {
      // FIXED, FORMULA, PERCENTAGE (percent-of-base) — not summed flatly toward 100.
      hasOtherEarning = true;
    }
  }

  const totalPct = round2(percentOfCtcTotal);

  // BALANCE earning present → the remainder is absorbed → complete.
  if (hasBalance) {
    return {
      totalPct,
      hasBalance: true,
      balanced: true,
      message: 'Balanced · BALANCE absorbs the remainder',
    };
  }

  // Mixed structure (some non-percent-of-CTC earning present, no BALANCE):
  // the engine only hard-rejects over-allocation of CTC.
  if (hasOtherEarning) {
    if (totalPct > 100 + TALLY_TOLERANCE) {
      return {
        totalPct,
        hasBalance: false,
        balanced: false,
        message: `Percent-of-CTC earnings total ${totalPct}% · over by ${round2(totalPct - 100)}%`,
      };
    }
    return {
      totalPct,
      hasBalance: false,
      balanced: true,
      message: `Percent-of-CTC earnings total ${totalPct}% · within CTC`,
    };
  }

  // Pure PERCENT_OF_CTC structure (no BALANCE, no other earning) → must total exactly 100 ±0.01.
  if (hasPercentOfCtc) {
    const diff = round2(totalPct - 100);
    if (Math.abs(diff) <= TALLY_TOLERANCE) {
      return {
        totalPct,
        hasBalance: false,
        balanced: true,
        message: `Earnings allocate ${totalPct}% of CTC · balanced`,
      };
    }
    if (diff < 0) {
      return {
        totalPct,
        hasBalance: false,
        balanced: false,
        message: `Earnings allocate ${totalPct}% of CTC · short by ${round2(-diff)}%`,
      };
    }
    return {
      totalPct,
      hasBalance: false,
      balanced: false,
      message: `Earnings allocate ${totalPct}% of CTC · over by ${diff}%`,
    };
  }

  // No earnings at all → nothing allocates CTC.
  return {
    totalPct: 0,
    hasBalance: false,
    balanced: false,
    message: 'No earnings allocate CTC · short by 100%',
  };
}
