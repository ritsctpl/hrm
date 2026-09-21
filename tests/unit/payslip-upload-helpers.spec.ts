import { test, expect } from '@playwright/test';
import {
  chunkFiles,
  summarise,
  errorRowsToCsv,
  isStoredStatus,
  splitAtFailedChunk,
  exceedsBatchLimit,
  MAX_FILES_PER_BATCH,
  withRowKeys,
} from '../../src/modules/hrmPayslip/utils/uploadHelpers';
import type {
  PayslipUploadBatch,
  PayslipParseStatus,
} from '../../src/modules/hrmPayslip/types/domain.types';

/**
 * The pure logic behind the upload screen.
 *
 * Chunking is not cosmetic: max-request-size is 50MB, and a 200-file month posted in one request
 * would sit right on that ceiling. The summary and the CSV are what HR actually acts on -- if a
 * skipped file is missing from either, nobody ever learns it needs correcting.
 */

const file = (name: string) => new File(['%PDF'], name, { type: 'application/pdf' });

const bigFile = (name: string, mb: number) =>
  new File([new Uint8Array(mb * 1024 * 1024)], name, { type: 'application/pdf' });

const item = (fileName: string, parseStatus: PayslipParseStatus, reason: string | null = null) => ({
  fileName,
  parseStatus,
  reason,
  employeeCode: null,
  employeeName: null,
  workEmail: null,
  payrollYear: null,
  payrollMonth: null,
  payslipHandle: null,
  emailStatus: null,
});

const batch = (items: ReturnType<typeof item>[]): PayslipUploadBatch => ({
  handle: 'PUB_1',
  site: 'RITS',
  uploadedBy: 'HRADMIN',
  uploadedAt: '2026-08-31T10:00:00',
  totalFiles: items.length,
  matchedCount: 0,
  skippedCount: 0,
  emailedCount: 0,
  failedEmailCount: 0,
  status: 'PARSED',
  items,
});

test('chunkFiles splits a full month into 25-file requests', () => {
  const files = Array.from({ length: 200 }, (_, i) => file(`R${i}_Aug-2026.pdf`));
  const chunks = chunkFiles(files);
  expect(chunks).toHaveLength(8);
  expect(chunks[0]).toHaveLength(25);
  expect(chunks.flat()).toHaveLength(200);
});

test('chunkFiles keeps a partial final chunk rather than dropping it', () => {
  const chunks = chunkFiles(Array.from({ length: 26 }, (_, i) => file(`R${i}_Aug-2026.pdf`)));
  expect(chunks).toHaveLength(2);
  expect(chunks[1]).toHaveLength(1);
});

test('chunkFiles returns nothing for an empty selection', () => {
  expect(chunkFiles([])).toEqual([]);
});

test('chunkFiles splits by bytes before count', () => {
  // Three 20MB files: well under the 25-file cap, but the third would push the running total
  // from 40MB to 60MB, past the 45MB request-size ceiling, so it must start a new chunk.
  const files = [bigFile('a.pdf', 20), bigFile('b.pdf', 20), bigFile('c.pdf', 20)];
  const chunks = chunkFiles(files);
  expect(chunks).toHaveLength(2);
  expect(chunks[0]).toHaveLength(2);
  expect(chunks[1]).toHaveLength(1);
});

test('summarise separates stored from mailable', () => {
  const s = summarise(batch([
    item('a.pdf', 'OK'),
    item('b.pdf', 'REPLACED_EXISTING'),
    item('c.pdf', 'EMPLOYEE_NO_EMAIL'),
    item('d.pdf', 'BAD_FILENAME'),
    item('e.pdf', 'EMPLOYEE_NOT_FOUND'),
  ]));

  expect(s.total).toBe(5);
  expect(s.stored).toBe(3);
  expect(s.skipped).toBe(2);
  // The no-email payslip is stored and downloadable, but there is nobody to send it to.
  expect(s.mailable).toBe(2);
  expect(s.byStatus.BAD_FILENAME).toBe(1);
});

test('summarise never loses a file between stored and skipped', () => {
  const s = summarise(batch([item('a.pdf', 'OK'), item('b.pdf', 'NOT_A_PDF')]));
  expect(s.stored + s.skipped).toBe(s.total);
});

test('isStoredStatus agrees with the backend enum', () => {
  expect(isStoredStatus('OK')).toBe(true);
  expect(isStoredStatus('REPLACED_EXISTING')).toBe(true);
  expect(isStoredStatus('EMPLOYEE_NO_EMAIL')).toBe(true);
  expect(isStoredStatus('BAD_FILENAME')).toBe(false);
  expect(isStoredStatus('EMPLOYEE_NOT_FOUND')).toBe(false);
  expect(isStoredStatus('NOT_A_PDF')).toBe(false);
  // Infra failure, not user error: nothing was stored, so it is a "needs attention" row.
  expect(isStoredStatus('STORAGE_FAILED')).toBe(false);
});

test('errorRowsToCsv exports only the files HR must fix', () => {
  const csv = errorRowsToCsv(batch([
    item('R10101_Aug-2026.pdf', 'OK'),
    item('payslip-august.pdf', 'BAD_FILENAME', 'File name must follow Rxxxxx_mmm-yyyy.pdf'),
    item('R99999_Aug-2026.pdf', 'EMPLOYEE_NOT_FOUND', 'No active employee with code R99999'),
  ]));

  const lines = csv.trim().split('\n');
  expect(lines).toHaveLength(3); // header + 2 problems
  expect(csv).not.toContain('R10101_Aug-2026.pdf');
  expect(csv).toContain('payslip-august.pdf');
  expect(csv).toContain('R99999_Aug-2026.pdf');
});

test('errorRowsToCsv quotes a reason containing a comma', () => {
  const csv = errorRowsToCsv(batch([
    item('x.pdf', 'BAD_FILENAME', 'Expected Rxxxxx_mmm-yyyy.pdf, for example R10101_Aug-2026.pdf'),
  ]));
  expect(csv).toContain('"Expected Rxxxxx_mmm-yyyy.pdf, for example R10101_Aug-2026.pdf"');
  expect(csv.trim().split('\n')).toHaveLength(2);
});

test('errorRowsToCsv returns just a header when every file landed', () => {
  const csv = errorRowsToCsv(batch([item('a.pdf', 'OK')]));
  expect(csv.trim().split('\n')).toHaveLength(1);
});

// --- Final review, finding 3: a mid-batch chunk failure must not drop the unsent files. ---

test('splitAtFailedChunk: everything before the failed chunk was sent, the rest was not', () => {
  const chunks = [['a', 'b'], ['c', 'd'], ['e']];
  expect(splitAtFailedChunk(chunks, 1)).toEqual({ sent: ['a', 'b'], unsent: ['c', 'd', 'e'] });
});

test('splitAtFailedChunk: a failure on the first chunk sent nothing', () => {
  expect(splitAtFailedChunk([['a'], ['b']], 0)).toEqual({ sent: [], unsent: ['a', 'b'] });
});

test('splitAtFailedChunk: a failure on the last chunk keeps only that chunk', () => {
  expect(splitAtFailedChunk([['a'], ['b'], ['c']], 2)).toEqual({ sent: ['a', 'b'], unsent: ['c'] });
});

test('splitAtFailedChunk: no failure means everything was sent', () => {
  expect(splitAtFailedChunk([['a'], ['b']], null)).toEqual({ sent: ['a', 'b'], unsent: [] });
});

test('splitAtFailedChunk: never loses or duplicates a file', () => {
  const files = Array.from({ length: 60 }, (_, i) => file(`R${i}_Aug-2026.pdf`));
  const chunks = chunkFiles(files);
  const { sent, unsent } = splitAtFailedChunk(chunks, 1);
  expect(sent).toHaveLength(25);
  expect([...sent, ...unsent]).toEqual(files);
});

// --- Final review, minor 12: the error CSV is opened in Excel; a cell must never run as a formula. ---

const onlyRow = (csv: string) => csv.split('\n')[1];

test('errorRowsToCsv neutralises a file name that starts with a formula character', () => {
  for (const lead of ['=', '+', '-', '@']) {
    const csv = errorRowsToCsv(batch([item(`${lead}HYPERLINK("x").pdf`, 'BAD_FILENAME')]));
    // Prefixed with a single quote so Excel shows it as text; quoted because it holds a quote.
    expect(onlyRow(csv).startsWith(`"'${lead}HYPERLINK(""x"").pdf"`)).toBe(true);
  }
});

test('errorRowsToCsv leaves an ordinary value alone', () => {
  expect(onlyRow(errorRowsToCsv(batch([item('R1_Aug-2026.pdf', 'BAD_FILENAME')]))))
    .toBe('R1_Aug-2026.pdf,BAD_FILENAME,,,');
});

test('errorRowsToCsv quotes a value containing a carriage return', () => {
  const csv = errorRowsToCsv(batch([item('x.pdf', 'BAD_FILENAME', 'line one\rline two')]));
  expect(csv).toContain('"line one\rline two"');
});

// --- Final review, minor 13: a batch holds at most 200 files (the server refuses more with 400). ---

test('the browser cap matches the server cap of 200', () => {
  expect(MAX_FILES_PER_BATCH).toBe(200);
});

test('exceedsBatchLimit allows a selection up to exactly 200', () => {
  expect(exceedsBatchLimit(0, 200)).toBe(false);
  expect(exceedsBatchLimit(150, 50)).toBe(false);
});

test('exceedsBatchLimit refuses a drop that would take the selection past 200', () => {
  expect(exceedsBatchLimit(0, 201)).toBe(true);
  expect(exceedsBatchLimit(190, 11)).toBe(true);
});

// --- Final review, T10 minor: the summary table's row keys must be unique. ---

test('withRowKeys gives two identical failed rows distinct keys', () => {
  // The same bad file dropped twice (or re-sent on a retry) yields two identical items; a key
  // built from fileName + status alone collides and React drops or merges a row.
  const rows = withRowKeys([item('bad.pdf', 'BAD_FILENAME'), item('bad.pdf', 'BAD_FILENAME')]);
  expect(rows).toHaveLength(2);
  expect(rows[0].rowKey).not.toBe(rows[1].rowKey);
  expect(rows[0].fileName).toBe('bad.pdf');
});
