import { create } from 'zustand';
import type {
  Ticket,
  TicketCategory,
  TicketDashboard,
  TicketSummary,
  TicketSupportGroup,
} from '../types/domain.types';
import type {
  TicketActionKind,
  TicketFilterState,
  TicketTabKey,
} from '../types/ui.types';
import { DEFAULT_PAGE_SIZE, OPEN_STATUSES } from '../utils/ticketConstants';

/**
 * Single store for the ticket module.
 *
 * Filters are held per tab rather than globally. My Tickets and the group queue are two different
 * questions — a status filter set while triaging the queue has no business narrowing the list of
 * one's own tickets, and a shared filter object made every tab switch look like a bug.
 */
const baseFilter = (overrides: Partial<TicketFilterState> = {}): TicketFilterState => ({
  scope: 'MY',
  statuses: [],
  priorities: [],
  categoryCodes: [],
  supportGroupCode: undefined,
  searchText: '',
  openOnly: true,
  unassignedOnly: false,
  slaBreachedOnly: false,
  page: 0,
  size: DEFAULT_PAGE_SIZE,
  sortBy: 'lastActivityAt',
  sortDirection: 'DESC',
  ...overrides,
});

interface HrmTicketState {
  // Lists, one slot per queue tab
  rows: TicketSummary[];
  rowsLoading: boolean;
  totalElements: number;
  statusCounts: Record<string, number>;
  breachedCount: number;

  filters: Record<TicketTabKey, TicketFilterState>;

  // Open ticket
  selectedTicket: Ticket | null;
  selectedLoading: boolean;
  detailOpen: boolean;

  // Configuration
  categories: TicketCategory[];
  categoriesLoading: boolean;
  supportGroups: TicketSupportGroup[];
  supportGroupsLoading: boolean;
  assignableAgents: string[];

  dashboard: TicketDashboard | null;
  dashboardLoading: boolean;

  // UI
  activeTab: TicketTabKey;
  showRaiseDrawer: boolean;
  editTicket: Ticket | null;
  activeAction: TicketActionKind;
  showCategoryDrawer: boolean;
  editCategory: TicketCategory | null;
  showGroupDrawer: boolean;
  editGroup: TicketSupportGroup | null;

  saving: boolean;
  acting: boolean;

  setRows: (rows: TicketSummary[], total: number) => void;
  setRowsLoading: (v: boolean) => void;
  setCounts: (statusCounts: Record<string, number>, breached: number) => void;
  patchFilter: (tab: TicketTabKey, patch: Partial<TicketFilterState>) => void;
  resetFilter: (tab: TicketTabKey) => void;

  setSelectedTicket: (ticket: Ticket | null) => void;
  setSelectedLoading: (v: boolean) => void;
  openDetail: (ticket?: Ticket | null) => void;
  closeDetail: () => void;

  setCategories: (categories: TicketCategory[]) => void;
  setCategoriesLoading: (v: boolean) => void;
  setSupportGroups: (groups: TicketSupportGroup[]) => void;
  setSupportGroupsLoading: (v: boolean) => void;
  setAssignableAgents: (agents: string[]) => void;

  setDashboard: (dashboard: TicketDashboard | null) => void;
  setDashboardLoading: (v: boolean) => void;

  setActiveTab: (tab: TicketTabKey) => void;
  openRaiseDrawer: (ticket?: Ticket | null) => void;
  closeRaiseDrawer: () => void;
  setActiveAction: (action: TicketActionKind) => void;
  openCategoryDrawer: (category?: TicketCategory | null) => void;
  closeCategoryDrawer: () => void;
  openGroupDrawer: (group?: TicketSupportGroup | null) => void;
  closeGroupDrawer: () => void;

  setSaving: (v: boolean) => void;
  setActing: (v: boolean) => void;
}

export const useHrmTicketStore = create<HrmTicketState>((set) => ({
  rows: [],
  rowsLoading: false,
  totalElements: 0,
  statusCounts: {},
  breachedCount: 0,

  filters: {
    my: baseFilter({ scope: 'MY' }),
    // The queue opens on unresolved work only — a triage screen that starts by showing
    // everything ever closed is one filter away from useful and nobody sets it.
    queue: baseFilter({ scope: 'GROUP', statuses: OPEN_STATUSES, sortBy: 'resolutionDueAt', sortDirection: 'ASC' }),
    assigned: baseFilter({ scope: 'ASSIGNED', statuses: OPEN_STATUSES }),
    all: baseFilter({ scope: 'ALL', openOnly: false }),
    categories: baseFilter(),
    groups: baseFilter(),
    dashboard: baseFilter(),
  },

  selectedTicket: null,
  selectedLoading: false,
  detailOpen: false,

  categories: [],
  categoriesLoading: false,
  supportGroups: [],
  supportGroupsLoading: false,
  assignableAgents: [],

  dashboard: null,
  dashboardLoading: false,

  activeTab: 'my',
  showRaiseDrawer: false,
  editTicket: null,
  activeAction: null,
  showCategoryDrawer: false,
  editCategory: null,
  showGroupDrawer: false,
  editGroup: null,

  saving: false,
  acting: false,

  setRows: (rows, totalElements) => set({ rows, totalElements }),
  setRowsLoading: (rowsLoading) => set({ rowsLoading }),
  setCounts: (statusCounts, breachedCount) => set({ statusCounts, breachedCount }),

  patchFilter: (tab, patch) =>
    set((state) => ({
      filters: {
        ...state.filters,
        // Any change other than paging returns to page one: keeping page 4 after narrowing a
        // filter shows an empty table on a result set that has plenty of rows.
        [tab]: { ...state.filters[tab], ...patch, ...('page' in patch ? {} : { page: 0 }) },
      },
    })),
  resetFilter: (tab) =>
    set((state) => ({ filters: { ...state.filters, [tab]: baseFilter(state.filters[tab]) } })),

  setSelectedTicket: (selectedTicket) => set({ selectedTicket }),
  setSelectedLoading: (selectedLoading) => set({ selectedLoading }),

  // The list row is shown immediately while the full record loads, so the detail header never
  // flashes empty on open.
  openDetail: (ticket = null) =>
    set({ detailOpen: true, selectedTicket: ticket, selectedLoading: true }),
  closeDetail: () =>
    set({ detailOpen: false, selectedTicket: null, selectedLoading: false, activeAction: null }),

  setCategories: (categories) => set({ categories }),
  setCategoriesLoading: (categoriesLoading) => set({ categoriesLoading }),
  setSupportGroups: (supportGroups) => set({ supportGroups }),
  setSupportGroupsLoading: (supportGroupsLoading) => set({ supportGroupsLoading }),
  setAssignableAgents: (assignableAgents) => set({ assignableAgents }),

  setDashboard: (dashboard) => set({ dashboard }),
  setDashboardLoading: (dashboardLoading) => set({ dashboardLoading }),

  setActiveTab: (activeTab) => set({ activeTab }),
  openRaiseDrawer: (ticket = null) => set({ showRaiseDrawer: true, editTicket: ticket }),
  closeRaiseDrawer: () => set({ showRaiseDrawer: false, editTicket: null }),
  setActiveAction: (activeAction) => set({ activeAction }),
  openCategoryDrawer: (category = null) =>
    set({ showCategoryDrawer: true, editCategory: category }),
  closeCategoryDrawer: () => set({ showCategoryDrawer: false, editCategory: null }),
  openGroupDrawer: (group = null) => set({ showGroupDrawer: true, editGroup: group }),
  closeGroupDrawer: () => set({ showGroupDrawer: false, editGroup: null }),

  setSaving: (saving) => set({ saving }),
  setActing: (acting) => set({ acting }),
}));
