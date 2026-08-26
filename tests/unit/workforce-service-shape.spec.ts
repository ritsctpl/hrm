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
