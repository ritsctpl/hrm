import {
  LeaveBalance,
  LeaveRequest,
  LedgerEntry,
  LeaveType,
  ValidationSummary,
} from "./domain.types";

export type DayType = "FULL" | "FIRST_HALF" | "SECOND_HALF";

export interface LeaveRequestFormState {
  leaveTypeCode: string | null;
  startDate: string | null;
  endDate: string | null;
  startDayType: DayType;
  endDayType: DayType;
  totalDays: number;
  reason: string;
  attachmentPath: string | null;
}

export interface LeavePermissions {
  canApply: boolean;
  canCancel: boolean;
  canApprove: boolean;
  canReject: boolean;
  canEscalate: boolean;
  canReassign: boolean;
  canOverride: boolean;
  canViewAll: boolean;
  canPostAccrual: boolean;
  canAdjust: boolean;
  canCreditCompOff: boolean;
  canManagePolicy: boolean;
  canExportPayroll: boolean;
  canLockPayrollMonth: boolean;
  canRunYearEnd: boolean;
}

export interface LeaveBalanceCardProps {
  balance: LeaveBalance;
  onClick?: () => void;
  isSelected?: boolean;
}

export interface LeaveRequestRowProps {
  request: LeaveRequest;
  isSelected: boolean;
  onClick: (request: LeaveRequest) => void;
  onAmend?: (request: LeaveRequest) => void;
}

export interface ApproverRequestRowProps {
  request: LeaveRequest;
  isSelected: boolean;
  onClick: (request: LeaveRequest) => void;
  onApprove?: (handle: string) => void;
  onReject?: (handle: string) => void;
}

export interface ValidationSummaryPanelProps {
  summary: ValidationSummary | null;
  loading?: boolean;
}

export interface LeaveRequestDetailProps {
  request: LeaveRequest;
  organizationId: string;
  permissions: LeavePermissions;
  onApproved?: () => void;
  onRejected?: () => void;
  onCancelled?: () => void;
}

export interface ActionHistoryTimelineProps {
  actions: LeaveRequest["actionHistory"];
}

export interface DateRangePickerProps {
  startDate: string | null;
  endDate: string | null;
  startDayType: DayType;
  endDayType: DayType;
  halfDayAllowed: boolean;
  employeeId?: string;
  onStartDateChange: (date: string, dayType: DayType) => void;
  onEndDateChange: (date: string, dayType: DayType) => void;
  onTotalDaysChange: (days: number) => void;
}

export interface SlaCountdownBadgeProps {
  deadline: string;
  breached: boolean;
  escalationLevel: number;
}

export interface AccrualRunPanelProps {
  organizationId: string;
  onPosted: (batchId: string) => void;
}

export interface ManualAdjustmentFormProps {
  organizationId: string;
  onAdjusted: () => void;
}

export interface CompOffCreditFormProps {
  organizationId: string;
  onCredited: () => void;
}

export interface LeaveCalendarViewProps {
  requests: LeaveRequest[];
  year: number;
  month: number;
  onMonthChange: (month: number) => void;
  teamView?: boolean;
}

export interface LedgerEntryRowProps {
  entry: LedgerEntry;
}

export interface LeaveTypeTagProps {
  code: string;
  name?: string;
}

export interface LeaveStatusChipProps {
  status: string;
}

export interface HalfDayIndicatorProps {
  dayType: DayType;
}

export interface BalanceDeltaDisplayProps {
  before: number;
  after: number;
}

export interface DirectionTagProps {
  direction: "CR" | "DR";
}

export interface EscalationLevelBadgeProps {
  level: number;
}

export interface AccrualPreviewLineProps {
  line: {
    employeeId: string;
    employeeName: string;
    leaveTypeCode: string;
    daysToCredit: number;
    prorated: boolean;
    prorateReason?: string;
    excluded: boolean;
  };
}

export interface TeamCalendarCellProps {
  date: string;
  requests: LeaveRequest[];
  holidayName?: string;
}

export interface LeaveFilterBarProps {
  role: string;
  permissions: LeavePermissions;
  onFilterChange?: (filters: Record<string, string>) => void;
}

export interface EmployeeDashboardProps {
  balances: LeaveBalance[];
  year: number;
  onYearChange: (year: number) => void;
  onApplyLeave?: () => void;
  loading?: boolean;
}

export interface LeaveRequestsTableProps {
  requests: LeaveRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: LeaveRequest) => void;
}

export interface ApproverInboxTableProps {
  requests: LeaveRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: LeaveRequest) => void;
  organizationId: string;
  employeeId: string;
  role: string;
  onActionComplete?: () => void;
}

export interface HrGlobalQueueTableProps {
  requests: LeaveRequest[];
  loading: boolean;
  selectedHandle?: string;
  onRowClick: (request: LeaveRequest) => void;
  organizationId: string;
  employeeId: string;
  role: string;
  onActionComplete?: () => void;
}

export interface LedgerHistoryTableProps {
  entries: LedgerEntry[];
  loading: boolean;
}

export interface BalanceSummaryTableProps {
  balances: LeaveBalance[];
  loading: boolean;
  onRowClick?: (employeeId: string) => void;
}

export interface PolicySettingsTableProps {
  leaveTypes: LeaveType[];
  loading: boolean;
  organizationId: string;
  onRefresh: () => void;
}

export interface LeaveMasterDetailProps {
  children: React.ReactNode;
  leftWidth?: string;
}
