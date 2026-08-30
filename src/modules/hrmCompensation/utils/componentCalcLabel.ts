import type { PayComponent, SalaryStructure } from '../types/domain.types';

const inr = (n: number) =>
  new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);

/** Human-readable calculation summary for a pay component, resolved from the MASTER. */
export function describeCalculation(c: PayComponent): string {
  switch (c.calculationMethod) {
    case 'FIXED':
      return c.fixedAmount != null ? `₹${inr(c.fixedAmount)}` : 'Fixed';
    case 'PERCENTAGE':
      return c.percentage != null
        ? `${c.percentage}% of ${c.baseComponentCode ?? 'base'}`
        : 'Percentage';
    case 'PERCENT_OF_CTC':
      return c.percentage != null ? `${c.percentage}% of CTC` : '% of CTC';
    case 'BALANCE':
      return 'Balance';
    case 'FORMULA':
      return c.formula && c.formula.trim() ? c.formula : 'Formula';
    default:
      return String(c.calculationMethod ?? '—');
  }
}

/** Statutory when its sub-type says so, or it carries a PF/ESI/PT linkage. */
export function isStatutory(c: PayComponent): boolean {
  return c.subType === 'STATUTORY' || (c.statutoryLinkage != null && c.statutoryLinkage !== 'NONE');
}

/** How many salary structures include this component code. */
export function countStructureUsage(code: string, structures: SalaryStructure[]): number {
  return structures.filter((s) => (s.components ?? []).some((l) => l.componentCode === code)).length;
}
