// src/modules/hrmWorkforce/stores/hrmWorkforceStore.ts
import { create } from 'zustand';
import dayjs from 'dayjs';
import type {
  AttendanceDaily,
  DeviceHealthRow,
  DeviceIssue,
  EmployeeUtilizationView,
  FleetDeviceView,
} from '../types/domain.types';
import type { AppCategory, OfficeNetwork } from '../types/api.types';
import type { AttendanceQuery, ReportQuery } from '../types/ui.types';

/**
 * The workforce module's single store.
 *
 * Shape follows `hrmTicketStore`: a `create()` over one typed state interface holding the data,
 * its loading flags and plain setters, with every service call living in `useHrmWorkforceData`.
 * Components read state and call hook actions; nothing here talks to the network.
 *
 * <b>Two query objects, not one.</b> Attendance and Reports each own their date range. They are
 * different questions asked at different cadences — "who was present last week" and "how was this
 * machine's disk over the quarter" — and a shared range meant that widening one silently re-ran the
 * other on a window nobody chose. The Reports range additionally carries `serialNumber`, which is
 * meaningless to attendance.
 *
 * <b>One `reportLoading` for three result slots.</b> Utilization, fleet health and issues are
 * fetched by one Refresh on one tab, so a per-slot flag would only let the tab render half a report
 * while the other half is still arriving — a screen that looks finished and is not.
 */

/** `YYYY-MM-DD` for today, or `n` days back. The wire format for every workforce date field. */
export const isoDay = (daysAgo = 0): string => dayjs().subtract(daysAgo, 'day').format('YYYY-MM-DD');

/**
 * The query a report slot was last *successfully* loaded for, as one comparable string.
 *
 * <b>Why a signature at all.</b> Each report panel unmounts when the section toggle switches away
 * from it, so its "have I loaded yet?" ref resets while the store slot stays populated — and the
 * range lives in a `reportQuery` that is shared with the other section. Widening the range on
 * Utilization and switching back to Fleet Health therefore showed the OLD window's rows under the
 * NEW window's bar: a table that quietly answers a question nobody asked any more. Comparing what
 * a slot holds against what the bar is asking closes that without a re-fetch on every remount.
 *
 * <b>Why it is per-slot and not one shared string.</b> The two endpoints read different fields:
 * `employee-utilization` sends `employeeId` and never `serialNumber`, `fleet-health` the reverse.
 * A single four-field signature would make picking a device on the health section invalidate the
 * utilization slot — a re-fetch that provably cannot change a single row. So the field the request
 * does not send is blanked, and the shape stays the same four `|`-separated parts either way.
 *
 * Missing bounds collapse to the empty string rather than `undefined`, so a half-built query has
 * one spelling and cannot accidentally equal a different half-built one.
 */
export type ReportScope = 'utilization' | 'health';

export function reportSignature(query: Partial<ReportQuery> | undefined, scope: ReportScope): string {
  const from = query?.from ?? '';
  const to = query?.to ?? '';
  const employeeId = (scope === 'utilization' ? query?.employeeId : '') ?? '';
  const serialNumber = (scope === 'health' ? query?.serialNumber : '') ?? '';
  return `${from}|${to}|${employeeId}|${serialNumber}`;
}

/**
 * The last 7 days, inclusive — the default window for both query bars.
 *
 * Deliberately not "this month": a month-to-date range on the 1st is a one-day report, and on the
 * 31st it is well past the point where the tables stay readable without paging.
 */
const defaultRange = () => ({ from: isoDay(6), to: isoDay(0) });

interface HrmWorkforceState {
  // ── Fleet tab ────────────────────────────────────────────────────────
  fleet: FleetDeviceView[];
  fleetLoading: boolean;

  // ── Attendance tab ───────────────────────────────────────────────────
  attendanceQuery: AttendanceQuery;
  attendance: AttendanceDaily[];
  attendanceLoading: boolean;

  // ── Reports tab ──────────────────────────────────────────────────────
  reportQuery: ReportQuery;
  utilization: EmployeeUtilizationView[];
  fleetHealth: DeviceHealthRow[];
  issues: DeviceIssue[];
  reportLoading: boolean;

  /**
   * `reportSignature` of the query each report slot currently holds an answer for, or null when it
   * holds nothing trustworthy (never loaded, or the last load failed). A panel compares its slot's
   * signature against the bar's on mount; null and a mismatch both mean "ask again".
   *
   * Deliberately not derived from the rows: an empty result is a real answer to a real query, and
   * re-fetching it on every section switch is exactly the double-fetch this is meant to avoid.
   * `issues` has no signature — it is site-scoped and carries no range, so nothing in the bar can
   * invalidate it.
   */
  utilizationLoadedFor: string | null;
  fleetHealthLoadedFor: string | null;

  // ── Office Networks tab ──────────────────────────────────────────────
  officeNetworks: OfficeNetwork[];
  officeNetworksLoading: boolean;

  // ── App Categories tab ───────────────────────────────────────────────
  appCategories: AppCategory[];
  appCategoriesLoading: boolean;

  /**
   * The last failure's message, kept so a tab can render an inline empty-state that says *why* it
   * is empty. The transient toast is raised by the hook; this is the durable copy — an operator who
   * missed the toast must still be able to tell a failed load from a genuinely empty fleet.
   */
  error: string | null;

  setFleet: (fleet: FleetDeviceView[]) => void;
  setFleetLoading: (v: boolean) => void;

  setAttendanceQuery: (patch: Partial<AttendanceQuery>) => void;
  setAttendance: (attendance: AttendanceDaily[]) => void;
  setAttendanceLoading: (v: boolean) => void;

  setReportQuery: (patch: Partial<ReportQuery>) => void;
  setUtilization: (utilization: EmployeeUtilizationView[]) => void;
  setFleetHealth: (fleetHealth: DeviceHealthRow[]) => void;
  setUtilizationLoadedFor: (signature: string | null) => void;
  setFleetHealthLoadedFor: (signature: string | null) => void;
  setIssues: (issues: DeviceIssue[]) => void;
  setReportLoading: (v: boolean) => void;

  setOfficeNetworks: (officeNetworks: OfficeNetwork[]) => void;
  setOfficeNetworksLoading: (v: boolean) => void;

  setAppCategories: (appCategories: AppCategory[]) => void;
  setAppCategoriesLoading: (v: boolean) => void;

  setError: (error: string | null) => void;
}

export const useHrmWorkforceStore = create<HrmWorkforceState>((set) => ({
  fleet: [],
  fleetLoading: false,

  attendanceQuery: { ...defaultRange() },
  attendance: [],
  attendanceLoading: false,

  reportQuery: { ...defaultRange() },
  utilization: [],
  fleetHealth: [],
  issues: [],
  reportLoading: false,

  utilizationLoadedFor: null,
  fleetHealthLoadedFor: null,

  officeNetworks: [],
  officeNetworksLoading: false,

  appCategories: [],
  appCategoriesLoading: false,

  error: null,

  setFleet: (fleet) => set({ fleet }),
  setFleetLoading: (fleetLoading) => set({ fleetLoading }),

  // Patches, not replacements: the query bars set one control at a time (a range picker, an
  // employee select), and a whole-object setter made every control responsible for re-sending the
  // other's value — which is how an employee filter silently reset the date range.
  setAttendanceQuery: (patch) =>
    set((state) => ({ attendanceQuery: { ...state.attendanceQuery, ...patch } })),
  setAttendance: (attendance) => set({ attendance }),
  setAttendanceLoading: (attendanceLoading) => set({ attendanceLoading }),

  setReportQuery: (patch) => set((state) => ({ reportQuery: { ...state.reportQuery, ...patch } })),
  setUtilization: (utilization) => set({ utilization }),
  setFleetHealth: (fleetHealth) => set({ fleetHealth }),
  setUtilizationLoadedFor: (utilizationLoadedFor) => set({ utilizationLoadedFor }),
  setFleetHealthLoadedFor: (fleetHealthLoadedFor) => set({ fleetHealthLoadedFor }),
  setIssues: (issues) => set({ issues }),
  setReportLoading: (reportLoading) => set({ reportLoading }),

  setOfficeNetworks: (officeNetworks) => set({ officeNetworks }),
  setOfficeNetworksLoading: (officeNetworksLoading) => set({ officeNetworksLoading }),

  setAppCategories: (appCategories) => set({ appCategories }),
  setAppCategoriesLoading: (appCategoriesLoading) => set({ appCategoriesLoading }),

  setError: (error) => set({ error }),
}));
