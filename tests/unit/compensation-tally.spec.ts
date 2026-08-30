import { test, expect } from '@playwright/test';
import { validateEarningsTally } from '../../src/modules/hrmCompensation/utils/formulaValidator';
import type {
  PayComponent,
  SalaryStructureComponent,
} from '../../src/modules/hrmCompensation/types/domain.types';

/**
 * Mirrors the hrm-service SalaryStructureTally guard (error COMP_013, tolerance ±0.01).
 * The validator resolves each EARNING line's method + percentage via the pay_component master.
 */

// Minimal master factory — only the fields the tally reads matter.
function master(
  componentCode: string,
  componentType: PayComponent['componentType'],
  calculationMethod: string,
  percentage?: number,
): PayComponent {
  return {
    handle: `SITE:${componentCode}`,
    site: 'SITE',
    componentCode,
    componentName: componentCode,
    componentType,
    subType: 'FIXED',
    // real data carries PERCENT_OF_CTC / BALANCE which are outside the narrow CalcMethod union
    calculationMethod: calculationMethod as PayComponent['calculationMethod'],
    percentage,
    taxable: true,
    statutoryLinkage: 'NONE',
    pfWage: false,
    esiWage: false,
    payFrequency: 'MONTHLY',
    displayOrder: 1,
    showOnPayslip: true,
    mandatory: false,
    active: 1,
    createdDateTime: '',
    modifiedDateTime: '',
    createdBy: '',
    modifiedBy: '',
  };
}

// A dropped line inherits method/pct from the master; only an explicit edit sets an override.
function line(
  componentCode: string,
  overrides: Partial<SalaryStructureComponent> = {},
): SalaryStructureComponent {
  return {
    componentCode,
    calculationMethod: undefined as unknown as SalaryStructureComponent['calculationMethod'],
    displayOrder: 1,
    ...overrides,
  };
}

test('pure PERCENT_OF_CTC earnings summing to 100 → balanced', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 60),
    master('HRA', 'EARNING', 'PERCENT_OF_CTC', 40),
  ];
  const components = [line('BASIC'), line('HRA')];
  const r = validateEarningsTally(components, masters);
  expect(r.balanced).toBe(true);
  expect(r.hasBalance).toBe(false);
  expect(r.totalPct).toBeCloseTo(100, 5);
});

test('pure PERCENT_OF_CTC earnings summing to 90 → short (not balanced)', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 60),
    master('HRA', 'EARNING', 'PERCENT_OF_CTC', 30),
  ];
  const r = validateEarningsTally([line('BASIC'), line('HRA')], masters);
  expect(r.balanced).toBe(false);
  expect(r.totalPct).toBeCloseTo(90, 5);
  expect(r.message.toLowerCase()).toContain('short');
});

test('pure PERCENT_OF_CTC earnings summing to 110 → over (not balanced)', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 60),
    master('HRA', 'EARNING', 'PERCENT_OF_CTC', 50),
  ];
  const r = validateEarningsTally([line('BASIC'), line('HRA')], masters);
  expect(r.balanced).toBe(false);
  expect(r.totalPct).toBeCloseTo(110, 5);
  expect(r.message.toLowerCase()).toContain('over');
});

test('a BALANCE earning makes the structure balanced regardless of the other percentages', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 40),
    master('SPECIAL', 'EARNING', 'BALANCE'),
  ];
  const r = validateEarningsTally([line('BASIC'), line('SPECIAL')], masters);
  expect(r.hasBalance).toBe(true);
  expect(r.balanced).toBe(true);
});

test('tolerance ±0.01: 100.01 is balanced, 100.02 is not', () => {
  const masters = [master('BASIC', 'EARNING', 'PERCENT_OF_CTC')];
  const at = validateEarningsTally(
    [line('BASIC', { defaultPercentage: 100.01 })],
    masters,
  );
  expect(at.balanced).toBe(true);
  const over = validateEarningsTally(
    [line('BASIC', { defaultPercentage: 100.02 })],
    masters,
  );
  expect(over.balanced).toBe(false);
});

test('mixed set: percent-of-base earning + total under 100, no BALANCE → NOT rejected (matches engine)', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 40),
    // percent-of-base (PERCENTAGE) must NOT be summed flatly toward 100
    master('HRA', 'EARNING', 'PERCENTAGE', 50),
    master('CONVEY', 'EARNING', 'FIXED'),
  ];
  const r = validateEarningsTally(
    [line('BASIC'), line('HRA', { calculationMethod: 'PERCENTAGE' }), line('CONVEY')],
    masters,
  );
  expect(r.balanced).toBe(true);
  expect(r.hasBalance).toBe(false);
});

test('mixed set: percent-of-CTC total exceeds 100 → rejected (over-allocation)', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 70),
    master('HRA', 'EARNING', 'PERCENT_OF_CTC', 40),
    master('CONVEY', 'EARNING', 'FIXED'),
  ];
  const r = validateEarningsTally([line('BASIC'), line('HRA'), line('CONVEY')], masters);
  expect(r.balanced).toBe(false);
  expect(r.message.toLowerCase()).toContain('over');
});

test('deductions and employer contributions are excluded from the earnings tally', () => {
  const masters = [
    master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 100),
    master('PF', 'DEDUCTION', 'PERCENT_OF_CTC', 50),
    master('EPF', 'EMPLOYER_CONTRIBUTION', 'PERCENT_OF_CTC', 50),
  ];
  const r = validateEarningsTally(
    [
      line('BASIC'),
      line('PF', { calculationMethod: 'PERCENTAGE' }),
      line('EPF', { calculationMethod: 'PERCENTAGE' }),
    ],
    masters,
  );
  // Only BASIC counts → 100 → balanced; the 50+50 non-earnings are ignored.
  expect(r.totalPct).toBeCloseTo(100, 5);
  expect(r.balanced).toBe(true);
});

test('per-line defaultPercentage overrides the master percentage', () => {
  const masters = [master('BASIC', 'EARNING', 'PERCENT_OF_CTC', 60)];
  const r = validateEarningsTally([line('BASIC', { defaultPercentage: 100 })], masters);
  expect(r.totalPct).toBeCloseTo(100, 5);
  expect(r.balanced).toBe(true);
});

test('per-line calculationMethod overrides the master method', () => {
  // master says PERCENT_OF_CTC 100, but the line overrides to BALANCE → balanced by absorption
  const masters = [master('SPECIAL', 'EARNING', 'PERCENT_OF_CTC', 100)];
  const r = validateEarningsTally(
    [line('SPECIAL', { calculationMethod: 'BALANCE' as SalaryStructureComponent['calculationMethod'] })],
    masters,
  );
  expect(r.hasBalance).toBe(true);
  expect(r.balanced).toBe(true);
});
