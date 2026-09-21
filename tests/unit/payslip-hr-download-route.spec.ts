import { test, expect } from '@playwright/test';
import { hrDownloadRoute } from '../../src/modules/hrmPayslip/utils/payslipFormat';

/**
 * hrDownloadRoute (final review, finding 2).
 *
 * HR screens (Repository and the Generate panel's distribution list) list OTHER employees'
 * payslips, of both sources. The self-service /downloadMyPayslip refuses another employee (403)
 * and has no snapshot for an uploaded row (PAYSLIP_020), so every HR download must go by handle:
 * an uploaded row fetches its stored PDF, a generated row renders from the HR snapshot.
 */

const row = (source: 'UPLOADED' | 'GENERATED', fileName: string | null = null) => ({
  handle: 'PS_1',
  employeeId: 'R10101',
  payrollYear: 2026,
  payrollMonth: 8,
  source,
  fileName,
});

test('an uploaded row downloads its stored PDF by handle, under its uploaded file name', () => {
  expect(hrDownloadRoute(row('UPLOADED', 'R10101_Aug-2026.pdf'))).toEqual({
    kind: 'uploaded',
    handle: 'PS_1',
    fileName: 'R10101_Aug-2026.pdf',
  });
});

test('an uploaded row with no stored file name still gets a sensible one', () => {
  const route = hrDownloadRoute(row('UPLOADED'));
  expect(route.kind).toBe('uploaded');
  expect(route.kind === 'uploaded' && route.fileName).toMatch(/R10101.*\.pdf$/);
});

test('a generated row renders from the HR snapshot by handle', () => {
  expect(hrDownloadRoute(row('GENERATED'))).toEqual({ kind: 'generated', handle: 'PS_1' });
});

test('a row with no source (older API) is treated as generated', () => {
  expect(hrDownloadRoute({ ...row('GENERATED'), source: undefined as unknown as 'GENERATED' }).kind)
    .toBe('generated');
});
