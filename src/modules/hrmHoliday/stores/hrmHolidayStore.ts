/**
 * HRM Holiday Module - Zustand Store
 * Centralized state management for Holiday Groups, Holidays, Calendar, and BU Mappings
 */

import { create } from 'zustand';
import type {
  HolidayGroup,
  Holiday,
  HolidayBuMapping,
  HolidayCategoryConfig,
  CalendarViewData,
  HolidayAuditLog,
  ImportResult,
} from '../types/domain.types';
import type { HolidayGroupSearchParams } from '../types/ui.types';

// ─── State Interface ──────────────────────────────────────────────────────────

interface HrmHolidayState {
  groups: HolidayGroup[];
  groupsLoading: boolean;
  groupsError: string | null;
  searchParams: HolidayGroupSearchParams;

  selectedGroup: HolidayGroup | null;
  selectedGroupLoading: boolean;

  holidays: Holiday[];
  holidaysLoading: boolean;
  holidaysError: string | null;

  calendarData: CalendarViewData | null;
  calendarLoading: boolean;
  calendarMonth: number;
  calendarYear: number;

  mappings: HolidayBuMapping[];
  mappingsLoading: boolean;

  categories: HolidayCategoryConfig[];
  categoriesLoading: boolean;

  auditLogs: HolidayAuditLog[];
  auditLogsLoading: boolean;

  importResult: ImportResult | null;
  importLoading: boolean;

  activeTab: 'list' | 'calendar' | 'audit';
  showHolidayForm: boolean;
  showBuMapping: boolean;
  showImport: boolean;
  showGroupCreateModal: boolean;
  showGroupUpdateModal: boolean;
  showHolidayCreateModal: boolean;
  showDuplicateModal: boolean;
  showPublishModal: boolean;
  showLockModal: boolean;
  showUnlockModal: boolean;
  editingHoliday: Holiday | null;
  categoryFilter: string | null;
  monthFilter: number | null;

  // Actions — Groups
  setSearchParams: (params: Partial<HolidayGroupSearchParams>) => void;
  setGroups: (groups: HolidayGroup[]) => void;
  setGroupsLoading: (loading: boolean) => void;
  setGroupsError: (error: string | null) => void;
  selectGroup: (group: HolidayGroup | null) => void;
  updateGroupStatus: (handle: string, status: 'DRAFT' | 'PUBLISHED' | 'LOCKED') => void;

  // Actions — Holidays
  setHolidays: (holidays: Holiday[]) => void;
  setHolidaysLoading: (loading: boolean) => void;
  setHolidaysError: (error: string | null) => void;
  addHoliday: (holiday: Holiday) => void;
  updateHoliday: (handle: string, changes: Partial<Holiday>) => void;
  removeHoliday: (handle: string) => void;

  // Actions — Calendar
  setCalendarData: (data: CalendarViewData | null) => void;
  setCalendarLoading: (loading: boolean) => void;
  setCalendarMonth: (month: number) => void;
  setCalendarYear: (year: number) => void;

  // Actions — Mappings
  setMappings: (mappings: HolidayBuMapping[]) => void;
  setMappingsLoading: (loading: boolean) => void;
  addMapping: (mapping: HolidayBuMapping) => void;
  removeMapping: (handle: string) => void;

  // Actions — Categories
  setCategories: (cats: HolidayCategoryConfig[]) => void;
  setCategoriesLoading: (loading: boolean) => void;
  addCategory: (cat: HolidayCategoryConfig) => void;
  updateCategory: (handle: string, changes: Partial<HolidayCategoryConfig>) => void;

  // Actions — Audit
  setAuditLogs: (logs: HolidayAuditLog[]) => void;
  setAuditLogsLoading: (loading: boolean) => void;

  // Actions — Import
  setImportResult: (result: ImportResult | null) => void;
  setImportLoading: (loading: boolean) => void;

  // Actions — UI
  setActiveTab: (tab: 'list' | 'calendar' | 'audit') => void;
  openHolidayForm: (holiday?: Holiday) => void;
  closeHolidayForm: () => void;
  openBuMapping: () => void;
  closeBuMapping: () => void;
  openImport: () => void;
  closeImport: () => void;
  openGroupCreateModal: () => void;
  closeGroupCreateModal: () => void;
  openGroupUpdateModal: () => void;
  closeGroupUpdateModal: () => void;
  openHolidayCreateModal: () => void;
  closeHolidayCreateModal: () => void;
  openDuplicateModal: () => void;
  closeDuplicateModal: () => void;
  openPublishModal: () => void;
  closePublishModal: () => void;
  openLockModal: () => void;
  closeLockModal: () => void;
  openUnlockModal: () => void;
  closeUnlockModal: () => void;
  setCategoryFilter: (cat: string | null) => void;
  setMonthFilter: (month: number | null) => void;

  reset: () => void;
}

// ─── Default State ────────────────────────────────────────────────────────────

const defaultState = {
  groups: [] as HolidayGroup[],
  groupsLoading: false,
  groupsError: null as string | null,
  searchParams: { year: new Date().getFullYear() } as HolidayGroupSearchParams,
  selectedGroup: null as HolidayGroup | null,
  selectedGroupLoading: false,
  holidays: [] as Holiday[],
  holidaysLoading: false,
  holidaysError: null as string | null,
  calendarData: null as CalendarViewData | null,
  calendarLoading: false,
  calendarMonth: new Date().getMonth() + 1,
  calendarYear: new Date().getFullYear(),
  mappings: [] as HolidayBuMapping[],
  mappingsLoading: false,
  categories: [] as HolidayCategoryConfig[],
  categoriesLoading: false,
  auditLogs: [] as HolidayAuditLog[],
  auditLogsLoading: false,
  importResult: null as ImportResult | null,
  importLoading: false,
  activeTab: 'list' as const,
  showHolidayForm: false,
  showBuMapping: false,
  showImport: false,
  showGroupCreateModal: false,
  showGroupUpdateModal: false,
  showHolidayCreateModal: false,
  showDuplicateModal: false,
  showPublishModal: false,
  showLockModal: false,
  showUnlockModal: false,
  editingHoliday: null as Holiday | null,
  categoryFilter: null as string | null,
  monthFilter: null as number | null,
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useHrmHolidayStore = create<HrmHolidayState>((set) => ({
  ...defaultState,

  setSearchParams: (params) =>
    set((s) => ({ searchParams: { ...s.searchParams, ...params } })),
  setGroups: (groups) => set({ groups }),
  setGroupsLoading: (groupsLoading) => set({ groupsLoading }),
  setGroupsError: (groupsError) => set({ groupsError }),
  selectGroup: (selectedGroup) =>
    set({ selectedGroup, holidays: [], calendarData: null, auditLogs: [] }),
  updateGroupStatus: (handle, status) =>
    set((s) => ({
      groups: s.groups.map((g) => (g.handle === handle ? { ...g, status } : g)),
      selectedGroup:
        s.selectedGroup?.handle === handle
          ? { ...s.selectedGroup, status }
          : s.selectedGroup,
    })),

  setHolidays: (holidays) => set({ holidays }),
  setHolidaysLoading: (holidaysLoading) => set({ holidaysLoading }),
  setHolidaysError: (holidaysError) => set({ holidaysError }),
  addHoliday: (holiday) => set((s) => ({ holidays: [...s.holidays, holiday] })),
  updateHoliday: (handle, changes) =>
    set((s) => ({
      holidays: s.holidays.map((h) => (h.handle === handle ? { ...h, ...changes } : h)),
    })),
  removeHoliday: (handle) =>
    set((s) => ({ holidays: s.holidays.filter((h) => h.handle !== handle) })),

  setCalendarData: (calendarData) => set({ calendarData }),
  setCalendarLoading: (calendarLoading) => set({ calendarLoading }),
  setCalendarMonth: (calendarMonth) => set({ calendarMonth }),
  setCalendarYear: (calendarYear) => set({ calendarYear }),

  setMappings: (mappings) => set({ mappings }),
  setMappingsLoading: (mappingsLoading) => set({ mappingsLoading }),
  addMapping: (mapping) => set((s) => ({ mappings: [...s.mappings, mapping] })),
  removeMapping: (handle) =>
    set((s) => ({ mappings: s.mappings.filter((m) => m.handle !== handle) })),

  setCategories: (categories) => set({ categories }),
  setCategoriesLoading: (categoriesLoading) => set({ categoriesLoading }),
  addCategory: (cat) => set((s) => ({ categories: [...s.categories, cat] })),
  updateCategory: (handle, changes) =>
    set((s) => ({
      categories: s.categories.map((c) =>
        c.handle === handle ? { ...c, ...changes } : c
      ),
    })),

  setAuditLogs: (auditLogs) => set({ auditLogs }),
  setAuditLogsLoading: (auditLogsLoading) => set({ auditLogsLoading }),
  setImportResult: (importResult) => set({ importResult }),
  setImportLoading: (importLoading) => set({ importLoading }),

  setActiveTab: (activeTab) => set({ activeTab }),
  openHolidayForm: (holiday) =>
    set({ showHolidayForm: true, editingHoliday: holiday ?? null }),
  closeHolidayForm: () => set({ showHolidayForm: false, editingHoliday: null }),
  openBuMapping: () => set({ showBuMapping: true }),
  closeBuMapping: () => set({ showBuMapping: false }),
  openImport: () => set({ showImport: true, importResult: null }),
  closeImport: () => set({ showImport: false, importResult: null }),
  openGroupCreateModal: () => set({ showGroupCreateModal: true }),
  closeGroupCreateModal: () => set({ showGroupCreateModal: false }),
  openGroupUpdateModal: () => set({ showGroupUpdateModal: true }),
  closeGroupUpdateModal: () => set({ showGroupUpdateModal: false }),
  openHolidayCreateModal: () => set({ showHolidayCreateModal: true }),
  closeHolidayCreateModal: () => set({ showHolidayCreateModal: false }),
  openDuplicateModal: () => set({ showDuplicateModal: true }),
  closeDuplicateModal: () => set({ showDuplicateModal: false }),
  openPublishModal: () => set({ showPublishModal: true }),
  closePublishModal: () => set({ showPublishModal: false }),
  openLockModal: () => set({ showLockModal: true }),
  closeLockModal: () => set({ showLockModal: false }),
  openUnlockModal: () => set({ showUnlockModal: true }),
  closeUnlockModal: () => set({ showUnlockModal: false }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setMonthFilter: (monthFilter) => set({ monthFilter }),

  reset: () => set(defaultState),
}));
