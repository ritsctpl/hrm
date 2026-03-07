export type DashboardRole = "EMPLOYEE" | "MANAGER" | "HR" | "HR_MANAGER" | "ADMIN" | "SUPERADMIN";
export type AlertSeverity = "CRITICAL" | "WARNING" | "INFO";
export type SystemStatus = "OK" | "WARNING" | "ERROR";

export interface KpiData {
  title: string;
  value: string | number;
  unit?: string;
  trend?: number;
  trendLabel?: string;
  color?: string;
  icon?: string;
}

export interface EmployeeProfile {
  id: string;
  name: string;
  designation: string;
  department: string;
  reportingTo?: string;
  employeeCode: string;
  joinedDate: string;
  photoUrl?: string;
  status: string;
  tenure?: string;
}

export interface LeaveBalance {
  leaveType: string;
  leaveTypeCode: string;
  total: number;
  used: number;
  available: number;
  color?: string;
}

export interface PendingRequest {
  id: string;
  type: "LEAVE" | "EXPENSE" | "ASSET" | "TRAVEL" | "TIMESHEET";
  title: string;
  status: string;
  submittedAt: string;
  module: string;
}

export interface PayslipSummary {
  month: string;
  year: number;
  netPay: number;
  currency: string;
  downloadUrl?: string;
  note?: string;
}

export interface GoalProgress {
  id: string;
  title: string;
  progress: number;
  weight?: number;
}

export interface HolidayItem {
  date: string;
  name: string;
  type?: string;
  daysFrom?: number;
}

export interface AnnouncementAlert {
  id: string;
  title: string;
  priority: string;
  category: string;
  publishedAt: string;
  isRead?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  designation: string;
  status: "PRESENT" | "ON_LEAVE" | "REMOTE" | "ABSENT";
  avatarUrl?: string;
}

export interface TeamOverviewStats {
  present: number;
  onLeave: number;
  remote: number;
  total: number;
}

export interface ApprovalCount {
  module: string;
  count: number;
  route: string;
}

export interface HeadcountTrendData {
  month: string;
  headcount: number;
  newHires: number;
  separations: number;
}

export interface DeptDistributionItem {
  department: string;
  count: number;
  percentage: number;
  color?: string;
}

export interface AttritionData {
  currentRate: number;
  targetRate: number;
  ytdSeparations: number;
  lastYearSeparations: number;
  status: "healthy" | "warning" | "critical";
}

export interface LeaveUtilizationItem {
  leaveType: string;
  daysUsed: number;
  percentage: number;
  color?: string;
}

export interface HrAlert {
  id: string;
  severity: AlertSeverity;
  message: string;
  count?: number;
  createdAt: string;
}

export interface SystemHealthData {
  servicesHealthy: number;
  totalServices: number;
  dbStatus: SystemStatus;
  apiResponseMs: number;
  activeUsers: number;
}

export interface ModuleUsageItem {
  module: string;
  usagePercent: number;
  activeUsers: number;
}

export interface AuditActivityItem {
  time: string;
  user: string;
  module: string;
  action: string;
  details: string;
}

export interface WidgetLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface DashboardLayout {
  role: DashboardRole;
  widgets: string[];
  layout: WidgetLayout[];
}
