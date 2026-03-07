import type { TaxSlab, ProfessionalTaxSlab } from '../types/domain.types';

export interface SlabValidationError {
  index: number;
  field: string;
  message: string;
}

export function validateTaxSlabs(slabs: TaxSlab[]): SlabValidationError[] {
  const errors: SlabValidationError[] = [];

  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];

    if (slab.fromAmount < 0) {
      errors.push({ index: i, field: 'fromAmount', message: 'From amount cannot be negative.' });
    }

    if (slab.toAmount !== null && slab.toAmount <= slab.fromAmount) {
      errors.push({ index: i, field: 'toAmount', message: 'To amount must be greater than from amount.' });
    }

    if (slab.taxRate < 0 || slab.taxRate > 100) {
      errors.push({ index: i, field: 'taxRate', message: 'Tax rate must be between 0 and 100.' });
    }

    // Check for overlap with previous slab
    if (i > 0) {
      const prev = slabs[i - 1];
      if (prev.toAmount !== null && slab.fromAmount <= prev.toAmount) {
        errors.push({
          index: i,
          field: 'fromAmount',
          message: 'Slab ranges must not overlap.',
        });
      }
    }
  }

  return errors;
}

export function validatePtSlabs(slabs: ProfessionalTaxSlab[]): SlabValidationError[] {
  const errors: SlabValidationError[] = [];

  for (let i = 0; i < slabs.length; i++) {
    const slab = slabs[i];

    if (slab.fromSalary < 0) {
      errors.push({ index: i, field: 'fromSalary', message: 'From salary cannot be negative.' });
    }

    if (slab.toSalary !== null && slab.toSalary <= slab.fromSalary) {
      errors.push({ index: i, field: 'toSalary', message: 'To salary must exceed from salary.' });
    }

    if (slab.monthlyPT < 0) {
      errors.push({ index: i, field: 'monthlyPT', message: 'Monthly PT cannot be negative.' });
    }

    if (i > 0) {
      const prev = slabs[i - 1];
      if (prev.toSalary !== null && slab.fromSalary <= prev.toSalary) {
        errors.push({ index: i, field: 'fromSalary', message: 'PT slab ranges must not overlap.' });
      }
    }
  }

  return errors;
}
