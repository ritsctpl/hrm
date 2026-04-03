import {
  Users, Shield, UserCheck, Wallet, CalendarDays,
  Settings, Bell,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type SidebarItemType = 'direct-nav' | 'flyout';

export interface AppTileConfig {
  key: string;
  labelKey: string;
  subLabelKey: string;
  route: string;
}

export interface SidebarItemConfig {
  key: string;
  labelKey: string;
  icon: LucideIcon;
  type: SidebarItemType;
  route?: string;
  apps?: AppTileConfig[];
}

export const SIDEBAR_ITEMS: SidebarItemConfig[] = [
  { key: 'employees', labelKey: 'nav.sidebar.employees', icon: Users, type: 'direct-nav', route: '/rits/hrm_employee_app' },
  {
    key: 'administration', labelKey: 'nav.sidebar.administration', icon: Shield, type: 'flyout',
    apps: [
      { key: 'organization', labelKey: 'nav.app.organization', subLabelKey: 'dashboard.sublabel.organization', route: '/rits/hrm_organization_app' },
      { key: 'userMaintenance', labelKey: 'nav.app.userMaintenance', subLabelKey: 'dashboard.sublabel.userMaintenance', route: '/rits/user_maintenance_app' },
      { key: 'userGroup', labelKey: 'nav.app.userGroup', subLabelKey: 'dashboard.sublabel.userGroup', route: '/rits/userGroup_app' },
      { key: 'accessControl', labelKey: 'nav.app.accessControl', subLabelKey: 'dashboard.sublabel.accessControl', route: '/rits/hrm_access_app' },
      { key: 'userCredentials', labelKey: 'nav.app.userCredentials', subLabelKey: 'dashboard.sublabel.userCredentials', route: '/rits/userCredential_app' },
      { key: 'activityMaintenance', labelKey: 'nav.app.activityMaintenance', subLabelKey: 'dashboard.sublabel.activityMaintenance', route: '/rits/activity_app' },
      { key: 'activityGroup', labelKey: 'nav.app.activityGroup', subLabelKey: 'dashboard.sublabel.activityGroup', route: '/rits/activityGroup_app' },
    ],
  },
  {
    key: 'selfService', labelKey: 'nav.sidebar.selfService', icon: UserCheck, type: 'flyout',
    apps: [
      { key: 'leave', labelKey: 'nav.app.leave', subLabelKey: 'dashboard.sublabel.leave', route: '/rits/hrm_leave_app' },
      { key: 'travel', labelKey: 'nav.app.travel', subLabelKey: 'dashboard.sublabel.travel', route: '/rits/hrm_travel_app' },
      { key: 'expense', labelKey: 'nav.app.expense', subLabelKey: 'dashboard.sublabel.expense', route: '/rits/hrm_expense_app' },
      { key: 'payslip', labelKey: 'nav.app.payslip', subLabelKey: 'dashboard.sublabel.payslip', route: '/rits/hrm_payslip_app' },
      { key: 'appraisal', labelKey: 'nav.app.appraisal', subLabelKey: 'dashboard.sublabel.appraisal', route: '/rits/hrm_appraisal_app' },
      { key: 'timesheet', labelKey: 'nav.app.timesheet', subLabelKey: 'dashboard.sublabel.timesheet', route: '/rits/hrm_timesheet_app' },
    ],
  },
  {
    key: 'financePolicy', labelKey: 'nav.sidebar.financePolicy', icon: Wallet, type: 'flyout',
    apps: [
      { key: 'payroll', labelKey: 'nav.app.payroll', subLabelKey: 'dashboard.sublabel.payroll', route: '/rits/hrm_payroll_app' },
      { key: 'compensation', labelKey: 'nav.app.compensation', subLabelKey: 'dashboard.sublabel.compensation', route: '/rits/hrm_compensation_app' },
      { key: 'policies', labelKey: 'nav.app.policies', subLabelKey: 'dashboard.sublabel.policies', route: '/rits/hrm_policy_app' },
      { key: 'announcements', labelKey: 'nav.app.announcements', subLabelKey: 'dashboard.sublabel.announcements', route: '/rits/hrm_announcement_app' },
    ],
  },
  {
    key: 'operations', labelKey: 'nav.sidebar.operations', icon: CalendarDays, type: 'flyout',
    apps: [
      { key: 'projects', labelKey: 'nav.app.projects', subLabelKey: 'dashboard.sublabel.projects', route: '/rits/hrm_project_app' },
      { key: 'assets', labelKey: 'nav.app.assets', subLabelKey: 'dashboard.sublabel.assets', route: '/rits/hrm_asset_app' },
      { key: 'holidays', labelKey: 'nav.app.holidays', subLabelKey: 'dashboard.sublabel.holidays', route: '/rits/hrm_holiday_app' },
    ],
  },
];

export const SIDEBAR_BOTTOM_ITEMS: SidebarItemConfig[] = [
  { key: 'settings', labelKey: 'nav.sidebar.settings', icon: Settings, type: 'direct-nav', route: '/rits/hrm_settings_app' },
  { key: 'notifications', labelKey: 'nav.sidebar.notifications', icon: Bell, type: 'direct-nav', route: '/rits/hrm_notification_app' },
];

export const CENTER_GRID_GROUPS = SIDEBAR_ITEMS.filter((item) => item.type === 'flyout');

export interface TaskShortcut {
  labelKey: string;
  route: string;
}

export const TASK_SHORTCUTS: TaskShortcut[] = [
  { labelKey: 'dashboard.task.applyLeave', route: '/rits/hrm_leave_app' },
  { labelKey: 'dashboard.task.submitExpense', route: '/rits/hrm_expense_app' },
  { labelKey: 'dashboard.task.viewPayslip', route: '/rits/hrm_payslip_app' },
  { labelKey: 'dashboard.task.logTimesheet', route: '/rits/hrm_timesheet_app' },
  { labelKey: 'dashboard.task.requestTravel', route: '/rits/hrm_travel_app' },
  { labelKey: 'dashboard.task.viewAppraisal', route: '/rits/hrm_appraisal_app' },
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
  hrm_leave_app: 'Employee Self-Service',
  hrm_travel_app: 'Employee Self-Service',
  hrm_expense_app: 'Employee Self-Service',
  hrm_payslip_app: 'Employee Self-Service',
  hrm_appraisal_app: 'Employee Self-Service',
  hrm_timesheet_app: 'Employee Self-Service',
  hrm_project_app: 'Operations & Planning',
  hrm_asset_app: 'Operations & Planning',
  hrm_holiday_app: 'Operations & Planning',
  hrm_payroll_app: 'Finance & Policy',
  hrm_compensation_app: 'Finance & Policy',
  hrm_policy_app: 'Finance & Policy',
  hrm_announcement_app: 'Finance & Policy',
  hrm_settings_app: 'Settings',
  hrm_notification_app: 'Notifications',
  hrm_dashboard_app: 'Dashboard',
  hrm_employee_app: 'Employees',
};

export const MOCK_BADGE_COUNTS: Record<string, number> = {
  leave: 3,
  expense: 1,
};

export interface RecentActivityItem {
  id: string;
  descriptionKey: string;
  timeAgo: string;
  status: 'success' | 'info' | 'warning';
}

export const MOCK_RECENT_ACTIVITY: RecentActivityItem[] = [
  { id: '1', descriptionKey: 'dashboard.activity.leaveApproved', timeAgo: '2 hours ago', status: 'success' },
  { id: '2', descriptionKey: 'dashboard.activity.expenseSubmitted', timeAgo: '1 day ago', status: 'info' },
  { id: '3', descriptionKey: 'dashboard.activity.timesheetSaved', timeAgo: '2 days ago', status: 'success' },
];
