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
  activeTab: 'projects' | 'allocations' | 'approvals' | 'calendar' | 'reports';
  activeDetailTab: 'overview' | 'allocations' | 'milestones' | 'attachments' | 'audit';
  isProjectFormOpen: boolean;
  isAllocationFormOpen: boolean;
  searchQuery: string;
  filterBU: string;
  filterDept: string;
  filterType: string;
  filterStatus: string;
  filterPM: string;
  calendarWeekStart: string;
  calendarBU: string;
  calendarDept: string;
}

interface ProjectDataState {
  projects: Project[];
  projectKpis: { total: number; active: number; draft: number; onHold: number; completed: number };
  projectAllocations: ResourceAllocation[];
  allocationApprovals: AllocationApproval[];
  pendingAllocations: ResourceAllocation[];
  capacityCheck: CapacityCheckResult | null;
  allocationVsActual: ProjectAllocationVsActual | null;
  utilizationReport: ResourceUtilizationReport | null;
  calendarData: ResourceCalendarEmployee[];
}

interface ProjectLoadingState {
  loadingProjects: boolean;
  loadingAllocations: boolean;
  loadingApprovals: boolean;
  loadingCapacity: boolean;
  loadingCalendar: boolean;
  savingProject: boolean;
  savingAllocation: boolean;
  approvingAllocation: boolean;
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
  openAllocationForm: () => void;
  closeAllocationForm: () => void;
  setSearchQuery: (q: string) => void;
  setFilterBU: (v: string) => void;
  setFilterDept: (v: string) => void;
  setFilterType: (v: string) => void;
  setFilterStatus: (v: string) => void;
  setFilterPM: (v: string) => void;
  setCalendarWeekStart: (d: string) => void;
  setCalendarBU: (v: string) => void;
  setCalendarDept: (v: string) => void;
  setProjects: (p: Project[]) => void;
  setProjectKpis: (kpis: ProjectDataState['projectKpis']) => void;
  setProjectAllocations: (a: ResourceAllocation[]) => void;
  setAllocationApprovals: (a: AllocationApproval[]) => void;
  setPendingAllocations: (a: ResourceAllocation[]) => void;
  setCapacityCheck: (c: CapacityCheckResult | null) => void;
  setAllocationVsActual: (r: ProjectAllocationVsActual | null) => void;
  setUtilizationReport: (r: ResourceUtilizationReport | null) => void;
  setCalendarData: (data: ResourceCalendarEmployee[]) => void;
  setLoadingProjects: (v: boolean) => void;
  setLoadingAllocations: (v: boolean) => void;
  setLoadingApprovals: (v: boolean) => void;
  setLoadingCapacity: (v: boolean) => void;
  setLoadingCalendar: (v: boolean) => void;
  setSavingProject: (v: boolean) => void;
  setSavingAllocation: (v: boolean) => void;
  setApprovingAllocation: (v: boolean) => void;
  setLoadingReport: (v: boolean) => void;
  updateProjectInList: (updated: Project) => void;
  removeProjectFromList: (handle: string) => void;
  updateAllocationInList: (updated: ResourceAllocation) => void;
  removePendingAllocation: (handle: string) => void;
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
      isAllocationFormOpen: false,
      searchQuery: '',
      filterBU: '',
      filterDept: '',
      filterType: '',
      filterStatus: '',
      filterPM: '',
      calendarWeekStart: new Date().toISOString().slice(0, 10),
      calendarBU: '',
      calendarDept: '',

      projects: [],
      projectKpis: { total: 0, active: 0, draft: 0, onHold: 0, completed: 0 },
      projectAllocations: [],
      allocationApprovals: [],
      pendingAllocations: [],
      capacityCheck: null,
      allocationVsActual: null,
      utilizationReport: null,
      calendarData: [],

      loadingProjects: false,
      loadingAllocations: false,
      loadingApprovals: false,
      loadingCapacity: false,
      loadingCalendar: false,
      savingProject: false,
      savingAllocation: false,
      approvingAllocation: false,
      loadingReport: false,

      setSelectedProject: (p) => set({ selectedProject: p, activeDetailTab: 'overview' }),
      setEditingProject: (p) => set({ editingProject: p }),
      setSelectedAllocation: (a) => set({ selectedAllocation: a }),
      setActiveTab: (tab) => set({ activeTab: tab }),
      setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),
      openProjectForm: (project) => set({ isProjectFormOpen: true, editingProject: project ?? null }),
      closeProjectForm: () => set({ isProjectFormOpen: false, editingProject: null }),
      openAllocationForm: () => set({ isAllocationFormOpen: true }),
      closeAllocationForm: () => set({ isAllocationFormOpen: false }),
      setSearchQuery: (q) => set({ searchQuery: q }),
      setFilterBU: (v) => set({ filterBU: v }),
      setFilterDept: (v) => set({ filterDept: v }),
      setFilterType: (v) => set({ filterType: v }),
      setFilterStatus: (v) => set({ filterStatus: v }),
      setFilterPM: (v) => set({ filterPM: v }),
      setCalendarWeekStart: (d) => set({ calendarWeekStart: d }),
      setCalendarBU: (v) => set({ calendarBU: v }),
      setCalendarDept: (v) => set({ calendarDept: v }),
      setProjects: (projects) => set({ projects }),
      setProjectKpis: (projectKpis) => set({ projectKpis }),
      setProjectAllocations: (projectAllocations) => set({ projectAllocations }),
      setAllocationApprovals: (allocationApprovals) => set({ allocationApprovals }),
      setPendingAllocations: (pendingAllocations) => set({ pendingAllocations }),
      setCapacityCheck: (capacityCheck) => set({ capacityCheck }),
      setAllocationVsActual: (allocationVsActual) => set({ allocationVsActual }),
      setUtilizationReport: (utilizationReport) => set({ utilizationReport }),
      setCalendarData: (calendarData) => set({ calendarData }),
      setLoadingProjects: (v) => set({ loadingProjects: v }),
      setLoadingAllocations: (v) => set({ loadingAllocations: v }),
      setLoadingApprovals: (v) => set({ loadingApprovals: v }),
      setLoadingCapacity: (v) => set({ loadingCapacity: v }),
      setLoadingCalendar: (v) => set({ loadingCalendar: v }),
      setSavingProject: (v) => set({ savingProject: v }),
      setSavingAllocation: (v) => set({ savingAllocation: v }),
      setApprovingAllocation: (v) => set({ approvingAllocation: v }),
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
          pendingAllocations: state.pendingAllocations.map((a) =>
            a.handle === updated.handle ? updated : a
          ),
        })),
      removePendingAllocation: (handle) =>
        set((state) => ({
          pendingAllocations: state.pendingAllocations.filter((a) => a.handle !== handle),
        })),
    }),
    { name: 'hrmProjectStore' }
  )
);
