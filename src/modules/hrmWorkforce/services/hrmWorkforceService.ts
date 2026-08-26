// src/modules/hrmWorkforce/services/hrmWorkforceService.ts
//
// The whole HTTP surface of the workforce module. Every call is POST — including the reads —
// because that is the IMES convention the gateway routes and the controllers declare, not an
// oversight. `api`'s baseURL already ends in `/app/v1`, so the paths below start at `/hrm-service`.
//
// No retry, no caching, no de-duplication here on purpose: two of these six endpoints are reports
// a person explicitly asked for, and one (`finalize`) rewrites attendance rows. A transparent
// retry on that would re-run a day's derivation nobody asked to re-run, and a cache would answer
// "is this machine online?" with a stale yes. Freshness and exactly-once are the features.

import api from '@/services/api';
import type {
  AttendanceListRequest,
  FinalizeRequest,
  FleetHealthRequest,
  FleetListRequest,
  IssuesRequest,
  UtilizationRequest,
} from '../types/api.types';
import type {
  AttendanceDaily,
  DeviceHealthRow,
  DeviceIssue,
  EmployeeUtilizationView,
  FinalizeResult,
  FleetDeviceView,
} from '../types/domain.types';

/**
 * The six paths, pinned in one place and covered by `tests/unit/workforce-service-shape.spec.ts`.
 *
 * They are a contract with hrm-service, which lives in a different repository: nothing in this
 * codebase fails to compile if one of them drifts, so the unit test is the only thing standing
 * between a renamed mapping and a 404 in front of an operator. Read off the controllers'
 * `@RequestMapping` + `@PostMapping` on `feat/workforce-collector`, not off the design doc.
 */
export const WORKFORCE_ENDPOINTS = {
  fleetList: '/hrm-service/workforce/fleet/list',
  finalize: '/hrm-service/workforce/fleet/finalize',
  attendanceList: '/hrm-service/attendance/list',
  utilization: '/hrm-service/workforce/reports/employee-utilization',
  fleetHealth: '/hrm-service/workforce/reports/fleet-health',
  issues: '/hrm-service/workforce/reports/issues',
} as const;

export class HrmWorkforceService {
  /**
   * The fleet as the device registry holds it, with liveness derived at read time.
   *
   * A row whose `attributedEmployeeId` is null is a machine whose activity reaches nobody's
   * attendance — the caller must render that, not filter it out.
   */
  static async listFleet(site: string, userId?: string): Promise<FleetDeviceView[]> {
    const body: FleetListRequest = { site, userId };
    const res = await api.post(WORKFORCE_ENDPOINTS.fleetList, body);
    return res.data.response ?? [];
  }

  /**
   * Re-derives one site-day now. Always forced server-side, so pressing it twice is safe and a
   * LOCKED day is left alone.
   *
   * The result is returned undefaulted: `finalize` answering with no body is a failure, and
   * substituting a zero-filled object would render as "0 devices read" — a wrong diagnosis
   * indistinguishable from a real one.
   */
  static async finalizeDay(site: string, date: string, userId?: string): Promise<FinalizeResult> {
    const body: FinalizeRequest = { site, date, userId };
    const res = await api.post(WORKFORCE_ENDPOINTS.finalize, body);
    return res.data.response;
  }

  /** Derived employee-days in the window. `employeeId` narrows it to one person. */
  static async listAttendance(q: AttendanceListRequest): Promise<AttendanceDaily[]> {
    const res = await api.post(WORKFORCE_ENDPOINTS.attendanceList, q);
    return res.data.response ?? [];
  }

  /**
   * Utilization per employee for the window. Naming an `employeeId` is what fills each row's
   * `days`; without one the backend returns totals and rollups with an empty `days` list.
   */
  static async utilization(q: UtilizationRequest): Promise<EmployeeUtilizationView[]> {
    const res = await api.post(WORKFORCE_ENDPOINTS.utilization, q);
    return res.data.response ?? [];
  }

  /** Per machine-day health for the window, with the asset holder and open issues joined in. */
  static async fleetHealth(q: FleetHealthRequest): Promise<DeviceHealthRow[]> {
    const res = await api.post(WORKFORCE_ENDPOINTS.fleetHealth, q);
    return res.data.response ?? [];
  }

  /**
   * Device issues at this site. `status` is `OPEN` or `RESOLVED`; omit it for both — the backend
   * rejects any other value. There is deliberately no date range: an open issue is open whenever
   * it was detected, and a window would hide the long-standing failure most worth seeing.
   */
  static async issues(site: string, status?: string, userId?: string): Promise<DeviceIssue[]> {
    const body: IssuesRequest = { site, status, userId };
    const res = await api.post(WORKFORCE_ENDPOINTS.issues, body);
    return res.data.response ?? [];
  }
}

export default HrmWorkforceService;
