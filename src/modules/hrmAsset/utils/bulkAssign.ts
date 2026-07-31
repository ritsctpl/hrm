/**
 * HRM Asset Module — bulk direct assignment plumbing.
 *
 * There is no batch assign endpoint, so a bulk submission is N independent
 * calls (screen.md §6). Partial success is the expected outcome, not an edge
 * case: one asset going stale must not stop the other 24.
 */

import { ASSIGNMENT_BULK_CONCURRENCY } from './assetConstants';

export interface BulkAssignResult {
  assetId: string;
  assetName?: string;
  ok: boolean;
  /** Success confirmation or the mapped failure reason — shown verbatim. */
  message: string;
}

/**
 * Runs `task` over `items` with at most `limit` in flight. Results come back in
 * input order regardless of completion order, so the summary list matches the
 * order the user ticked the rows.
 */
export async function runWithConcurrency<T, R>(
  items: T[],
  task: (item: T, index: number) => Promise<R>,
  limit: number = ASSIGNMENT_BULK_CONCURRENCY,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    for (;;) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await task(items[index], index);
    }
  };

  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker),
  );
  return results;
}

function csvCell(value: unknown): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Downloads the per-asset outcome as CSV so a failed bulk run can be handed to
 * whoever has to reconcile it. Deliberately includes the successes too — "which
 * 3 of the 5 went through" is the whole question.
 */
export function downloadBulkAssignReport(
  results: BulkAssignResult[],
  context: { employeeId: string; employeeName?: string; assignmentDate: string },
): void {
  const header = ['Asset ID', 'Asset name', 'Employee ID', 'Employee name', 'Assignment date', 'Outcome', 'Detail'];
  const rows = results.map((r) => [
    r.assetId,
    r.assetName ?? '',
    context.employeeId,
    context.employeeName ?? '',
    context.assignmentDate,
    r.ok ? 'ASSIGNED' : 'FAILED',
    r.message,
  ]);

  const csv = [header, ...rows].map((cols) => cols.map(csvCell).join(',')).join('\r\n');
  // BOM so Excel opens it as UTF-8 rather than mangling non-ASCII names.
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `direct-assignment-${context.employeeId}-${context.assignmentDate}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
