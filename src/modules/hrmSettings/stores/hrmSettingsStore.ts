import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseCookies } from 'nookies';
import type { SettingsSection, ProfileFormData, EmergencyContactData, NotificationPreferences, SupportTicket, CalendarSyncPrefs } from '../types/domain.types';
import { DEFAULT_NOTIFICATION_PREFS, DEFAULT_CALENDAR_SYNC } from '../utils/constants';

interface HrmSettingsState {
  activeSection: SettingsSection;
  setActiveSection: (section: SettingsSection) => void;
  profileDraft: ProfileFormData | null;
  setProfileDraft: (data: ProfileFormData | null) => void;
  emergencyContact: EmergencyContactData;
  setEmergencyContact: (data: EmergencyContactData) => void;
  notificationPrefs: NotificationPreferences;
  setNotificationPrefs: (prefs: NotificationPreferences) => void;
  updatePushToggle: (key: string, value: boolean) => void;
  updateEmailToggle: (key: string, value: boolean) => void;
  tickets: SupportTicket[];
  addTicket: (ticket: SupportTicket) => void;
  calendarSync: CalendarSyncPrefs;
  setCalendarSync: (key: keyof CalendarSyncPrefs, value: boolean) => void;
}

const getUserId = (): string => {
  try {
    const cookies = parseCookies();
    return cookies.userId || 'default';
  } catch {
    return 'default';
  }
};

export const useHrmSettingsStore = create<HrmSettingsState>()(
  persist(
    (set) => ({
      activeSection: 'profile',
      setActiveSection: (section) => set({ activeSection: section }),
      profileDraft: null,
      setProfileDraft: (data) => set({ profileDraft: data }),
      emergencyContact: { name: '', relationship: '', phone: '' },
      setEmergencyContact: (data) => set({ emergencyContact: data }),
      notificationPrefs: DEFAULT_NOTIFICATION_PREFS,
      setNotificationPrefs: (prefs) => set({ notificationPrefs: prefs }),
      updatePushToggle: (key, value) =>
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            push: { ...state.notificationPrefs.push, [key]: value },
          },
        })),
      updateEmailToggle: (key, value) =>
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            email: { ...state.notificationPrefs.email, [key]: value },
          },
        })),
      tickets: [],
      addTicket: (ticket) =>
        set((state) => ({ tickets: [ticket, ...state.tickets] })),
      calendarSync: DEFAULT_CALENDAR_SYNC,
      setCalendarSync: (key, value) =>
        set((state) => ({
          calendarSync: { ...state.calendarSync, [key]: value },
        })),
    }),
    {
      name: `hrm-settings-${getUserId()}`,
      partialize: (state) => ({
        activeSection: state.activeSection,
        notificationPrefs: state.notificationPrefs,
        tickets: state.tickets,
        calendarSync: state.calendarSync,
        emergencyContact: state.emergencyContact,
      }),
    }
  )
);
