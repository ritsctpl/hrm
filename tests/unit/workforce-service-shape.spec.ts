import { test, expect } from '@playwright/test';
import { WORKFORCE_ENDPOINTS } from '../../src/modules/hrmWorkforce/services/hrmWorkforceService';

// The paths are pinned here rather than left inline in the service because they are a contract with
// a backend that lives in another repo: if someone "tidies" a path, this test fails at build time
// instead of the screen failing at 404 in front of an operator. Every value below was read off the
// controllers on feat/workforce-collector (FleetController, ReportController, AttendanceController),
// not off the design doc — the @RequestMapping is what actually answers.
test('endpoint paths match the built backend contract', () => {
  expect(WORKFORCE_ENDPOINTS.fleetList).toBe('/hrm-service/workforce/fleet/list');
  expect(WORKFORCE_ENDPOINTS.finalize).toBe('/hrm-service/workforce/fleet/finalize');
  expect(WORKFORCE_ENDPOINTS.attendanceList).toBe('/hrm-service/attendance/list');
  expect(WORKFORCE_ENDPOINTS.utilization).toBe('/hrm-service/workforce/reports/employee-utilization');
  expect(WORKFORCE_ENDPOINTS.fleetHealth).toBe('/hrm-service/workforce/reports/fleet-health');
  expect(WORKFORCE_ENDPOINTS.issues).toBe('/hrm-service/workforce/reports/issues');
});

/**
 * The envelope contract, proven rather than assumed.
 *
 * The backend answers `{ site, message_details, response }` and `src/services/api.ts`'s response
 * interceptor unwraps that for `/hrm-service/` URLs — `response.data = data.response` — before any
 * service method sees it. Task 2 shipped `res.data.response`, which reads `response.response` off
 * the already-unwrapped payload: every list would have returned `[]` and every finalize
 * `undefined` against a perfectly healthy backend, with no error anywhere to say so. That class of
 * bug is invisible to a path test and to `tsc`, so it is pinned here with a stub axios adapter that
 * replays a real envelope through the real interceptors.
 */
import api from '../../src/services/api';
import { HrmWorkforceService } from '../../src/modules/hrmWorkforce/services/hrmWorkforceService';

/** Answers every request with `body`, exactly as hrm-service would put it on the wire. */
function stubBackend(body: unknown) {
  // A concrete baseURL keeps the request interceptor off its runtime-config refetch path — that
  // branch fires on an unset baseURL and, with no server here, logs a caught fetch failure over
  // every assertion. It is never used: the adapter below answers instead of the network.
  api.defaults.baseURL = 'http://unit.test/app/v1';
  api.defaults.adapter = async (config: any) => ({
    data: body,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  });
}

test.afterEach(() => {
  api.defaults.adapter = undefined as any;
});

test('a list method returns the envelope\'s rows, not an empty array', async () => {
  stubBackend({
    site: 'RITS',
    message_details: { msg: '1 device(s), 0 unattributed' },
    response: [{ serialNumber: 'PF5GJT06', hostname: 'LAPTOP-RITS-SEN' }],
  });
  const rows = await HrmWorkforceService.listFleet('RITS', 'R10002');
  expect(rows.length).toBe(1);
  expect(rows[0].serialNumber).toBe('PF5GJT06');
});

test('finalize returns the counts verbatim', async () => {
  stubBackend({
    site: 'RITS',
    message_details: { msg: 'finalized' },
    response: { devicesRead: 4, employeesWritten: 0, unattributedDevices: 4, skippedNoCalendar: false, alreadyFinalized: false, derived: true },
  });
  const result = await HrmWorkforceService.finalizeDay('RITS', '2026-08-25', 'R10002');
  // The asset-register-drift diagnosis: machines were read, nobody's attendance was written.
  expect(result?.devicesRead).toBe(4);
  expect(result?.employeesWritten).toBe(0);
  expect(result?.unattributedDevices).toBe(4);
});

test('a finalize with no body is undefined, never a zero-filled result', async () => {
  // The interceptor substitutes `[]` for an absent `response`; zeros here would render as
  // "0 devices read", which is a real and different finding.
  stubBackend({ site: 'RITS', message_details: { msg: 'nothing' }, response: null });
  expect(await HrmWorkforceService.finalizeDay('RITS', '2026-08-25')).toBeUndefined();
});

test('a 2xx error envelope rejects, so the hook can surface it', async () => {
  stubBackend({ errorCode: '1001', message_details: { msg: 'Site is required', msg_type: 'E' } });
  await expect(HrmWorkforceService.listFleet('', 'R10002')).rejects.toThrow('Site is required');
});
