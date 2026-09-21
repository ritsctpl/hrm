import { test, expect } from '@playwright/test';
import { myPayslipYearOptions } from '../../src/modules/hrmPayslip/utils/payslipFormat';

/**
 * Year options for the employee's "My Payslips" Year select (task 12 / preflight ruling R5e).
 *
 * The selected year must always be present, even when the employee's payslip list has not loaded
 * yet or a deep link points at a year with no rows -- otherwise the Select would show a value with
 * no matching option and render blank.
 */

const row = (payrollYear: number) => ({ payrollYear });

test('includes the selected year even when the list is empty', () => {
  expect(myPayslipYearOptions(2026, [])).toEqual([2026]);
});

test('includes the selected year even when it has no matching row (deep link)', () => {
  expect(myPayslipYearOptions(2024, [row(2026), row(2025)])).toEqual([2026, 2025, 2024]);
});

test('de-duplicates years shared by multiple rows and the selection', () => {
  expect(myPayslipYearOptions(2026, [row(2026), row(2026), row(2025)])).toEqual([2026, 2025]);
});

test('sorts newest year first', () => {
  expect(myPayslipYearOptions(2023, [row(2021), row(2025), row(2023)])).toEqual([2025, 2023, 2021]);
});
