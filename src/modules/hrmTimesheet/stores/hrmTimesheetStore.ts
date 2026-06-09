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
  AssignedAllocation,
} from '../types/domain.types';
import type { ManagerScope, ManagerStatusFilter, ManagerTargetEmployee } from '../types/ui.types';

/** Local YYYY-MM-DD — NEVER use toISOString() here: it converts to UTC and
 *  shifts the date back a day in positive-offset timezones (e.g. IST), which
 *  made the calendar default to the previous month. */
function ymdLocal(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function getMonday(d: Date): string {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const m = new Date(d);
  m.setDate(diff);
  return ymdLocal(m);
}

function firstDayOfMonth(d: Date): string {
  return ymdLocal(new Date(d.getFullYear(), d.getMonth(), 1));
}

function mondayOf(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`); // parse as local, not UTC
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return ymdLocal(d);
}

interface TimesheetUIState {
  /** Employee tab view: month calendar (landing) -> week matrix (on date click). */
  myViewMode: 'month' | 'week';
  /** First day (YYYY-MM-01) of the month shown in the calendar. */
  selectedMonth: string;
  selectedDate: string;
  selectedWeekStart: string;
  activeTab: 'my' | 'employees' | 'reports';
  activeReportTab: 'payroll' | 'compliance' | 'unplanned' | 'holiday' | 'categories' | 'lockPeriods';
  selectedTimesheetHandle: string | null;
  isDayEditorOpen: boolean;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  reportDept: string;

  // Manager "Employee Timesheets" dashboard
  managerViewMode: 'dashboard' | 'detail';
  managerScope: ManagerScope;
  managerSearch: string;
  managerStatusFilter: ManagerStatusFilter;
}

interface TimesheetDataState {
  monthlyTimesheets: TimesheetHeader[];
  weeklyTimesheets: TimesheetHeader[];
  currentDayTimesheet: TimesheetHeader | null;
  allocationsForDay: AllocationForDay[];
  assignedAllocations: AssignedAllocation[];
  unplannedCategories: UnplannedCategory[];
  teamTimesheets: TeamTimesheetSummary[];
  pendingApprovals: TimesheetHeader[];
  approvalHistory: TimesheetApproval[];
  weekSummary: WeeklyTimesheetSummary | null;
  /** Manager drill-down: the reviewed employee + their loaded month of day-timesheets. */
  targetEmployee: ManagerTargetEmployee | null;
  targetEmployeeTimesheets: TimesheetHeader[];
}

interface TimesheetLoadingState {
  loadingMonth: boolean;
  loadingWeek: boolean;
  loadingDay: boolean;
  loadingAllocations: boolean;
  loadingTeam: boolean;
  loadingApprovals: boolean;
  loadingTargetEmployee: boolean;
  savingTimesheet: boolean;
  submittingTimesheet: boolean;
  submittingWeek: boolean;
  approvingTimesheet: boolean;
  loadingReport: boolean;
}

interface TimesheetActions {
  setMyViewMode: (m: TimesheetUIState['myViewMode']) => void;
  setSelectedMonth: (d: string) => void;
  /** Drill from calendar into the week matrix for a clicked date. */
  openWeekForDate: (date: string) => void;
  /** Return to the month calendar from the week matrix. */
  backToMonthView: () => void;
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

  setManagerScope: (s: ManagerScope) => void;
  setManagerSearch: (v: string) => void;
  setManagerStatusFilter: (f: ManagerStatusFilter) => void;
  /** Open the manager drill-down for an employee. */
  openEmployeeReview: (emp: ManagerTargetEmployee) => void;
  /** Return to the manager dashboard from the drill-down. */
  backToDashboard: () => void;
  setTargetEmployeeTimesheets: (ts: TimesheetHeader[]) => void;

  setMonthlyTimesheets: (ts: TimesheetHeader[]) => void;
  setWeeklyTimesheets: (ts: TimesheetHeader[]) => void;
  setCurrentDayTimesheet: (ts: TimesheetHeader | null) => void;
  setAllocationsForDay: (a: AllocationForDay[]) => void;
  setAssignedAllocations: (a: AssignedAllocation[]) => void;
  setUnplannedCategories: (c: UnplannedCategory[]) => void;
  setTeamTimesheets: (t: TeamTimesheetSummary[]) => void;
  setPendingApprovals: (a: TimesheetHeader[]) => void;
  setApprovalHistory: (h: TimesheetApproval[]) => void;
  setWeekSummary: (s: WeeklyTimesheetSummary | null) => void;

  setCurrentDayLines: (lines: TimesheetLine[]) => void;
  addLineToCurrentDay: (line: TimesheetLine) => void;
  removeLineFromCurrentDay: (lineId: string) => void;
  updateLineInCurrentDay: (lineId: string, partial: Partial<TimesheetLine>) => void;

  setLoadingMonth: (v: boolean) => void;
  setLoadingWeek: (v: boolean) => void;
  setLoadingDay: (v: boolean) => void;
  setLoadingAllocations: (v: boolean) => void;
  setLoadingTeam: (v: boolean) => void;
  setLoadingApprovals: (v: boolean) => void;
  setLoadingTargetEmployee: (v: boolean) => void;
  setSavingTimesheet: (v: boolean) => void;
  setSubmittingTimesheet: (v: boolean) => void;
  setSubmittingWeek: (v: boolean) => void;
  setApprovingTimesheet: (v: boolean) => void;
  setLoadingReport: (v: boolean) => void;
}

type HrmTimesheetStore = TimesheetUIState & TimesheetDataState & TimesheetLoadingState & TimesheetActions;

const today = ymdLocal(new Date());

export const useHrmTimesheetStore = create<HrmTimesheetStore>()(
  devtools(
    (set) => ({
      // UI defaults
      myViewMode: 'month',
      selectedMonth: firstDayOfMonth(new Date()),
      selectedDate: today,
      selectedWeekStart: getMonday(new Date()),
      activeTab: 'my',
      activeReportTab: 'payroll',
      selectedTimesheetHandle: null,
      isDayEditorOpen: false,
      reportPeriodStart: firstDayOfMonth(new Date()),
      reportPeriodEnd: today,
      reportDept: '',
      managerViewMode: 'dashboard',
      managerScope: 'direct',
      managerSearch: '',
      managerStatusFilter: 'ALL',

      // Data defaults
      monthlyTimesheets: [],
      weeklyTimesheets: [],
      currentDayTimesheet: null,
      allocationsForDay: [],
      assignedAllocations: [],
      unplannedCategories: [],
      teamTimesheets: [],
      pendingApprovals: [],
      approvalHistory: [],
      weekSummary: null,
      targetEmployee: null,
      targetEmployeeTimesheets: [],

      // Loading defaults
      loadingMonth: false,
      loadingWeek: false,
      loadingDay: false,
      loadingAllocations: false,
      loadingTeam: false,
      loadingApprovals: false,
      loadingTargetEmployee: false,
      savingTimesheet: false,
      submittingTimesheet: false,
      submittingWeek: false,
      approvingTimesheet: false,
      loadingReport: false,

      // UI actions
      setMyViewMode: (m) => set({ myViewMode: m }),
      setSelectedMonth: (d) => set({ selectedMonth: d }),
      openWeekForDate: (date) =>
        set({ myViewMode: 'week', selectedDate: date, selectedWeekStart: mondayOf(date) }),
      backToMonthView: () => set({ myViewMode: 'month' }),
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

      setManagerScope: (s) => set({ managerScope: s }),
      setManagerSearch: (v) => set({ managerSearch: v }),
      setManagerStatusFilter: (f) => set({ managerStatusFilter: f }),
      openEmployeeReview: (emp) =>
        set((state) => ({
          managerViewMode: 'detail',
          targetEmployee: emp,
          targetEmployeeTimesheets: [],
          // Align the drill-down period to the week the manager was viewing, so
          // the monthly grid loads/renders the month that actually has data.
          selectedDate: state.selectedWeekStart,
          selectedMonth: firstDayOfMonth(new Date(state.selectedWeekStart)),
        })),
      backToDashboard: () => set({ managerViewMode: 'dashboard', targetEmployee: null }),
      setTargetEmployeeTimesheets: (ts) => set({ targetEmployeeTimesheets: ts }),

      // Data actions
      setMonthlyTimesheets: (ts) => set({ monthlyTimesheets: ts }),
      setWeeklyTimesheets: (ts) => set({ weeklyTimesheets: ts }),
      setCurrentDayTimesheet: (ts) => set({ currentDayTimesheet: ts }),
      setAllocationsForDay: (a) => set({ allocationsForDay: a }),
      setAssignedAllocations: (a) => set({ assignedAllocations: a }),
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
      setLoadingMonth: (v) => set({ loadingMonth: v }),
      setLoadingWeek: (v) => set({ loadingWeek: v }),
      setLoadingDay: (v) => set({ loadingDay: v }),
      setLoadingAllocations: (v) => set({ loadingAllocations: v }),
      setLoadingTeam: (v) => set({ loadingTeam: v }),
      setLoadingApprovals: (v) => set({ loadingApprovals: v }),
      setLoadingTargetEmployee: (v) => set({ loadingTargetEmployee: v }),
      setSavingTimesheet: (v) => set({ savingTimesheet: v }),
      setSubmittingTimesheet: (v) => set({ submittingTimesheet: v }),
      setSubmittingWeek: (v) => set({ submittingWeek: v }),
      setApprovingTimesheet: (v) => set({ approvingTimesheet: v }),
      setLoadingReport: (v) => set({ loadingReport: v }),
    }),
    { name: 'hrmTimesheetStore' }
  )
);
