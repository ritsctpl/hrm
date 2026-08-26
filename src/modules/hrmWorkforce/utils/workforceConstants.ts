// src/modules/hrmWorkforce/utils/workforceConstants.ts

/** Registered in `moduleObjectRegistry` by the collector build — do not re-register. */
export const MODULE_CODE = 'HRM_WORKFORCE';

/** The three access objects the tabs are gated on (`useCan(MODULE_CODE, OBJ.X)`). */
export const OBJ = {
  FLEET: 'workforce_fleet',
  ATTENDANCE: 'attendance',
  REPORTS: 'workforce_reports',
} as const;

/**
 * Liveness is derived at read time from `lastSeenAt`, so all four values are reachable on any
 * screen refresh. The colours are semantic (a machine's condition), deliberately not the app
 * accent — a green accent on an OFFLINE row would read as "fine".
 */
export const LIVENESS_META: Record<string, { label: string; className: string; color: string }> = {
  ONLINE: { label: 'Online', className: 'liveOn', color: '#2e7d32' },
  DELAYED: { label: 'Delayed', className: 'liveDelay', color: '#b26a00' },
  STALE: { label: 'Stale', className: 'liveStale', color: '#6b7280' },
  OFFLINE: { label: 'Offline', className: 'liveOff', color: '#c62828' },
};

/**
 * The backend rejects an attendance range longer than this (`AttendanceController.MAX_RANGE_DAYS`).
 * The RangePicker disables beyond it so the user never has to read the 400 to find out.
 */
export const MAX_RANGE_DAYS = 92;
