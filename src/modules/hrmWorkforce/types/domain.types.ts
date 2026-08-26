// src/modules/hrmWorkforce/types/domain.types.ts
//
// The shapes hrm-service actually returns (`res.data.response`) for the workforce endpoints.
// Every field below was read off the backend records on `feat/workforce-collector`
// (`collector/fleet/dto`, `collector/reporting/dto`, `attendance/model/AttendanceDaily`) rather
// than off the design doc, because the wire is what the components parse. Where the two disagree
// the divergence is called out inline — the design doc's name is the one downstream tasks were
// told to expect, so a silent rename here would be a bug nobody could see until runtime.

/** Derived at read time from `lastSeenAt` — not stored, so a dead machine decays on the next look. */
export type Liveness = 'ONLINE' | 'DELAYED' | 'STALE' | 'OFFLINE';

/** The device registry's own state — a different question from liveness. */
export type DeviceStatus = 'ACTIVE' | 'REVOKED';

/** `SYSTEM` = derived by the engine and re-derivable; `LOCKED` = settled by a human. */
export type AttendanceState = 'SYSTEM' | 'LOCKED';

/**
 * One row of the fleet screen.
 *
 * `attributedEmployeeId` is nullable on purpose and null is the interesting value: it is a machine
 * whose activity will never reach anybody's attendance, i.e. the asset register has drifted from
 * the device registry. Render the gap, never hide it.
 *
 * There is no employee *name* on this row — the backend returns the id only. A screen that wants a
 * name has to join it from the employee list.
 */
export interface FleetDeviceView {
  deviceId: string;
  serialNumber: string;
  hostname: string;
  model: string;
  agentVersion: string;
  /** ISO instant, or null for a device that has never heartbeated. */
  lastSeenAt: string | null;
  liveness: Liveness;
  attributedEmployeeId: string | null;
  status: DeviceStatus;
}

/**
 * One employee-day out of `hrm_attendance_daily`, returned verbatim by `/attendance/list`.
 *
 * ⚠ The holiday/leave flags: the Mongo model declares `private boolean isHoliday` with Lombok, so
 * the accessor is `isHoliday()` and Jackson names the JSON property **`holiday`** (likewise
 * `leaveDay`). Both spellings are declared and both are optional — read them tolerantly
 * (`row.holiday ?? row.isHoliday`) until a live response settles it.
 */
export interface AttendanceDaily {
  handle?: string;
  site?: string;
  employeeId: string;
  employeeName: string;
  /** `YYYY-MM-DD`. */
  date: string;
  /** `endpoint-agent` for everything the collector produces. */
  source?: string;
  /** ISO instants — the moment the person's machines first/last reported. */
  firstIn: string | null;
  lastOut: string | null;
  presentMinutes: number;
  activeMinutes: number;
  idleMinutes: number;
  officeMinutes: number;
  homeMinutes: number;
  clientMinutes: number;
  otherMinutes: number;
  /** Jackson's name for the Lombok accessor — see the note above. */
  holiday?: boolean;
  leaveDay?: boolean;
  /** The field name as declared on the model, in case the backend ever serialises it verbatim. */
  isHoliday?: boolean;
  isLeaveDay?: boolean;
  leaveType: string | null;
  state: AttendanceState;
  revision: number;
}

/** One application's time in the window, already categorised by the backend. */
export interface AppMinutes {
  app: string;
  category: string;
  minutes: number;
}

/** Domains only, never URLs — the spec forbids carrying a full URL to the screen. */
export interface DomainMinutes {
  domain: string;
  visits: number;
  minutes: number;
}

/** A named bucket of minutes — used for the per-machine breakdown. */
export interface NamedMinutes {
  name: string;
  minutes: number;
}

/** Window totals for one employee. `days` is the count of derived days, not a duration. */
export interface RangeTotals {
  days: number;
  presentMinutes: number;
  activeMinutes: number;
  idleMinutes: number;
  officeMinutes: number;
  homeMinutes: number;
  clientMinutes: number;
  otherMinutes: number;
}

/**
 * One derived day inside a utilization row. Deliberately NOT `AttendanceDaily`: the report
 * projects a narrower record (no employeeId/revision) and names the flags `holiday`/`leaveDay`.
 */
export interface UtilizationDayRow {
  date: string;
  firstIn: string | null;
  lastOut: string | null;
  presentMinutes: number;
  activeMinutes: number;
  idleMinutes: number;
  officeMinutes: number;
  homeMinutes: number;
  clientMinutes: number;
  otherMinutes: number;
  holiday: boolean;
  leaveDay: boolean;
  leaveType: string | null;
  state: AttendanceState;
}

/**
 * `/workforce/reports/employee-utilization`, one entry per employee.
 *
 * ⚠ Two names differ from the design doc, and the backend spelling is the one on the wire:
 * the doc's `topDomains` is **`domains`** and its `machineBreakdown` is **`machines`**.
 * `domainsTruncated` exists too (the doc only mentioned `appsTruncated`).
 */
export interface EmployeeUtilizationView {
  employeeId: string;
  employeeName: string;
  days: UtilizationDayRow[];
  totals: RangeTotals;
  /** Category → minutes. Iterate it; never hard-code the category list. */
  categoryMinutes: Record<string, number>;
  apps: AppMinutes[];
  appCount: number;
  appsTruncated: boolean;
  domains: DomainMinutes[];
  domainCount: number;
  domainsTruncated: boolean;
  machines: NamedMinutes[];
}

/**
 * One machine-day of health. Every metric is nullable: an agent that could not read a sensor
 * reports nothing, and a zero here would render as "no disk space left" or "the battery is dead".
 *
 * ⚠ The design doc called the temperature field `tempC`; the backend field is **`tempP95`**.
 */
export interface HealthDayRow {
  date: string;
  cpuP95: number | null;
  ramP95: number | null;
  diskFreePct: number | null;
  smartOk: boolean | null;
  batteryHealthPct: number | null;
  tempP95: number | null;
  snapshots: number;
}

/** An open (or resolved) fault the detector holds against a machine. */
export interface DeviceIssue {
  id: string;
  serialNumber: string;
  issueType: string;
  status: string;
  detail: string;
  ticketId: string | null;
  openedAt: string | null;
  resolvedAt: string | null;
}

/**
 * `/workforce/reports/fleet-health`, one entry per serial — written whether or not anybody holds
 * the machine, so a failing disk in the store is still listed. The holder fields come from the
 * asset-register join and are null when the serial matches no holder.
 */
export interface DeviceHealthRow {
  serialNumber: string;
  hostname: string;
  model: string;
  status: DeviceStatus;
  lastSeenAt: string | null;
  assetId: string | null;
  assetName: string | null;
  currentHolderEmployeeId: string | null;
  currentHolderName: string | null;
  days: HealthDayRow[];
  issues: DeviceIssue[];
}

/**
 * What `/workforce/fleet/finalize` answers with — counts, verbatim, not a sentence.
 * `employeesWritten = 0` with `devicesRead > 0` and `unattributedDevices > 0` is the
 * asset-register-drift diagnosis, and it is only visible if the numbers are.
 *
 * `derived` is the only field that says the day was actually re-derived
 * (`!alreadyFinalized && !skippedNoCalendar`).
 */
export interface FinalizeResult {
  devicesRead: number;
  employeesWritten: number;
  unattributedDevices: number;
  skippedNoCalendar: boolean;
  alreadyFinalized: boolean;
  derived: boolean;
}
