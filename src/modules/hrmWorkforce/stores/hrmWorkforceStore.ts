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
  setIssues: (issues: DeviceIssue[]) => void;
  setReportLoading: (v: boolean) => void;

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
  setIssues: (issues) => set({ issues }),
  setReportLoading: (reportLoading) => set({ reportLoading }),

  setError: (error) => set({ error }),
}));
