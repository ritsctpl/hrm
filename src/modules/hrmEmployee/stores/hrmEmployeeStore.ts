/**
 * HRM Employee Zustand Store
 * Central state management for the Employee Master module.
 * Handles directory listing, profile viewing, and onboarding wizard.
 */

import { create } from 'zustand';
import { message } from 'antd';
import { parseCookies } from 'nookies';
import { HrmEmployeeService } from '../services/hrmEmployeeService';
import { mapDirectoryRowToSummary, buildCreateRequest, validateOnboardingStep } from '../utils/transformations';
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
  viewMode: DirectoryViewMode;
  searchKeyword: string;
  departmentFilter: string | null;
  statusFilter: 'ACTIVE' | 'INACTIVE' | null;
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
  fetchDirectory: () => Promise<void>;
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
  submitOnboarding: () => Promise<void>;

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
  viewMode: 'table',
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
  activeTab: 'basic',
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

  fetchDirectory: async () => {
    const state = get();
    set({ directory: { ...state.directory, isLoading: true } });

    try {
      const site = parseCookies().site;
      if (!site) throw new Error('Site not found in cookies');

      const { searchKeyword, departmentFilter, statusFilter, buFilter, currentPage, pageSize } =
        get().directory;

      const response = searchKeyword
        ? await HrmEmployeeService.searchByKeyword(site, searchKeyword)
        : await HrmEmployeeService.fetchDirectory({
            site,
            keyword: searchKeyword || undefined,
            department: departmentFilter || undefined,
            status: statusFilter,
            businessUnit: buFilter || undefined,
            page: currentPage,
            pageSize,
          });

      const employees = (response.employees || []).map(mapDirectoryRowToSummary);

      set({
        directory: {
          ...get().directory,
          employees,
          totalCount: response.totalCount ?? employees.length,
          isLoading: false,
        },
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to fetch employees';
      message.error(msg);
      set({ directory: { ...get().directory, isLoading: false } });
    }
  },

  setViewMode: (mode) => {
    set({ directory: { ...get().directory, viewMode: mode } });
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
      const site = parseCookies().site;
      if (!site) throw new Error('Site not found in cookies');

      const data = await HrmEmployeeService.fetchProfile(site, handle);
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
      const site = parseCookies().site;
      if (!site) throw new Error('Site not found in cookies');

      const cookies = parseCookies();
      const modifiedBy = cookies.username || 'system';
      const basePayload = { site, handle: profile.handle, modifiedBy, ...data };

      let updated: EmployeeProfile | undefined;

      switch (section) {
        case 'basic':
          updated = await HrmEmployeeService.updateBasicDetails(
            basePayload as Parameters<typeof HrmEmployeeService.updateBasicDetails>[0]
          );
          break;
        case 'official':
          updated = await HrmEmployeeService.updateOfficialDetails(
            basePayload as Parameters<typeof HrmEmployeeService.updateOfficialDetails>[0]
          );
          break;
        case 'personal':
          updated = await HrmEmployeeService.updatePersonalDetails(
            basePayload as Parameters<typeof HrmEmployeeService.updatePersonalDetails>[0]
          );
          break;
        case 'contact':
          updated = await HrmEmployeeService.updateContactDetails(
            basePayload as Parameters<typeof HrmEmployeeService.updateContactDetails>[0]
          );
          break;
        default:
          throw new Error(`Unknown section: ${section}`);
      }

      if (updated) {
        set({ profile: { ...get().profile, data: updated, isSaving: false, isEditing: false } });
      } else {
        // Re-fetch profile if update response doesn't include the full profile
        await get().fetchProfile(profile.handle);
        set({ profile: { ...get().profile, isSaving: false, isEditing: false } });
      }

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
      const site = parseCookies().site;
      if (!site) throw new Error('Site not found in cookies');

      const cookies = parseCookies();
      const createdBy = cookies.username || 'system';
      const payload = buildCreateRequest(onboarding.draft, site, createdBy);

      await HrmEmployeeService.createEmployee(payload);
      message.success('Employee created successfully');

      set({ onboarding: { ...initialOnboarding } });

      // Refresh directory
      await get().fetchDirectory();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create employee';
      message.error(msg);
      set({ onboarding: { ...get().onboarding, isSaving: false } });
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
