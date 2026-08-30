import { test, expect } from '@playwright/test';
import {
  describeCalculation,
  isStatutory,
  countStructureUsage,
} from '../../src/modules/hrmCompensation/utils/componentCalcLabel';

const base = {
  componentCode: 'X',
  componentName: 'X',
  componentType: 'EARNING',
  subType: 'FIXED',
  statutoryLinkage: 'NONE',
} as any;

test('FIXED shows rupee amount', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'FIXED', fixedAmount: 5000 })).toContain('5,000');
});
test('PERCENTAGE of base component', () => {
  expect(
    describeCalculation({ ...base, calculationMethod: 'PERCENTAGE', percentage: 40, baseComponentCode: 'BASIC' }),
  ).toBe('40% of BASIC');
});
test('PERCENT_OF_CTC', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'PERCENT_OF_CTC', percentage: 40 })).toBe('40% of CTC');
});
test('BALANCE', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'BALANCE' })).toBe('Balance');
});
test('FORMULA falls back to the formula text', () => {
  expect(describeCalculation({ ...base, calculationMethod: 'FORMULA', formula: 'BASIC*0.1' })).toBe('BASIC*0.1');
});
test('isStatutory true when subType STATUTORY or linkage set', () => {
  expect(isStatutory({ ...base, subType: 'STATUTORY' })).toBe(true);
  expect(isStatutory({ ...base, statutoryLinkage: 'PF' })).toBe(true);
  expect(isStatutory(base)).toBe(false);
});
test('countStructureUsage counts structures containing the code', () => {
  const structs = [
    { components: [{ componentCode: 'BASIC' }] },
    { components: [{ componentCode: 'HRA' }] },
  ] as any;
  expect(countStructureUsage('BASIC', structs)).toBe(1);
  expect(countStructureUsage('ZZZ', structs)).toBe(0);
});
