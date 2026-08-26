import { test, expect } from '@playwright/test';
import { filterFleet } from '../../src/modules/hrmWorkforce/hooks/useHrmWorkforceData';

// Two rows, deliberately asymmetric: one attributed and online, one unattributed and offline.
// The unattributed row is the one the fleet screen exists to surface (a machine whose activity
// reaches nobody's attendance), so every filter case below checks it is reachable, not hidden.
const rows = [
  { hostname: 'LAPTOP-RITS-SEN', serialNumber: 'PF5GJT06', liveness: 'ONLINE', attributedEmployeeId: 'R10002' },
  { hostname: 'wf-it-host-1', serialNumber: 'WF-IT-1', liveness: 'OFFLINE', attributedEmployeeId: null },
] as any[];

test('search matches host and serial, case-insensitive', () => {
  expect(filterFleet(rows, { search: 'pf5g', liveness: [] }).length).toBe(1);
  expect(filterFleet(rows, { search: 'RITS', liveness: [] })[0].serialNumber).toBe('PF5GJT06');
});

test('liveness filter narrows; empty means all', () => {
  expect(filterFleet(rows, { search: '', liveness: ['OFFLINE'] }).length).toBe(1);
  expect(filterFleet(rows, { search: '', liveness: [] }).length).toBe(2);
});

// ── Beyond the brief ────────────────────────────────────────────────────────
// The three cases below are not in the brief but are the ones that would ship a wrong screen:
// a null attribution must not throw, the two filters must intersect rather than shadow one
// another, and whitespace typed into a search box must not empty the table.

test('a null attribution is filtered over, never thrown on', () => {
  expect(() => filterFleet(rows, { search: 'r10002', liveness: [] })).not.toThrow();
  expect(filterFleet(rows, { search: 'r10002', liveness: [] }).length).toBe(1);
  // The unattributed machine is still reachable by its own identity.
  expect(filterFleet(rows, { search: 'wf-it', liveness: [] })[0].attributedEmployeeId).toBe(null);
});

test('search and liveness intersect', () => {
  // 'wf-it-host-1' is OFFLINE, so an ONLINE filter must exclude it even though the text matches.
  expect(filterFleet(rows, { search: 'wf-it', liveness: ['ONLINE'] }).length).toBe(0);
  expect(filterFleet(rows, { search: 'wf-it', liveness: ['OFFLINE'] }).length).toBe(1);
});

test('a whitespace-only search is no search at all', () => {
  expect(filterFleet(rows, { search: '   ', liveness: [] }).length).toBe(2);
});

test('an empty fleet stays empty rather than throwing', () => {
  expect(filterFleet([], { search: 'anything', liveness: ['ONLINE'] })).toEqual([]);
});
