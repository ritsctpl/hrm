import {
  Users, Shield, UserCheck, Wallet, CalendarDays,
  Settings, Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarItemType = 'direct-nav' | 'flyout';

export interface AppTileConfig {
  key: string;
  label: string;
  subLabel: string;
  route: string;
}

export interface SidebarItemConfig {
  key: string;
  label: string;
  icon: LucideIcon;
  type: SidebarItemType;
  route?: string;
  apps?: AppTileConfig[];
}

export const SIDEBAR_ITEMS: SidebarItemConfig[] = [
  { key: 'employees', label: 'Employees', icon: Users, type: 'direct-nav', route: '/rits/hrm_employee_app' },
  {
    key: 'administration', label: 'Administration', icon: Shield, type: 'flyout',
    apps: [
      { key: 'organization', label: 'Organization', subLabel: 'Company & structure setup', route: '/rits/hrm_organization_app' },
      { key: 'userMaintenance', label: 'User Maintenance', subLabel: 'Manage user accounts', route: '/rits/user_maintenance_app' },
      { key: 'userGroup', label: 'User Groups', subLabel: 'Group-based access', route: '/rits/userGroup_app' },
      { key: 'accessControl', label: 'Access Control', subLabel: 'Roles & permissions', route: '/rits/hrm_access_app' },
      { key: 'userCredentials', label: 'User Credentials', subLabel: 'Password & security', route: '/rits/userCredential_app' },
      { key: 'activityMaintenance', label: 'Activity Maintenance', subLabel: 'Manage activities', route: '/rits/activity_app' },
      { key: 'activityGroup', label: 'Activity Group', subLabel: 'Group activities', route: '/rits/activityGroup_app' },
    ],
  },
  {
    key: 'selfService', label: 'Self-Service', icon: UserCheck, type: 'flyout',
    apps: [
      { key: 'leave', label: 'Leave', subLabel: 'Apply & manage leaves', route: '/rits/hrm_leave_app' },
      { key: 'travel', label: 'Travel', subLabel: 'Travel requests', route: '/rits/hrm_travel_app' },
      { key: 'expense', label: 'Expense', subLabel: 'Submit expenses', route: '/rits/hrm_expense_app' },
      { key: 'payslip', label: 'Payslip', subLabel: 'View salary slips', route: '/rits/hrm_payslip_app' },
      { key: 'appraisal', label: 'Appraisal', subLabel: 'Performance reviews', route: '/rits/hrm_appraisal_app' },
      { key: 'timesheet', label: 'Timesheet', subLabel: 'Log work hours', route: '/rits/hrm_timesheet_app' },
    ],
  },
  {
    key: 'financePolicy', label: 'Finance & Policy', icon: Wallet, type: 'flyout',
    apps: [
      { key: 'payroll', label: 'Payroll', subLabel: 'Salary processing', route: '/rits/hrm_payroll_app' },
      { key: 'compensation', label: 'Compensation', subLabel: 'Benefits & packages', route: '/rits/hrm_compensation_app' },
      { key: 'policies', label: 'Policies', subLabel: 'Company policies', route: '/rits/hrm_policy_app' },
      { key: 'announcements', label: 'Announcements', subLabel: 'Company-wide notices', route: '/rits/hrm_announcement_app' },
    ],
  },
  {
    key: 'operations', label: 'Operations', icon: CalendarDays, type: 'flyout',
    apps: [
      { key: 'projects', label: 'Projects', subLabel: 'Project management', route: '/rits/hrm_project_app' },
      { key: 'assets', label: 'Assets', subLabel: 'Asset tracking', route: '/rits/hrm_asset_app' },
      { key: 'holidays', label: 'Holidays', subLabel: 'Holiday calendar', route: '/rits/hrm_holiday_app' },
    ],
  },
];

export const SIDEBAR_BOTTOM_ITEMS: SidebarItemConfig[] = [
  { key: 'settings', label: 'Settings', icon: Settings, type: 'direct-nav', route: '/rits/hrm_settings_app' },
  { key: 'notifications', label: 'Notifications', icon: Bell, type: 'direct-nav', route: '/rits/hrm_notification_app' },
];

export const CENTER_GRID_GROUPS = SIDEBAR_ITEMS.filter((item) => item.type === 'flyout');

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

export const MOCK_BADGE_COUNTS: Record<string, number> = {
  leave: 3,
  expense: 1,
};

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
