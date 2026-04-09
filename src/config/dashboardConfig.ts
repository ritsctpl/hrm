import {
  Users, Shield, UserCheck, Wallet, CalendarDays,
  Settings, Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Category metadata for sidebar icons and ordering ───

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  'Administration': Shield,
  'Self-Service': UserCheck,
  'Finance & Policy': Wallet,
  'Operations': CalendarDays,
};

/** Controls display order of categories in sidebar and landing page */
export const CATEGORY_ORDER: string[] = [
  'Administration',
  'Self-Service',
  'Finance & Policy',
  'Operations',
];

// ─── Fixed sidebar items (not module-dependent) ───

export interface SidebarFixedItem {
  key: string;
  label: string;
  icon: LucideIcon;
  route: string;
}

export const SIDEBAR_TOP_ITEMS: SidebarFixedItem[] = [
  { key: 'employees', label: 'Employees', icon: Users, route: '/rits/hrm_employee_app' },
];

export const SIDEBAR_BOTTOM_ITEMS: SidebarFixedItem[] = [
  { key: 'settings', label: 'Settings', icon: Settings, route: '/rits/hrm_settings_app' },
  { key: 'notifications', label: 'Notifications', icon: Bell, route: '/rits/hrm_notification_app' },
];

// ─── Breadcrumb group mapping ───

export const BREADCRUMB_GROUP_MAP: Record<string, string> = {
  hrm_organization_app: 'Administration',
  user_maintenance_app: 'Administration',
  userGroup_app: 'Administration',
  hrm_access_app: 'Administration',
  activity_app: 'Administration',
  activityGroup_app: 'Administration',
  userCredential_app: 'Administration',
  hrm_leave_app: 'Self-Service',
  hrm_travel_app: 'Self-Service',
  hrm_expense_app: 'Self-Service',
  hrm_payslip_app: 'Self-Service',
  hrm_appraisal_app: 'Self-Service',
  hrm_timesheet_app: 'Self-Service',
  hrm_project_app: 'Operations',
  hrm_asset_app: 'Operations',
  hrm_holiday_app: 'Operations',
  hrm_payroll_app: 'Finance & Policy',
  hrm_compensation_app: 'Finance & Policy',
  hrm_policy_app: 'Finance & Policy',
  hrm_announcement_app: 'Finance & Policy',
  hrm_settings_app: 'Settings',
  hrm_notification_app: 'Notifications',
  hrm_employee_app: 'Employees',
};

// ─── Badge counts (mock) ───

export const MOCK_BADGE_COUNTS: Record<string, number> = {
  leave: 3,
  expense: 1,
};

// ─── Task shortcuts ───

export interface TaskShortcut {
  label: string;
  route: string;
}

export const TASK_SHORTCUTS: TaskShortcut[] = [
  { label: 'Apply Leave', route: '/rits/hrm_leave_app' },
  { label: 'Submit Expense', route: '/rits/hrm_expense_app' },
  { label: 'View Payslip', route: '/rits/hrm_payslip_app' },
  { label: 'Log Timesheet', route: '/rits/hrm_timesheet_app' },
  { label: 'Request Travel', route: '/rits/hrm_travel_app' },
  { label: 'View Appraisal', route: '/rits/hrm_appraisal_app' },
];

export const QUICK_TASKS = TASK_SHORTCUTS.slice(0, 5);

// ─── Recent activity (mock) ───

export interface RecentActivityItem {
  id: string;
  description: string;
  timeAgo: string;
  status: 'success' | 'info' | 'warning';
}

export const MOCK_RECENT_ACTIVITY: RecentActivityItem[] = [
  { id: '1', description: 'Leave approved by manager', timeAgo: '2 hours ago', status: 'success' },
  { id: '2', description: 'Expense report submitted', timeAgo: '1 day ago', status: 'info' },
  { id: '3', description: 'Timesheet saved as draft', timeAgo: '2 days ago', status: 'success' },
];
