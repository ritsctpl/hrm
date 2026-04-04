/**
 * Leave module section → backend objectName mapping
 */
export const hrmLeaveSectionMap: Record<string, string> = {
  requests: 'leave_request',
  balance: 'leave_balance',
  policy: 'leave_policy',
  approvalQueue: 'leave_approval',
  hrQueue: 'leave_hr_queue',
  calendar: 'leave_calendar',
  teamCalendar: 'leave_team_calendar',
  accrual: 'leave_accrual',
  compOff: 'leave_comp_off',
  manualAdjustment: 'leave_adjustment',
  ledger: 'leave_ledger',
};
