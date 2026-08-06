import {
  Users, Shield, Wallet, FolderKanban, LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Category metadata for sidebar icons and ordering ───

export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  // Shared landing area for everyone — also the fallback bucket for modules
  // the API reports without a mapped category
  'General': LayoutGrid,
  'Admin': Shield,
  'HR': Users,
  'Operations': FolderKanban,
  'Finance': Wallet,
};

/** Controls display order of categories in sidebar and landing page */
export const CATEGORY_ORDER: string[] = [
  'General',
  'Admin',
  'HR',
  'Operations',
  'Finance',
];

// ─── Frontend module grouping ───

/**
 * Frontend override for module → category. The RBAC API returns its own
 * `moduleCategory` per module, but the product grouping is owned here so the
 * navigation stays stable regardless of backend categorisation. Modules absent
 * from this map fall back to their API-supplied category.
 */
export const MODULE_CATEGORY_MAP: Record<string, string> = {
  // General — used by all employees, not admin-specific. Dashboard and
  // Notifications belong here conceptually but are reached through the home
  // page and app bar, so only Announcements is advertised in nav.
  '/rits/hrm_announcement_app': 'General',
  // User Guides is read-only for everyone — it belongs with the shared apps,
  // not with the admin tooling, even though only admins can upload.
  '/rits/hrm_user_guide_app': 'General',
  // Raising a ticket is something every employee does; only the queue and the
  // configuration behind it are admin-facing, and those are tabs within the app.
  '/rits/hrm_ticket_app': 'General',

  // Admin — system configuration and administration
  '/rits/hrm_access_app': 'Admin',
  '/rits/hrm_policy_app': 'Admin',
  '/rits/hrm_asset_app': 'Admin',
  '/rits/hrm_settings_app': 'Admin',
  '/rits/hrm_grade_app': 'Admin',

  // HR — core people management
  '/rits/hrm_employee_app': 'HR',
  '/rits/hrm_organization_app': 'HR',
  '/rits/hrm_appraisal_app': 'HR',
  '/rits/hrm_leave_app': 'HR',
  '/rits/hrm_holiday_app': 'HR',

  // Operations — day-to-day work and time tracking
  '/rits/hrm_project_app': 'Operations',
  '/rits/hrm_timesheet_app': 'Operations',

  // Finance — money-related functions
  '/rits/hrm_payroll_app': 'Finance',
  '/rits/hrm_payslip_app': 'Finance',
  '/rits/hrm_expense_app': 'Finance',
  '/rits/hrm_compensation_app': 'Finance',
  '/rits/hrm_travel_app': 'Finance',
};

/**
 * Modules withheld from the landing page and sidebar. Routes and RBAC are
 * untouched — these are reachable by direct URL, just not advertised in nav.
 */
export const HIDDEN_MODULE_URLS: string[] = [
  // The landing page is itself the dashboard, and notifications are reached
  // from the app bar — listing them as tiles would be redundant.
  '/rits/hrm_dashboard_app',
  '/rits/hrm_notification_app',
  // Legacy admin apps superseded by Access Control
  '/rits/user_maintenance_app',
  '/rits/userGroup_app',
  '/rits/activity_app',
  '/rits/activityGroup_app',
  '/rits/userCredential_app',
];

/** Strips the `/index.html` suffix some appUrl values carry. */
function normalizeAppUrl(appUrl: string): string {
  return (appUrl || '').replace(/\/index\.html$/, '');
}

/** True when a module should not appear in the landing page or sidebar. */
export function isModuleHidden(appUrl: string | null | undefined): boolean {
  if (!appUrl) return false;
  return HIDDEN_MODULE_URLS.includes(normalizeAppUrl(appUrl));
}

/** Frontend category for a module, falling back to the API-supplied one. */
export function resolveModuleCategory(
  appUrl: string | null | undefined,
  apiCategory?: string | null,
): string {
  const mapped = appUrl ? MODULE_CATEGORY_MAP[normalizeAppUrl(appUrl)] : undefined;
  return mapped || apiCategory || 'General';
}

// ─── Fixed sidebar items (not module-dependent) ───

export interface SidebarFixedItem {
  key: string;
  label: string;
  icon: LucideIcon;
  route: string;
}

/**
 * Employees is reached through the HR group and Settings through the Admin
 * group (plus the app-bar user menu), so no module is pinned outside the
 * category flyouts.
 */
export const SIDEBAR_TOP_ITEMS: SidebarFixedItem[] = [];

export const SIDEBAR_BOTTOM_ITEMS: SidebarFixedItem[] = [];

// ─── Breadcrumb group mapping ───

/** Derived from MODULE_CATEGORY_MAP so breadcrumbs never drift from the nav. */
export const BREADCRUMB_GROUP_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(MODULE_CATEGORY_MAP).map(([url, category]) => [
    url.replace('/rits/', ''),
    category,
  ]),
);

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
  { label: 'Raise a Ticket', route: '/rits/hrm_ticket_app' },
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
