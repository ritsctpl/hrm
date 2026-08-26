// src/modules/hrmWorkforce/types/api.types.ts
//
// Request bodies for the six workforce endpoints, plus the envelope every one of them answers in.
// All calls are POST (IMES convention, reads included) and all carry `site`; `userId` is the legacy
// actor fallback — the gateway stamps the real actor as `X-User-ID` from the JWT.

/** Every workforce request is site-scoped, and the site comes from the CommonAppBar context. */
export interface WorkforceBaseRequest {
  site: string;
  userId?: string;
}

/** `/workforce/fleet/list` */
export type FleetListRequest = WorkforceBaseRequest;

/** `/workforce/fleet/finalize` — `date` is `YYYY-MM-DD` and is required. */
export interface FinalizeRequest extends WorkforceBaseRequest {
  date: string;
}

/** `/attendance/list` — `from`/`to` are `YYYY-MM-DD`, inclusive, at most MAX_RANGE_DAYS apart. */
export interface AttendanceListRequest extends WorkforceBaseRequest {
  from: string;
  to: string;
  employeeId?: string;
}

/** `/workforce/reports/employee-utilization` */
export interface UtilizationRequest extends WorkforceBaseRequest {
  from: string;
  to: string;
  employeeId?: string;
}

/** `/workforce/reports/fleet-health` */
export interface FleetHealthRequest extends WorkforceBaseRequest {
  from: string;
  to: string;
  serialNumber?: string;
}

/** `/workforce/reports/issues` — `status` filters OPEN/RESOLVED; omit for all. */
export interface IssuesRequest extends WorkforceBaseRequest {
  status?: string;
}

/**
 * The MessageModel envelope. Read `response`; on the `errorCode` shape throw so the hook can
 * surface `message` through `message.error` instead of rendering an error object as data.
 */
export interface MessageModel<T> {
  site?: string;
  handle?: string;
  message_details?: { msg?: string };
  response?: T;
  errorCode?: string | number;
  message?: string;
}
