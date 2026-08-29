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
 * An office-network fingerprint: the set of network identities (gateway MACs, Wi-Fi BSSIDs and
 * public egress IPs) that mark a device as being *at* a known location, so on-site activity can be
 * told from off-site. Returned by `/workforce/office-networks/list` as the registry holds it, with
 * the server-managed identity and audit fields joined in. The three fingerprint lists are always
 * present as arrays — empty, never null — so the form can bind a textarea to each without a guard.
 */
export interface OfficeNetwork {
  id: string;
  site: string;
  /** The location this fingerprint belongs to, when it is tied to one; null for a site-wide rule. */
  locationId?: string;
  locationType: string;
  label: string;
  gatewayMacs: string[];
  bssids: string[];
  egressIps: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * `/workforce/office-networks/save` — create when `id` is absent, update when it is present. The
 * three fingerprint lists arrive from the form already split and de-duplicated (see
 * `parseFingerprintList`); an empty list is a legitimate "this dimension is not fingerprinted".
 */
export interface OfficeNetworkSaveRequest extends WorkforceBaseRequest {
  id?: string;
  locationId?: string;
  locationType: string;
  label: string;
  gatewayMacs: string[];
  bssids: string[];
  egressIps: string[];
}

/**
 * An app-category rule: a pattern that classifies an application (by its window title, process name
 * or URL) into a named category, so raw activity can be rolled up into work categories. Returned by
 * `/workforce/app-categories/list` as the registry holds it, active ones only, with the
 * server-managed identity and audit fields joined in.
 */
export interface AppCategory {
  id: string;
  site: string;
  pattern: string;
  category: string;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
}

/**
 * `/workforce/app-categories/save` — create when `id` is absent, update when it is present.
 */
export interface AppCategorySaveRequest extends WorkforceBaseRequest {
  id?: string;
  pattern: string;
  category: string;
}

/**
 * The MessageModel envelope as hrm-service puts it on the wire.
 *
 * ⚠ The service layer never sees this shape. `src/services/api.ts`'s response interceptor unwraps
 * every `/hrm-service/` body — `response.data = data.response ?? []` — and rejects any body
 * carrying `errorCode` (or `message_details.msg_type === 'E'`) before the promise resolves. So a
 * workforce service method reads `res.data` as the payload directly, and the error envelope
 * reaches `useHrmWorkforceData`'s `catch` as a thrown `Error` alongside the HTTP errors. Kept here
 * because it documents what the backend actually sends, and because that is what a future
 * interceptor change would have to keep honouring.
 */
export interface MessageModel<T> {
  site?: string;
  handle?: string;
  message_details?: { msg?: string };
  response?: T;
  errorCode?: string | number;
  message?: string;
}
