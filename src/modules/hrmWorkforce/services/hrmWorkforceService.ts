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
//
// ⚠ WHAT `res.data` IS HERE. `api`'s response interceptor (`src/services/api.ts`) already unwraps
// the MessageModel envelope for every `/hrm-service/` URL: it sets `response.data = data.response`
// when the body carries both `response` and `message_details`, which every workforce controller
// sends (`MessageModel.builder().site(..).message_details(..).response(..)`). So `res.data` IS the
// payload — reading `res.data.response` here would look for `response.response` and find nothing,
// turning every list into `[]` and every finalize into `undefined` against a perfectly good
// backend. Verified against `FleetController`/`ReportController`/`AttendanceController` on
// `feat/workforce-collector` and pinned by `tests/unit/workforce-service-shape.spec.ts`.
//
// The same interceptor REJECTS a 2xx whose body carries `errorCode` (or `message_details.msg_type
// === 'E'`) before it reaches this file, so the 200-envelope error and the HTTP error arrive at the
// hook down one path — its `catch`. No `errorCode` check is needed, or possible, below.

import api from '@/services/api';
import type {
  AppCategory,
  AppCategorySaveRequest,
  AttendanceListRequest,
  FinalizeRequest,
  FleetHealthRequest,
  FleetListRequest,
  IssuesRequest,
  OfficeNetwork,
  OfficeNetworkSaveRequest,
  UtilizationRequest,
  WorkforceBaseRequest,
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
  officeNetworksList: '/hrm-service/workforce/office-networks/list',
  officeNetworksSave: '/hrm-service/workforce/office-networks/save',
  officeNetworksDeactivate: '/hrm-service/workforce/office-networks/deactivate',
  appCategoriesList: '/hrm-service/workforce/app-categories/list',
  appCategoriesSave: '/hrm-service/workforce/app-categories/save',
  appCategoriesDeactivate: '/hrm-service/workforce/app-categories/deactivate',
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
    const res = await api.post<FleetDeviceView[]>(WORKFORCE_ENDPOINTS.fleetList, body);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Re-derives one site-day now. Always forced server-side, so pressing it twice is safe and a
   * LOCKED day is left alone.
   *
   * The result is returned undefaulted: `finalize` answering with no body is a failure, and
   * substituting a zero-filled object would render as "0 devices read" — a wrong diagnosis
   * indistinguishable from a real one.
   */
  static async finalizeDay(
    site: string,
    date: string,
    userId?: string,
  ): Promise<FinalizeResult | undefined> {
    const body: FinalizeRequest = { site, date, userId };
    const res = await api.post<FinalizeResult>(WORKFORCE_ENDPOINTS.finalize, body);
    const result = res.data;
    // The interceptor substitutes `[]` for an absent `response`, so "no result" arrives as an empty
    // array, not as undefined. Both are failures and neither is a FinalizeResult — say so, rather
    // than handing back something the caller will read `.devicesRead` off.
    return result && !Array.isArray(result) && typeof result === 'object' ? result : undefined;
  }

  /** Derived employee-days in the window. `employeeId` narrows it to one person. */
  static async listAttendance(q: AttendanceListRequest): Promise<AttendanceDaily[]> {
    const res = await api.post<AttendanceDaily[]>(WORKFORCE_ENDPOINTS.attendanceList, q);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Utilization per employee for the window. Naming an `employeeId` is what fills each row's
   * `days`; without one the backend returns totals and rollups with an empty `days` list.
   */
  static async utilization(q: UtilizationRequest): Promise<EmployeeUtilizationView[]> {
    const res = await api.post<EmployeeUtilizationView[]>(WORKFORCE_ENDPOINTS.utilization, q);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Per machine-day health for the window, with the asset holder and open issues joined in. */
  static async fleetHealth(q: FleetHealthRequest): Promise<DeviceHealthRow[]> {
    const res = await api.post<DeviceHealthRow[]>(WORKFORCE_ENDPOINTS.fleetHealth, q);
    return Array.isArray(res.data) ? res.data : [];
  }

  /**
   * Device issues at this site. `status` is `OPEN` or `RESOLVED`; omit it for both — the backend
   * rejects any other value. There is deliberately no date range: an open issue is open whenever
   * it was detected, and a window would hide the long-standing failure most worth seeing.
   */
  static async issues(site: string, status?: string, userId?: string): Promise<DeviceIssue[]> {
    const body: IssuesRequest = { site, status, userId };
    const res = await api.post<DeviceIssue[]>(WORKFORCE_ENDPOINTS.issues, body);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** The office-network fingerprints enrolled at this site, active ones only. */
  static async listOfficeNetworks(site: string, userId?: string): Promise<OfficeNetwork[]> {
    const body: WorkforceBaseRequest = { site, userId };
    const res = await api.post<OfficeNetwork[]>(WORKFORCE_ENDPOINTS.officeNetworksList, body);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Creates (no `id`) or updates (`id` present) one fingerprint; returns the saved row. */
  static async saveOfficeNetwork(req: OfficeNetworkSaveRequest): Promise<OfficeNetwork> {
    const res = await api.post<OfficeNetwork>(WORKFORCE_ENDPOINTS.officeNetworksSave, req);
    return res.data;
  }

  /** Soft-deletes one fingerprint by `id` (IMES never hard-deletes). */
  static async deactivateOfficeNetwork(site: string, id: string, userId?: string): Promise<void> {
    const body = { site, id, userId };
    await api.post(WORKFORCE_ENDPOINTS.officeNetworksDeactivate, body);
  }

  /** The app-category classification rules enrolled at this site, active ones only. */
  static async listAppCategories(site: string, userId?: string): Promise<AppCategory[]> {
    const body: WorkforceBaseRequest = { site, userId };
    const res = await api.post<AppCategory[]>(WORKFORCE_ENDPOINTS.appCategoriesList, body);
    return Array.isArray(res.data) ? res.data : [];
  }

  /** Creates (no `id`) or updates (`id` present) one app-category rule; returns the saved row. */
  static async saveAppCategory(req: AppCategorySaveRequest): Promise<AppCategory> {
    const res = await api.post<AppCategory>(WORKFORCE_ENDPOINTS.appCategoriesSave, req);
    return res.data;
  }

  /** Soft-deletes one app-category rule by `id` (IMES never hard-deletes). */
  static async deactivateAppCategory(site: string, id: string, userId?: string): Promise<void> {
    const body = { site, id, userId };
    await api.post(WORKFORCE_ENDPOINTS.appCategoriesDeactivate, body);
  }
}
