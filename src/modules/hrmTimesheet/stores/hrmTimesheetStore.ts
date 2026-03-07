'use client';
// src/modules/hrmTimesheet/stores/hrmTimesheetStore.ts
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  TimesheetHeader,
  TimesheetLine,
  WeeklyTimesheetSummary,
  TeamTimesheetSummary,
  UnplannedCategory,
  TimesheetApproval,
  AllocationForDay,
} from '../types/domain.types';

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(new Date(d).setDate(diff));
}

function firstDayOfMonth(d: Date): string {
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

interface TimesheetUIState {
  selectedDate: string;
  selectedWeekStart: string;
  activeTab: 'my' | 'approvals' | 'team' | 'reports';
  activeReportTab: 'payroll' | 'compliance' | 'unplanned' | 'holiday';
  selectedTimesheetHandle: string | null;
  isDayEditorOpen: boolean;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  reportDept: string;
}

interface TimesheetDataState {
  weeklyTimesheets: TimesheetHeader[];
  currentDayTimesheet: TimesheetHeader | null;
  allocationsForDay: AllocationForDay[];
  unplannedCategories: UnplannedCategory[];
  teamTimesheets: TeamTimesheetSummary[];
  pendingApprovals: TimesheetHeader[];
  approvalHistory: TimesheetApproval[];
  weekSummary: WeeklyTimesheetSummary | null;
}

interface TimesheetLoadingState {
  loadingWeek: boolean;
  loadingDay: boolean;
  loadingAllocations: boolean;
  loadingTeam: boolean;
  loadingApprovals: boolean;
  savingTimesheet: boolean;
  submittingTimesheet: boolean;
  submittingWeek: boolean;
  approvingTimesheet: boolean;
  loadingReport: boolean;
}

interface TimesheetActions {
  setSelectedDate: (d: string) => void;
  setSelectedWeekStart: (d: string) => void;
  setActiveTab: (tab: TimesheetUIState['activeTab']) => void;
  setActiveReportTab: (tab: TimesheetUIState['activeReportTab']) => void;
  setSelectedTimesheetHandle: (h: string | null) => void;
  openDayEditor: () => void;
  closeDayEditor: () => void;
  setReportPeriodStart: (d: string) => void;
  setReportPeriodEnd: (d: string) => void;
  setReportDept: (v: string) => void;

  setWeeklyTimesheets: (ts: TimesheetHeader[]) => void;
  setCurrentDayTimesheet: (ts: TimesheetHeader | null) => void;
  setAllocationsForDay: (a: AllocationForDay[]) => void;
  setUnplannedCategories: (c: UnplannedCategory[]) => void;
  setTeamTimesheets: (t: TeamTimesheetSummary[]) => void;
  setPendingApprovals: (a: TimesheetHeader[]) => void;
  setApprovalHistory: (h: TimesheetApproval[]) => void;
  setWeekSummary: (s: WeeklyTimesheetSummary | null) => void;

  setCurrentDayLines: (lines: TimesheetLine[]) => void;
  addLineToCurrentDay: (line: TimesheetLine) => void;
  removeLineFromCurrentDay: (lineId: string) => void;
  updateLineInCurrentDay: (lineId: string, partial: Partial<TimesheetLine>) => void;

  setLoadingWeek: (v: boolean) => void;
  setLoadingDay: (v: boolean) => void;
  setLoadingAllocations: (v: boolean) => void;
  setLoadingTeam: (v: boolean) => void;
  setLoadingApprovals: (v: boolean) => void;
  setSavingTimesheet: (v: boolean) => void;
  setSubmittingTimesheet: (v: boolean) => void;
  setSubmittingWeek: (v: boolean) => void;
  setApprovingTimesheet: (v: boolean) => void;
  setLoadingReport: (v: boolean) => void;
}

type HrmTimesheetStore = TimesheetUIState & TimesheetDataState & TimesheetLoadingState & TimesheetActions;

const today = new Date().toISOString().slice(0, 10);

export const useHrmTimesheetStore = create<HrmTimesheetStore>()(
  devtools(
    (set) => ({
      // UI defaults
      selectedDate: today,
      selectedWeekStart: getMonday(new Date()).toISOString().slice(0, 10),
      activeTab: 'my',
      activeReportTab: 'payroll',
      selectedTimesheetHandle: null,
      isDayEditorOpen: false,
      reportPeriodStart: firstDayOfMonth(new Date()),
      reportPeriodEnd: today,
      reportDept: '',

      // Data defaults
      weeklyTimesheets: [],
      currentDayTimesheet: null,
      allocationsForDay: [],
      unplannedCategories: [],
      teamTimesheets: [],
      pendingApprovals: [],
      approvalHistory: [],
      weekSummary: null,

      // Loading defaults
      loadingWeek: false,
      loadingDay: false,
      loadingAllocations: false,
      loadingTeam: false,
      loadingApprovals: false,
      savingTimesheet: false,
      submittingTimesheet: false,
      submittingWeek: false,
      approvingTimesheet: false,
      loadingReport: false,

      // UI actions
      setSelectedDate: (d) => set({ selectedDate: d }),
      setSelectedWeekStart: (d) => set({ selectedWeekStart: d }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveReportTab: (tab) => set({ activeReportTab: tab }),
      setSelectedTimesheetHandle: (h) => set({ selectedTimesheetHandle: h }),
      openDayEditor: () => set({ isDayEditorOpen: true }),
      closeDayEditor: () => set({ isDayEditorOpen: false }),
      setReportPeriodStart: (d) => set({ reportPeriodStart: d }),
      setReportPeriodEnd: (d) => set({ reportPeriodEnd: d }),
      setReportDept: (v) => set({ reportDept: v }),

      // Data actions
      setWeeklyTimesheets: (ts) => set({ weeklyTimesheets: ts }),
      setCurrentDayTimesheet: (ts) => set({ currentDayTimesheet: ts }),
      setAllocationsForDay: (a) => set({ allocationsForDay: a }),
      setUnplannedCategories: (c) => set({ unplannedCategories: c }),
      setTeamTimesheets: (t) => set({ teamTimesheets: t }),
      setPendingApprovals: (a) => set({ pendingApprovals: a }),
      setApprovalHistory: (h) => set({ approvalHistory: h }),
      setWeekSummary: (s) => set({ weekSummary: s }),

      setCurrentDayLines: (lines) =>
        set((state) =>
          state.currentDayTimesheet
            ? { currentDayTimesheet: { ...state.currentDayTimesheet, lines } }
            : {}
        ),
      addLineToCurrentDay: (line) =>
        set((state) =>
          state.currentDayTimesheet
            ? { currentDayTimesheet: { ...state.currentDayTimesheet, lines: [...(state.currentDayTimesheet.lines ?? []), line] } }
            : {}
        ),
      removeLineFromCurrentDay: (lineId) =>
        set((state) =>
          state.currentDayTimesheet
            ? { currentDayTimesheet: { ...state.currentDayTimesheet, lines: (state.currentDayTimesheet.lines ?? []).filter((l) => l.lineId !== lineId) } }
            : {}
        ),
      updateLineInCurrentDay: (lineId, partial) =>
        set((state) =>
          state.currentDayTimesheet
            ? { currentDayTimesheet: { ...state.currentDayTimesheet, lines: (state.currentDayTimesheet.lines ?? []).map((l) => l.lineId === lineId ? { ...l, ...partial } : l) } }
            : {}
        ),

      // Loading actions
      setLoadingWeek: (v) => set({ loadingWeek: v }),
      setLoadingDay: (v) => set({ loadingDay: v }),
      setLoadingAllocations: (v) => set({ loadingAllocations: v }),
      setLoadingTeam: (v) => set({ loadingTeam: v }),
      setLoadingApprovals: (v) => set({ loadingApprovals: v }),
      setSavingTimesheet: (v) => set({ savingTimesheet: v }),
      setSubmittingTimesheet: (v) => set({ submittingTimesheet: v }),
      setSubmittingWeek: (v) => set({ submittingWeek: v }),
      setApprovingTimesheet: (v) => set({ approvingTimesheet: v }),
      setLoadingReport: (v) => set({ loadingReport: v }),
    }),
    { name: 'hrmTimesheetStore' }
  )
);
