import { type LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  Wallet,
  FileSpreadsheet,
  CalendarDays,
  HandCoins,
  ClipboardCheck,
  Package,
  Building2,
  ShieldCheck,
  FolderKanban,
  Receipt,
  Globe,
  Timer,
  Scale,
  Newspaper,
  Bell,
  UserCog,
  UsersRound,
  LayoutGrid,
  ListTodo,
  KeyRound,
  Blocks,
} from 'lucide-react';

const MODULE_ICON_MAP: Record<string, LucideIcon> = {
  '/rits/hrm_dashboard_app':     LayoutDashboard,
  '/rits/hrm_employee_app':      Users,
  '/rits/hrm_leave_app':         CalendarClock,
  '/rits/hrm_payroll_app':       Wallet,
  '/rits/hrm_payslip_app':       FileSpreadsheet,
  '/rits/hrm_holiday_app':       CalendarDays,
  '/rits/hrm_compensation_app':  HandCoins,
  '/rits/hrm_appraisal_app':     ClipboardCheck,
  '/rits/hrm_asset_app':         Package,
  '/rits/hrm_organization_app':  Building2,
  '/rits/hrm_access_app':        ShieldCheck,
  '/rits/hrm_project_app':       FolderKanban,
  '/rits/hrm_expense_app':       Receipt,
  '/rits/hrm_travel_app':        Globe,
  '/rits/hrm_timesheet_app':     Timer,
  '/rits/hrm_policy_app':        Scale,
  '/rits/hrm_announcement_app':  Newspaper,
  '/rits/hrm_notification_app':  Bell,
  '/rits/user_maintenance_app':  UserCog,
  '/rits/userGroup_app':         UsersRound,
  '/rits/activityGroup_app':     LayoutGrid,
  '/rits/activity_app':          ListTodo,
  '/rits/userCredential_app':    KeyRound,
};

const FALLBACK_ICON: LucideIcon = Blocks;

export function getModuleIcon(url: string | null | undefined): LucideIcon {
  if (!url) return FALLBACK_ICON;
  const cleanUrl = url.replace(/\/index\.html$/, '');
  return MODULE_ICON_MAP[cleanUrl] ?? FALLBACK_ICON;
}

export default MODULE_ICON_MAP;
