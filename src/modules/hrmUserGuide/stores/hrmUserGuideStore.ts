import { create } from 'zustand';
import type { ModuleGuideCount, UserGuide } from '../types/domain.types';
import type { GuideTabKey, GuideViewMode } from '../types/ui.types';

/**
 * Single store for the User Guide module. Deliberately smaller than the Policy
 * store — there is no approval workflow or acknowledgment state to track, so
 * this holds the library list, the rail, the open document, and the modals.
 */
interface HrmUserGuideState {
  // Library
  guides: UserGuide[];
  guidesLoading: boolean;
  moduleCounts: ModuleGuideCount[];
  moduleCountsLoading: boolean;

  // Admin list (includes DRAFT / ARCHIVED)
  adminGuides: UserGuide[];
  adminGuidesLoading: boolean;

  // Open document
  selectedGuide: UserGuide | null;
  selectedGuideLoading: boolean;

  // UI
  activeTab: GuideTabKey;
  viewMode: GuideViewMode;
  activeModuleCode: string; // '' = all modules
  searchText: string;
  adminFilterModuleCode: string;
  adminFilterStatus: string;
  showViewer: boolean;
  showFormDrawer: boolean;
  editGuide: UserGuide | null;

  // Action flags
  saving: boolean;
  deleting: boolean;

  setGuides: (guides: UserGuide[]) => void;
  setGuidesLoading: (v: boolean) => void;
  setModuleCounts: (counts: ModuleGuideCount[]) => void;
  setModuleCountsLoading: (v: boolean) => void;
  setAdminGuides: (guides: UserGuide[]) => void;
  setAdminGuidesLoading: (v: boolean) => void;
  setSelectedGuide: (guide: UserGuide | null) => void;
  setSelectedGuideLoading: (v: boolean) => void;
  setActiveTab: (tab: GuideTabKey) => void;
  setViewMode: (mode: GuideViewMode) => void;
  setActiveModuleCode: (code: string) => void;
  setSearchText: (text: string) => void;
  setAdminFilterModuleCode: (code: string) => void;
  setAdminFilterStatus: (status: string) => void;
  openViewer: (guide: UserGuide) => void;
  closeViewer: () => void;
  openFormDrawer: (guide?: UserGuide | null) => void;
  closeFormDrawer: () => void;
  setSaving: (v: boolean) => void;
  setDeleting: (v: boolean) => void;
}

export const useHrmUserGuideStore = create<HrmUserGuideState>((set) => ({
  guides: [],
  guidesLoading: false,
  moduleCounts: [],
  moduleCountsLoading: false,
  adminGuides: [],
  adminGuidesLoading: false,
  selectedGuide: null,
  selectedGuideLoading: false,

  activeTab: 'browse',
  viewMode: 'grid',
  activeModuleCode: '',
  searchText: '',
  adminFilterModuleCode: '',
  adminFilterStatus: '',
  showViewer: false,
  showFormDrawer: false,
  editGuide: null,

  saving: false,
  deleting: false,

  setGuides: (guides) => set({ guides }),
  setGuidesLoading: (guidesLoading) => set({ guidesLoading }),
  setModuleCounts: (moduleCounts) => set({ moduleCounts }),
  setModuleCountsLoading: (moduleCountsLoading) => set({ moduleCountsLoading }),
  setAdminGuides: (adminGuides) => set({ adminGuides }),
  setAdminGuidesLoading: (adminGuidesLoading) => set({ adminGuidesLoading }),
  setSelectedGuide: (selectedGuide) => set({ selectedGuide }),
  setSelectedGuideLoading: (selectedGuideLoading) => set({ selectedGuideLoading }),

  setActiveTab: (activeTab) => set({ activeTab }),
  setViewMode: (viewMode) => set({ viewMode }),
  setActiveModuleCode: (activeModuleCode) => set({ activeModuleCode }),
  setSearchText: (searchText) => set({ searchText }),
  setAdminFilterModuleCode: (adminFilterModuleCode) => set({ adminFilterModuleCode }),
  setAdminFilterStatus: (adminFilterStatus) => set({ adminFilterStatus }),

  // The list row is shown immediately while the full record (with the PDF
  // bytes) is fetched, so the viewer header never flashes empty.
  openViewer: (guide) =>
    set({ showViewer: true, selectedGuide: guide, selectedGuideLoading: true }),
  closeViewer: () => set({ showViewer: false, selectedGuide: null, selectedGuideLoading: false }),
  openFormDrawer: (guide = null) => set({ showFormDrawer: true, editGuide: guide }),
  closeFormDrawer: () => set({ showFormDrawer: false, editGuide: null }),

  setSaving: (saving) => set({ saving }),
  setDeleting: (deleting) => set({ deleting }),
}));
