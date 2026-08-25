'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Project,
  ResourceAllocation,
  AllocationApproval,
  CapacityCheckResult,
  ProjectAllocationVsActual,
  ResourceUtilizationReport,
  ResourceCalendarEmployee,
} from '../types/domain.types';

interface ProjectUIState {
  selectedProject: Project | null;
  editingProject: Project | null;
  selectedAllocation: ResourceAllocation | null;
  activeTab: 'projects' | 'approvals' | 'calendar' | 'reports';
  activeDetailTab: 'overview' | 'tasks' | 'allocations' | 'milestones' | 'attachments' | 'audit';
  isProjectFormOpen: boolean;
  isOverviewEditing: boolean;
  isAllocationFormOpen: boolean;
  allocationPrefill: { employeeId: string; employeeName: string; role?: string; bookingType?: string; startDate?: string; endDate?: string } | null;
  isClientDrawerOpen: boolean;
  searchQuery: string;
  filterBU: string;
  filterDept: string;
  filterType: string;
  filterStatus: string;
  filterPM: string;
  filterClient: string;
  calendarWeekStart: string;
  calendarBU: string;
  calendarDept: string;
}

interface ProjectDataState {
  projects: Project[];
  projectKpis: { total: number; active: number; draft: number; onHold: number; completed: number };
  projectAllocations: ResourceAllocation[];
  allocationApprovals: AllocationApproval[];
  capacityCheck: CapacityCheckResult | null;
  allocationVsActual: ProjectAllocationVsActual | null;
  utilizationReport: ResourceUtilizationReport | null;
  calendarData: ResourceCalendarEmployee[];
}

interface ProjectLoadingState {
  loadingProjects: boolean;
  loadingAllocations: boolean;
  loadingCapacity: boolean;
  loadingCalendar: boolean;
  savingProject: boolean;
  savingAllocation: boolean;
  loadingReport: boolean;
}

interface ProjectActions {
  setSelectedProject: (p: Project | null) => void;
  setEditingProject: (p: Project | null) => void;
  setSelectedAllocation: (a: ResourceAllocation | null) => void;
  setActiveTab: (tab: ProjectUIState['activeTab']) => void;
  setActiveDetailTab: (tab: ProjectUIState['activeDetailTab']) => void;
  openProjectForm: (project?: Project) => void;
  closeProjectForm: () => void;
  setOverviewEditing: (v: boolean) => void;
  openAllocationForm: (prefill?: { employeeId: string; employeeName: string; role?: string; bookingType?: string; startDate?: string; endDate?: string }) => void;
  closeAllocationForm: () => void;
  openClientDrawer: () => void;
  closeClientDrawer: () => void;
  setSearchQuery: (q: string) => void;
  setFilterBU: (v: string) => void;
  setFilterDept: (v: string) => void;
  setFilterType: (v: string) => void;
  setFilterStatus: (v: string) => void;
  setFilterPM: (v: string) => void;
  setFilterClient: (v: string) => void;
  setCalendarWeekStart: (d: string) => void;
  setCalendarBU: (v: string) => void;
  setCalendarDept: (v: string) => void;
  setProjects: (p: Project[]) => void;
  setProjectKpis: (kpis: ProjectDataState['projectKpis']) => void;
  setProjectAllocations: (a: ResourceAllocation[]) => void;
  setAllocationApprovals: (a: AllocationApproval[]) => void;
  setCapacityCheck: (c: CapacityCheckResult | null) => void;
  setAllocationVsActual: (r: ProjectAllocationVsActual | null) => void;
  setUtilizationReport: (r: ResourceUtilizationReport | null) => void;
  setCalendarData: (data: ResourceCalendarEmployee[]) => void;
  setLoadingProjects: (v: boolean) => void;
  setLoadingAllocations: (v: boolean) => void;
  setLoadingCapacity: (v: boolean) => void;
  setLoadingCalendar: (v: boolean) => void;
  setSavingProject: (v: boolean) => void;
  setSavingAllocation: (v: boolean) => void;
  setLoadingReport: (v: boolean) => void;
  updateProjectInList: (updated: Project) => void;
  removeProjectFromList: (handle: string) => void;
  updateAllocationInList: (updated: ResourceAllocation) => void;
}

type HrmProjectStore = ProjectUIState & ProjectDataState & ProjectLoadingState & ProjectActions;

export const useHrmProjectStore = create<HrmProjectStore>()(
  devtools(
    (set) => ({
      selectedProject: null,
      editingProject: null,
      selectedAllocation: null,
      activeTab: 'projects',
      activeDetailTab: 'overview',
      isProjectFormOpen: false,
      isOverviewEditing: false,
      isAllocationFormOpen: false,
      allocationPrefill: null,
      isClientDrawerOpen: false,
      searchQuery: '',
      filterBU: '',
      filterDept: '',
      filterType: '',
      filterStatus: '',
      filterPM: '',
      filterClient: '',
      calendarWeekStart: new Date().toISOString().slice(0, 10),
      calendarBU: '',
      calendarDept: '',

      projects: [],
      projectKpis: { total: 0, active: 0, draft: 0, onHold: 0, completed: 0 },
      projectAllocations: [],
      allocationApprovals: [],
      capacityCheck: null,
      allocationVsActual: null,
      utilizationReport: null,
      calendarData: [],

      loadingProjects: false,
      loadingAllocations: false,
      loadingCapacity: false,
      loadingCalendar: false,
      savingProject: false,
      savingAllocation: false,
      loadingReport: false,

      setSelectedProject: (p) => set((state) => ({
        selectedProject: p,
        // keep the current tab when refreshing the same project; reset to overview only
        // when opening a different project (or clearing the selection)
        activeDetailTab: p && state.selectedProject?.handle === p.handle ? state.activeDetailTab : 'overview',
        // leave inline edit mode when switching to a different project / closing
        isOverviewEditing: p && state.selectedProject?.handle === p.handle ? state.isOverviewEditing : false,
      })),
      setEditingProject: (p) => set({ editingProject: p }),
      setSelectedAllocation: (a) => set({ selectedAllocation: a }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
      openProjectForm: (project) => set({ isProjectFormOpen: true, editingProject: project ?? null }),
      closeProjectForm: () => set({ isProjectFormOpen: false, editingProject: null }),
      setOverviewEditing: (v) => set({ isOverviewEditing: v }),
      openAllocationForm: (prefill) => set({ isAllocationFormOpen: true, capacityCheck: null, allocationPrefill: prefill ?? null }),
      closeAllocationForm: () => set({ isAllocationFormOpen: false, capacityCheck: null, allocationPrefill: null }),
      openClientDrawer: () => set({ isClientDrawerOpen: true }),
      closeClientDrawer: () => set({ isClientDrawerOpen: false }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterBU: (v) => set({ filterBU: v }),
      setFilterDept: (v) => set({ filterDept: v }),
      setFilterType: (v) => set({ filterType: v }),
      setFilterStatus: (v) => set({ filterStatus: v }),
      setFilterPM: (v) => set({ filterPM: v }),
      setFilterClient: (v) => set({ filterClient: v }),
      setCalendarWeekStart: (d) => set({ calendarWeekStart: d }),
      setCalendarBU: (v) => set({ calendarBU: v }),
      setCalendarDept: (v) => set({ calendarDept: v }),
      setProjects: (projects) => set({ projects }),
      setProjectKpis: (projectKpis) => set({ projectKpis }),
      setProjectAllocations: (projectAllocations) => set({ projectAllocations }),
      setAllocationApprovals: (allocationApprovals) => set({ allocationApprovals }),
      setCapacityCheck: (capacityCheck) => set({ capacityCheck }),
      setAllocationVsActual: (allocationVsActual) => set({ allocationVsActual }),
      setUtilizationReport: (utilizationReport) => set({ utilizationReport }),
      setCalendarData: (calendarData) => set({ calendarData }),
      setLoadingProjects: (v) => set({ loadingProjects: v }),
      setLoadingAllocations: (v) => set({ loadingAllocations: v }),
      setLoadingCapacity: (v) => set({ loadingCapacity: v }),
      setLoadingCalendar: (v) => set({ loadingCalendar: v }),
      setSavingProject: (v) => set({ savingProject: v }),
      setSavingAllocation: (v) => set({ savingAllocation: v }),
      setLoadingReport: (v) => set({ loadingReport: v }),
      updateProjectInList: (updated) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.handle === updated.handle ? updated : p)),
          selectedProject: state.selectedProject?.handle === updated.handle ? updated : state.selectedProject,
        })),
      removeProjectFromList: (handle) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.handle !== handle),
          selectedProject: state.selectedProject?.handle === handle ? null : state.selectedProject,
        })),
      updateAllocationInList: (updated) =>
        set((state) => ({
          projectAllocations: state.projectAllocations.map((a) =>
            a.handle === updated.handle ? updated : a
          ),
        })),
    }),
    { name: 'hrmProjectStore' }
  )
);
