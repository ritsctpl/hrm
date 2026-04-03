import type { SettingsSection, ProfileFormData, EmergencyContactData, NotificationPreferences, SupportTicket, CalendarSyncPrefs, TicketFormData } from './domain.types';

// --- Atoms ---
export interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  sectionKey: SettingsSection | 'logout';
  isActive: boolean;
  onClick: () => void;
}

export interface PasswordStrengthBarProps {
  password: string;
}

export interface DarkModeToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export interface QuickLinksProps {}

// --- Molecules ---
export interface ProfilePhotoUploadProps {
  photoUrl: string | undefined;
  onPhotoChange: (base64: string) => void;
}

export interface EmergencyContactFormProps {
  data: EmergencyContactData;
  onChange: (data: EmergencyContactData) => void;
  errors?: Record<string, string>;
}

export interface ChangePasswordFormProps {}

export interface SessionInfoProps {
  lastLogin: string | null;
  loginMethod: string;
}

export interface NotificationToggleGroupProps {
  title: string;
  toggles: { key: string; label: string; checked: boolean }[];
  onToggle: (key: string, value: boolean) => void;
}

export interface DndScheduleProps {
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
  onToggle: (enabled: boolean) => void;
  onStartTimeChange: (time: string | null) => void;
  onEndTimeChange: (time: string | null) => void;
}

export interface LanguageSelectorProps {
  currentLanguage: string;
  onLanguageChange: (lang: string) => void;
}

export interface CalendarSyncTogglesProps {
  prefs: CalendarSyncPrefs;
  onToggle: (key: keyof CalendarSyncPrefs, value: boolean) => void;
}

export interface ThemePresetGridProps {
  activeThemeKey: string;
  onThemeSelect: (key: string) => void;
}

export interface TicketFormProps {
  onSubmit: (data: TicketFormData) => void;
}

export interface TicketListProps {
  tickets: SupportTicket[];
}

// --- Organisms ---
export interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onLogout: () => void;
}

export interface SettingsContentProps {
  activeSection: SettingsSection;
}

// --- Templates ---
export interface SettingsTemplateProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
  onLogout: () => void;
}
