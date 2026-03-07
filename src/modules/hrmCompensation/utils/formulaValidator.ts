/**
 * HRM Compensation Module — Formula Validator
 * Client-side validation for compensation formula expressions.
 * Formulas can reference component codes like BASIC, HRA, etc.
 */

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
