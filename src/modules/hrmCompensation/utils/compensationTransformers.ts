/**
 * HRM Compensation Module — Transformers
 * Map API responses to domain models and UI state
 */

import type { PayComponent, SalaryStructure } from '../types/domain.types';
import type { PayComponentFormState } from '../types/ui.types';

/** Convert a PayComponent entity to form state */
export function payComponentToFormState(component: PayComponent): PayComponentFormState {
  return {
    componentCode: component.componentCode,
    componentName: component.componentName,
    componentType: component.componentType,
    subType: component.subType,
    calculationMethod: component.calculationMethod,
    fixedAmount: component.fixedAmount,
    percentage: component.percentage,
    baseComponentCode: component.baseComponentCode,
    formula: component.formula,
    cap: component.cap,
    minimum: component.minimum,
    taxable: component.taxable,
    statutoryLinkage: component.statutoryLinkage,
    pfWage: component.pfWage,
    esiWage: component.esiWage,
    payFrequency: component.payFrequency,
    displayOrder: component.displayOrder,
    showOnPayslip: component.showOnPayslip,
    mandatory: component.mandatory,
  };
}

/** Default empty form state for new pay component */
export function emptyPayComponentFormState(): PayComponentFormState {
  return {
    componentCode: '',
    componentName: '',
    componentType: 'EARNING',
    subType: 'FIXED',
    calculationMethod: 'FIXED',
    fixedAmount: undefined,
    percentage: undefined,
    baseComponentCode: undefined,
    formula: undefined,
    cap: undefined,
    minimum: undefined,
    taxable: true,
    statutoryLinkage: 'NONE',
    pfWage: false,
    esiWage: false,
    payFrequency: 'MONTHLY',
    displayOrder: 1,
    showOnPayslip: true,
    mandatory: false,
  };
}

/** Get component codes already in a structure */
export function getStructureComponentCodes(structure: SalaryStructure | null): string[] {
  return structure?.components.map((c) => c.componentCode) ?? [];
}

/** Filter out components already in a structure */
export function getAvailableComponents(
  allComponents: PayComponent[],
  structure: SalaryStructure | null,
): PayComponent[] {
  const usedCodes = new Set(getStructureComponentCodes(structure));
  return allComponents.filter((c) => !usedCodes.has(c.componentCode) && c.active === 1);
}
