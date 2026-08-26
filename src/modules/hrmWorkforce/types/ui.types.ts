// src/modules/hrmWorkforce/types/ui.types.ts
import type { Liveness } from './domain.types';

/** The three top-level tabs. Which ones exist at all is decided by the access grants. */
export type WorkforceTabKey = 'fleet' | 'attendance' | 'reports';

/** The Reports tab's inner segmented control. */
export type ReportSectionKey = 'utilization' | 'health';

/** Attendance query bar state. Dates are `YYYY-MM-DD`; the range defaults to the last 7 days. */
export interface AttendanceQuery {
  from: string;
  to: string;
  employeeId?: string;
}

/** Reports query bar state — one shape for both report sections. */
export interface ReportQuery {
  from: string;
  to: string;
  employeeId?: string;
  serialNumber?: string;
}

/** Fleet filter bar — both filters are client-side over the list already fetched. */
export interface FleetFilter {
  /** Matches hostname, serial or attributed employee. */
  search: string;
  /** Empty = no liveness filter, i.e. show everything. */
  liveness: Liveness[];
}

/** How a health metric reads against the backend detector's thresholds. */
export type HealthSeverity = 'ok' | 'warning' | 'critical';
