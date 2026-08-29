/**
 * HRM Employee Zustand Store
 * Central state management for the Employee Master module.
 * Handles directory listing, profile viewing, and onboarding wizard.
 */

import { create } from 'zustand';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '../services/hrmEmployeeService';
import { mapDirectoryRowToSummary, buildCreateRequest, validateOnboardingStep, mapApiProfileToEmployeeProfile, buildUpdateContactPayload, buildUpdateBasicPayload, buildUpdatePersonalPayload, buildUpdateOfficialPayload } from '../utils/transformations';
import { DEFAULT_PAGE_SIZE } from '../utils/constants';
import type { EmployeeSummary, EmployeeProfile } from '../types/domain.types';
import type { CreateEmployeeRequest } from '../types/api.types';
import type { DirectoryFilters, DirectoryViewMode, ProfileTabKey } from '../types/ui.types';

/* ------------------------------------------------------------------ */
/*  State shape                                                        */
/* ------------------------------------------------------------------ */

interface DirectoryState {
  employees: EmployeeSummary[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  isLoading: boolean;
  /** Appending the next page in card view — distinct from a fresh load, which
      blanks the grid. */
  isLoadingMore: boolean;
  /** The server has stopped handing back new rows, so there is no page after the
      ones already loaded. Needed because totalCount alone cannot say so: a count
      that outruns what the server actually serves would otherwise keep the scroll
      sentinel asking forever, walking currentPage past the end of the results. */
  endReached: boolean;
  viewMode: DirectoryViewMode;
  searchKeyword: string;
  departmentFilter: string | null;
  statusFilter: boolean | null;
  buFilter: string | null;
}

interface ProfileState {
  data: EmployeeProfile | null;
  isLoading: boolean;
  isSaving: boolean;
  isEditing: boolean;
  activeTab: ProfileTabKey;
  errors: Record<string, string>;
}

interface OnboardingState {
  isOpen: boolean;
  currentStep: number;
  isSaving: boolean;
  draft: Partial<CreateEmployeeRequest>;
  errors: Record<string, string>;
}

export interface HrmEmployeeState {
  directory: DirectoryState;
  profile: ProfileState;
  onboarding: OnboardingState;

  // Directory actions
  fetchDirectory: (options?: { append?: boolean }) => Promise<void>;
  /** The Refresh button: reload the directory from the top. */
  refreshDirectory: () => Promise<void>;
  /** Card view: pull the next page and add it to what is already on screen. */
  loadMoreEmployees: () => Promise<void>;
  setViewMode: (mode: DirectoryViewMode) => void;
  setSearchKeyword: (keyword: string) => void;
  setFilters: (filters: Partial<DirectoryFilters>) => void;
  setPage: (page: number, pageSize?: number) => void;

  // Profile actions
  fetchProfile: (handle: string) => Promise<void>;
  setActiveTab: (tab: ProfileTabKey) => void;
  setEditing: (editing: boolean) => void;
  updateProfile: (section: string, data: Record<string, unknown>) => Promise<void>;
  clearProfile: () => void;

  // Onboarding actions
  openOnboarding: () => void;
  closeOnboarding: () => void;
  setOnboardingStep: (step: number) => void;
  updateOnboardingDraft: (data: Partial<CreateEmployeeRequest>) => void;
  submitOnboarding: () => Promise<
    | { handle: string; employeeCode?: string; fullName?: string }
    | undefined
  >;

  // Utility
  reset: () => void;
}

/* ------------------------------------------------------------------ */
/*  Initial values                                                     */
/* ------------------------------------------------------------------ */

const initialDirectory: DirectoryState = {
  employees: [],
  totalCount: 0,
  currentPage: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  isLoading: false,
  isLoadingMore: false,
  endReached: false,
  viewMode: 'card',
  searchKeyword: '',
  departmentFilter: null,
  statusFilter: null,
  buFilter: null,
};

const initialProfile: ProfileState = {
  data: null,
  isLoading: false,
  isSaving: false,
  isEditing: false,
  activeTab: 'overview',
  errors: {},
};

const initialOnboarding: OnboardingState = {
  isOpen: false,
  currentStep: 0,
  isSaving: false,
  draft: {},
  errors: {},
};

/* ------------------------------------------------------------------ */
/*  Store                                                              */
/* ------------------------------------------------------------------ */

export const useHrmEmployeeStore = create<HrmEmployeeState>((set, get) => ({
  directory: { ...initialDirectory },
  profile: { ...initialProfile },
  onboarding: { ...initialOnboarding },

  /* ---- Directory ---- */

  fetchDirectory: async (options) => {
    const append = !!options?.append;
    const state = get();
    // A fresh load empties the grid and shows a spinner; appending must not,
    // or every "load more" would flash the whole list away.
    set({
      directory: {
        ...state.directory,
        isLoading: append ? state.directory.isLoading : true,
        isLoadingMore: append,
      },
    });

    try {
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error('Site not found in cookies');

      const { searchKeyword, departmentFilter, statusFilter, buFilter, currentPage, pageSize } =
        get().directory;

      // Always use the paginated directory endpoint so keyword and the
      // dropdown filters (department / status / BU) apply together. The
      // previous short-circuit to searchByKeyword silently dropped every
      // other filter whenever the user typed in the search box.
      const response = await HrmEmployeeService.fetchDirectory({
        organizationId,
        keyword: searchKeyword || undefined,
        department: departmentFilter || undefined,
        isActive: statusFilter,
        businessUnit: buFilter || undefined,
        page: currentPage - 1, // Backend expects 0-indexed page
        size: pageSize,        // Backend expects 'size' not 'pageSize'
      });

      const employees = (response.employees || []).map(mapDirectoryRowToSummary);
      const existing = append ? get().directory.employees : [];
      // Dedupe on handle: a record added or reordered server-side between two
      // page requests can otherwise arrive twice and collide on its React key.
      const seen = new Set(existing.map((e) => e.handle));
      const merged = [...existing, ...employees.filter((e) => !seen.has(e.handle))];

      set({
        directory: {
          ...get().directory,
          employees: merged,
          totalCount: response.totalCount ?? merged.length,
          // An append that adds nothing is the end of the results, whatever
          // totalCount claims. A fresh load starts the question over.
          endReached: append ? merged.length === existing.length : false,
          isLoading: false,
          isLoadingMore: false,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch employees';
      message.error(msg);
      set({ directory: { ...get().directory, isLoading: false, isLoadingMore: false } });
    }
  },

  /**
   * The Refresh button. Always reloads from page one: the tile view walks
   * currentPage forward as you scroll, and a refresh that kept that number
   * would replace the whole grid with one mid-list slice — or, once the count
   * had run past the last page, with nothing at all.
   */
  refreshDirectory: async () => {
    set({ directory: { ...get().directory, currentPage: 1, endReached: false } });
    await get().fetchDirectory();
  },

  loadMoreEmployees: async () => {
    const d = get().directory;
    if (d.isLoading || d.isLoadingMore) return;
    // Nothing further to ask for. totalCount is the server's count, so this
    // also stops a short final page from triggering an endless fetch loop.
    if (d.totalCount > 0 && d.employees.length >= d.totalCount) return;
    // ...and this stops the same loop when the count and what the server will
    // actually serve disagree, which totalCount alone cannot detect.
    if (d.endReached) return;

    set({ directory: { ...d, currentPage: d.currentPage + 1 } });
    await get().fetchDirectory({ append: true });
    // The page we just asked for brought nothing back, so give it up rather
    // than leaving currentPage pointing past the end of the results.
    if (get().directory.endReached) {
      set({ directory: { ...get().directory, currentPage: d.currentPage } });
    }
  },

  setViewMode: (mode) => {
    const d = get().directory;
    if (d.viewMode === mode) return;
    // Back to page one on every switch. Card view accumulates pages while the
    // table shows exactly one, so carrying a page number across would leave
    // the table on page 4 or the grid showing a mid-list slice.
    set({ directory: { ...d, viewMode: mode, currentPage: 1 } });
    get().fetchDirectory();
  },

  setSearchKeyword: (keyword) => {
    set({
      directory: { ...get().directory, searchKeyword: keyword, currentPage: 1 },
    });
  },

  setFilters: (filters) => {
    set({
      directory: {
        ...get().directory,
        ...filters,
        currentPage: 1,
      },
    });
  },

  setPage: (page, pageSize) => {
    set({
      directory: {
        ...get().directory,
        currentPage: page,
        ...(pageSize !== undefined ? { pageSize } : {}),
      },
    });
    get().fetchDirectory();
  },

  /* ---- Profile ---- */

  fetchProfile: async (handle) => {
    set({ profile: { ...get().profile, isLoading: true, errors: {} } });

    try {
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error('Site not found in cookies');

      const raw = await HrmEmployeeService.fetchProfile(organizationId, handle);
      const data = mapApiProfileToEmployeeProfile(raw as unknown as Record<string, unknown>);
      set({ profile: { ...get().profile, data, isLoading: false } });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to load profile';
      message.error(msg);
      set({ profile: { ...get().profile, isLoading: false } });
    }
  },

  setActiveTab: (tab) => {
    set({ profile: { ...get().profile, activeTab: tab } });
  },

  setEditing: (editing) => {
    set({ profile: { ...get().profile, isEditing: editing, errors: {} } });
  },

  updateProfile: async (section, data) => {
    const profile = get().profile.data;
    if (!profile) return;

    set({ profile: { ...get().profile, isSaving: true, errors: {} } });

    try {
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error('Site not found in cookies');

      const cookies = parseCookies();
      const modifiedBy = cookies.username || 'system';
      const basePayload = { organizationId, handle: profile.handle, modifiedBy, ...data };

      switch (section) {
        case 'basic': {
          const basicPayload = buildUpdateBasicPayload(organizationId, profile.handle, data, modifiedBy);
          await HrmEmployeeService.updateBasicDetails(
            basicPayload as unknown as Parameters<typeof HrmEmployeeService.updateBasicDetails>[0]
          );
          break;
        }
        case 'official': {
          const officialPayload = buildUpdateOfficialPayload(organizationId, profile.handle, data, modifiedBy);
          await HrmEmployeeService.updateOfficialDetails(
            officialPayload as unknown as Parameters<typeof HrmEmployeeService.updateOfficialDetails>[0]
          );
          break;
        }
        case 'personal': {
          const personalPayload = buildUpdatePersonalPayload(organizationId, profile.handle, data, modifiedBy);
          await HrmEmployeeService.updatePersonalDetails(
            personalPayload as unknown as Parameters<typeof HrmEmployeeService.updatePersonalDetails>[0]
          );
          break;
        }
        case 'contact': {
          const contactPayload = buildUpdateContactPayload(organizationId, profile.handle, data, modifiedBy);
          await HrmEmployeeService.updateContactDetails(
            contactPayload as unknown as Parameters<typeof HrmEmployeeService.updateContactDetails>[0]
          );
          break;
        }
        default:
          throw new Error(`Unknown section: ${section}`);
      }

      // Backend returns just a handle string, not full profile — always re-fetch
      await get().fetchProfile(profile.handle);
      set({ profile: { ...get().profile, isSaving: false, isEditing: false } });

      message.success('Details updated successfully');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to update';
      message.error(msg);
      set({ profile: { ...get().profile, isSaving: false } });
    }
  },

  clearProfile: () => {
    set({ profile: { ...initialProfile } });
  },

  /* ---- Onboarding ---- */

  openOnboarding: () => {
    set({ onboarding: { ...initialOnboarding, isOpen: true } });
  },

  closeOnboarding: () => {
    set({ onboarding: { ...initialOnboarding } });
  },

  setOnboardingStep: (step) => {
    const onboarding = get().onboarding;
    // Validate current step before advancing
    if (step > onboarding.currentStep) {
      const errors = validateOnboardingStep(onboarding.currentStep, onboarding.draft);
      if (Object.keys(errors).length > 0) {
        set({ onboarding: { ...onboarding, errors } });
        return;
      }
    }
    set({ onboarding: { ...onboarding, currentStep: step, errors: {} } });
  },

  updateOnboardingDraft: (data) => {
    const onboarding = get().onboarding;
    set({
      onboarding: {
        ...onboarding,
        draft: { ...onboarding.draft, ...data },
        errors: {},
      },
    });
  },

  submitOnboarding: async () => {
    const onboarding = get().onboarding;
    set({ onboarding: { ...onboarding, isSaving: true, errors: {} } });

    try {
      const organizationId = getOrganizationId();
      if (!organizationId) throw new Error('Site not found in cookies');

      const cookies = parseCookies();
      const createdBy = cookies.username || 'system';
      
      // Fetch organization data to include in payload
      let organizationHandle: string | undefined;
      let organizationName: string | undefined;
      
      try {
        // Import organization service dynamically to avoid circular dependencies
        const { HrmOrganizationService } = await import('../../hrmOrganization/services/hrmOrganizationService');
        const companyData = await HrmOrganizationService.fetchBySite(organizationId);
        
        // Handle both single object and array responses
        const company = Array.isArray(companyData) ? companyData[0] : companyData;
        if (company) {
          organizationHandle = company.handle;
          organizationName = company.legalName || company.companyName;
        }
      } catch (orgError) {
        console.warn('Could not fetch organization data:', orgError);
        // Continue without organization data - backend may handle it
      }
      
      const payload = buildCreateRequest(onboarding.draft, organizationId, createdBy, organizationHandle, organizationName);

      const created = await HrmEmployeeService.createEmployee(payload);
      message.success('Employee created successfully');

      set({ onboarding: { ...initialOnboarding } });

      // Refresh directory
      await get().fetchDirectory();

      // Extract identifiers from the create response. Backend returns the
      // full profile shape, so employeeCode lives nested under
      // basicDetails / officialDetails — fall through both. fullName is
      // needed by callers that build composite "EMP - Name" identifiers
      // for downstream services (e.g. leave-balance/initialize, which
      // indexes balances by employeeCode and would otherwise receive the
      // UUID handle and silently store the row under the wrong key).
      const rawCreated = created as unknown as {
        handle?: string;
        employeeCode?: string;
        fullName?: string;
        basicDetails?: { employeeCode?: string; fullName?: string };
        officialDetails?: { employeeCode?: string };
      };
      if (!rawCreated?.handle) return undefined;
      return {
        handle: rawCreated.handle,
        employeeCode:
          rawCreated.employeeCode ||
          rawCreated.basicDetails?.employeeCode ||
          rawCreated.officialDetails?.employeeCode,
        fullName:
          rawCreated.fullName ||
          rawCreated.basicDetails?.fullName,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create employee';
      message.error(msg);
      set({ onboarding: { ...get().onboarding, isSaving: false } });
      return undefined;
    }
  },

  /* ---- Utility ---- */

  reset: () => {
    set({
      directory: { ...initialDirectory },
      profile: { ...initialProfile },
      onboarding: { ...initialOnboarding },
    });
  },
}));
