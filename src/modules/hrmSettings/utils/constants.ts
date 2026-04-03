import { User, Shield, Bell, Settings, HelpCircle, LogOut } from 'lucide-react';
import type { SettingsSection } from '../types/domain.types';
import type { NotificationPreferences, CalendarSyncPrefs } from '../types/domain.types';

export const SIDEBAR_ITEMS: { key: SettingsSection | 'logout'; label: string; icon: typeof User }[] = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'security', label: 'Security', icon: Shield },
  { key: 'notifications', label: 'Notifications', icon: Bell },
  { key: 'preferences', label: 'Preferences', icon: Settings },
  { key: 'support', label: 'Help & Support', icon: HelpCircle },
  { key: 'logout', label: 'Logout', icon: LogOut },
];

export const RELATIONSHIP_OPTIONS = [
  'Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other',
];

export const TICKET_CATEGORIES = [
  { value: 'general', label: 'General Inquiry' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'hr', label: 'HR Query' },
  { value: 'payroll', label: 'Payroll Issue' },
  { value: 'leave', label: 'Leave / Attendance' },
];

export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'ka', label: 'Kannada' },
  { value: 'ta', label: 'Tamil' },
];

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  push: {
    salaryCredit: true,
    leaveApproval: true,
    generalAnnouncements: true,
    holidayAlerts: true,
    appraisalUpdates: true,
  },
  email: {
    payslipAvailable: true,
    policyUpdates: true,
    expenseApproval: true,
    projectAssignments: true,
  },
  dnd: {
    enabled: false,
    startTime: null,
    endTime: null,
  },
};

export const DEFAULT_CALENDAR_SYNC: CalendarSyncPrefs = {
  googleCalendar: false,
  outlookCalendar: false,
};

export const PASSWORD_REQUIREMENTS = [
  { key: 'minLength', label: 'At least 8 characters', test: (pw: string) => pw.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter', test: (pw: string) => /[A-Z]/.test(pw) },
  { key: 'number', label: 'One number', test: (pw: string) => /\d/.test(pw) },
  { key: 'special', label: 'One special character', test: (pw: string) => /[!@#$%^&*(),.?":{}|<>]/.test(pw) },
];
