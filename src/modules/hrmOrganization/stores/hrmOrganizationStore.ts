/**
 * HRM Organization Module - Zustand Store
 * Centralized state management for Company Profile, Business Units, and Departments
 */

import { create } from 'zustand';
import { parseCookies } from 'nookies';
import { HrmOrganizationService } from '../services/hrmOrganizationService';
import type {
  CompanyProfile,
  BusinessUnit,
  Department,
} from '../types/domain.types';
import type {
  MainTabKey,
  CompanyTabKey,
  CompanyProfileState,
  BusinessUnitState,
  DepartmentState,
} from '../types/ui.types';
import type { CompanyProfileRequest, BusinessUnitRequest, DepartmentRequest } from '../types/api.types';

// ============================================
// Store Interface
// ============================================
export interface HrmOrganizationState {
  activeMainTab: MainTabKey;
  companyProfile: CompanyProfileState;
  businessUnit: BusinessUnitState;
  department: DepartmentState;

  // Main Tab Actions
  setActiveMainTab: (tab: MainTabKey) => void;

  // Company Profile Actions
  setCompanyActiveTab: (tab: CompanyTabKey) => void;
  fetchCompanyProfile: () => Promise<void>;
  setCompanyDraft: (draft: Partial<CompanyProfile>) => void;
  setCompanyEditing: (isEditing: boolean) => void;
  saveCompanyProfile: () => Promise<void>;
  setCompanyError: (field: string, error: string) => void;
  clearCompanyErrors: () => void;

  // Business Unit Actions
  fetchBusinessUnits: () => Promise<void>;
  selectBusinessUnit: (bu: BusinessUnit | null) => void;
  setBusinessUnitDraft: (draft: Partial<BusinessUnit>) => void;
  setBusinessUnitCreating: (isCreating: boolean) => void;
  setBusinessUnitSearch: (text: string) => void;
  saveBusinessUnit: () => Promise<void>;
  deleteBusinessUnit: (handle: string) => Promise<void>;
  setBusinessUnitError: (field: string, error: string) => void;
  clearBusinessUnitErrors: () => void;

  // Department Actions
  fetchDepartments: (buHandle: string) => Promise<void>;
  selectDepartment: (dept: Department | null) => void;
  setDepartmentDraft: (draft: Partial<Department>) => void;
  setDepartmentCreating: (isCreating: boolean) => void;
  setDepartmentSearch: (text: string) => void;
  setDepartmentSelectedBu: (buHandle: string | null) => void;
  setDepartmentExpandedKeys: (keys: string[]) => void;
  saveDepartment: () => Promise<void>;
  deleteDepartment: (handle: string) => Promise<void>;
  setDepartmentError: (field: string, error: string) => void;
  clearDepartmentErrors: () => void;

  // Global
  reset: () => void;
}

// ============================================
// Initial State
// ============================================
const initialCompanyProfileState: CompanyProfileState = {
  data: null,
  isEditing: false,
  isLoading: false,
  isSaving: false,
  activeTab: 'identity',
  errors: {},
  draft: null,
};

const initialBusinessUnitState: BusinessUnitState = {
  list: [],
  selected: null,
  isCreating: false,
  isLoading: false,
  isSaving: false,
  searchText: '',
  errors: {},
  draft: null,
};

const initialDepartmentState: DepartmentState = {
  list: [],
  hierarchy: [],
  selected: null,
  selectedBuHandle: null,
  isCreating: false,
  isLoading: false,
  isSaving: false,
  expandedKeys: [],
  searchText: '',
  errors: {},
  draft: null,
};

// ============================================
// Helper
// ============================================
function getSite(): string {
  const cookies = parseCookies();
  return cookies.site || '';
}

function getUserId(): string {
  const cookies = parseCookies();
  return cookies.rl_user_id || cookies.userId || 'system';
}

// ============================================
// Store
// ============================================
export const useHrmOrganizationStore = create<HrmOrganizationState>((set, get) => ({
  activeMainTab: 'company',
  companyProfile: { ...initialCompanyProfileState },
  businessUnit: { ...initialBusinessUnitState },
  department: { ...initialDepartmentState },

  // ------------------------------------------
  // Main Tab
  // ------------------------------------------
  setActiveMainTab: (tab) => set({ activeMainTab: tab }),

  // ------------------------------------------
  // Company Profile
  // ------------------------------------------
  setCompanyActiveTab: (tab) =>
    set((state) => ({
      companyProfile: { ...state.companyProfile, activeTab: tab },
    })),

  fetchCompanyProfile: async () => {
    const site = getSite();
    if (!site) return;

    set((state) => ({
      companyProfile: { ...state.companyProfile, isLoading: true, errors: {} },
    }));

    try {
      const data = await HrmOrganizationService.fetchBySite(site);
      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          data,
          draft: { ...data },
          isLoading: false,
          isEditing: false,
        },
      }));
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : 'Failed to fetch company profile';
      console.error('fetchCompanyProfile error:', message);
      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          isLoading: false,
          data: null,
          draft: null,
          isEditing: true,
        },
      }));
    }
  },

  setCompanyDraft: (draft) =>
    set((state) => ({
      companyProfile: {
        ...state.companyProfile,
        draft: { ...state.companyProfile.draft, ...draft },
      },
    })),

  setCompanyEditing: (isEditing) =>
    set((state) => ({
      companyProfile: {
        ...state.companyProfile,
        isEditing,
        draft: isEditing && state.companyProfile.data
          ? { ...state.companyProfile.data }
          : state.companyProfile.draft,
      },
    })),

  saveCompanyProfile: async () => {
    const { companyProfile } = get();
    const site = getSite();
    const userId = getUserId();

    if (!companyProfile.draft || !site) return;

    set((state) => ({
      companyProfile: { ...state.companyProfile, isSaving: true, errors: {} },
    }));

    try {
      const payload: CompanyProfileRequest = {
        site,
        legalName: companyProfile.draft.legalName || '',
        tradeName: companyProfile.draft.tradeName,
        industry: companyProfile.draft.industry || '',
        incorporationDate: companyProfile.draft.incorporationDate || '',
        logoUrl: companyProfile.draft.logoUrl,
        pan: companyProfile.draft.pan,
        tan: companyProfile.draft.tan,
        cin: companyProfile.draft.cin,
        pfRegistrationNo: companyProfile.draft.pfRegistrationNo,
        esiRegistrationNo: companyProfile.draft.esiRegistrationNo,
        msmeRegistrationNo: companyProfile.draft.msmeRegistrationNo,
        ptRegistrationNo: companyProfile.draft.ptRegistrationNo,
        lwfRegistrationNo: companyProfile.draft.lwfRegistrationNo,
        bankAccounts: companyProfile.draft.bankAccounts || [],
        registeredAddress: companyProfile.draft.registeredAddress || {
          line1: '',
          city: '',
          state: '',
          pinCode: '',
          country: 'India',
        },
        corporateAddress: companyProfile.draft.corporateAddress,
        officialEmail: companyProfile.draft.officialEmail || '',
        officialPhone: companyProfile.draft.officialPhone || '',
        active: companyProfile.draft.active ?? 1,
        modifiedBy: userId,
      };

      let data: CompanyProfile;
      if (companyProfile.data?.handle) {
        data = await HrmOrganizationService.updateCompany(
          companyProfile.data.handle,
          payload
        );
      } else {
        payload.createdBy = userId;
        data = await HrmOrganizationService.createCompany(payload);
      }

      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          data,
          draft: { ...data },
          isSaving: false,
          isEditing: false,
        },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to save company profile';
      console.error('saveCompanyProfile error:', errMsg);
      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          isSaving: false,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  setCompanyError: (field, error) =>
    set((state) => ({
      companyProfile: {
        ...state.companyProfile,
        errors: { ...state.companyProfile.errors, [field]: error },
      },
    })),

  clearCompanyErrors: () =>
    set((state) => ({
      companyProfile: { ...state.companyProfile, errors: {} },
    })),

  // ------------------------------------------
  // Business Units
  // ------------------------------------------
  fetchBusinessUnits: async () => {
    const site = getSite();
    const { companyProfile } = get();
    const companyHandle = companyProfile.data?.handle;

    if (!site || !companyHandle) return;

    set((state) => ({
      businessUnit: { ...state.businessUnit, isLoading: true, errors: {} },
    }));

    try {
      const list = await HrmOrganizationService.fetchBusinessUnits(site, companyHandle);
      set((state) => ({
        businessUnit: { ...state.businessUnit, list, isLoading: false },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to fetch business units';
      console.error('fetchBusinessUnits error:', errMsg);
      set((state) => ({
        businessUnit: {
          ...state.businessUnit,
          isLoading: false,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  selectBusinessUnit: (bu) =>
    set((state) => ({
      businessUnit: {
        ...state.businessUnit,
        selected: bu,
        draft: bu ? { ...bu } : null,
        isCreating: false,
        errors: {},
      },
    })),

  setBusinessUnitDraft: (draft) =>
    set((state) => ({
      businessUnit: {
        ...state.businessUnit,
        draft: { ...state.businessUnit.draft, ...draft },
      },
    })),

  setBusinessUnitCreating: (isCreating) =>
    set((state) => ({
      businessUnit: {
        ...state.businessUnit,
        isCreating,
        selected: isCreating ? null : state.businessUnit.selected,
        draft: isCreating ? {} : state.businessUnit.draft,
        errors: {},
      },
    })),

  setBusinessUnitSearch: (text) =>
    set((state) => ({
      businessUnit: { ...state.businessUnit, searchText: text },
    })),

  saveBusinessUnit: async () => {
    const { businessUnit, companyProfile } = get();
    const site = getSite();
    const userId = getUserId();
    const companyHandle = companyProfile.data?.handle;

    if (!businessUnit.draft || !site || !companyHandle) return;

    set((state) => ({
      businessUnit: { ...state.businessUnit, isSaving: true, errors: {} },
    }));

    try {
      const payload: BusinessUnitRequest = {
        site,
        companyHandle,
        buCode: businessUnit.draft.buCode || '',
        buName: businessUnit.draft.buName || '',
        buType: businessUnit.draft.buType || '',
        state: businessUnit.draft.state || '',
        city: businessUnit.draft.city || '',
        address: businessUnit.draft.address,
        contactEmail: businessUnit.draft.contactEmail,
        contactPhone: businessUnit.draft.contactPhone,
        statutoryDetails: businessUnit.draft.statutoryDetails,
        active: businessUnit.draft.active ?? 1,
        modifiedBy: userId,
      };

      if (businessUnit.selected?.handle && !businessUnit.isCreating) {
        const updated = await HrmOrganizationService.updateBusinessUnit(
          businessUnit.selected.handle,
          payload
        );
        set((state) => ({
          businessUnit: {
            ...state.businessUnit,
            list: state.businessUnit.list.map((bu) =>
              bu.handle === updated.handle ? updated : bu
            ),
            selected: updated,
            draft: { ...updated },
            isSaving: false,
            isCreating: false,
          },
        }));
      } else {
        payload.createdBy = userId;
        const created = await HrmOrganizationService.createBusinessUnit(payload);
        set((state) => ({
          businessUnit: {
            ...state.businessUnit,
            list: [...state.businessUnit.list, created],
            selected: created,
            draft: { ...created },
            isSaving: false,
            isCreating: false,
          },
        }));
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to save business unit';
      console.error('saveBusinessUnit error:', errMsg);
      set((state) => ({
        businessUnit: {
          ...state.businessUnit,
          isSaving: false,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  deleteBusinessUnit: async (handle) => {
    const site = getSite();
    const userId = getUserId();
    if (!site) return;

    try {
      await HrmOrganizationService.deleteBusinessUnit(site, handle, userId);
      set((state) => ({
        businessUnit: {
          ...state.businessUnit,
          list: state.businessUnit.list.filter((bu) => bu.handle !== handle),
          selected:
            state.businessUnit.selected?.handle === handle
              ? null
              : state.businessUnit.selected,
          draft:
            state.businessUnit.selected?.handle === handle
              ? null
              : state.businessUnit.draft,
        },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to delete business unit';
      console.error('deleteBusinessUnit error:', errMsg);
      set((state) => ({
        businessUnit: {
          ...state.businessUnit,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  setBusinessUnitError: (field, error) =>
    set((state) => ({
      businessUnit: {
        ...state.businessUnit,
        errors: { ...state.businessUnit.errors, [field]: error },
      },
    })),

  clearBusinessUnitErrors: () =>
    set((state) => ({
      businessUnit: { ...state.businessUnit, errors: {} },
    })),

  // ------------------------------------------
  // Departments
  // ------------------------------------------
  fetchDepartments: async (buHandle) => {
    const site = getSite();
    if (!site || !buHandle) return;

    set((state) => ({
      department: {
        ...state.department,
        isLoading: true,
        errors: {},
        selectedBuHandle: buHandle,
      },
    }));

    try {
      const [list, hierarchy] = await Promise.all([
        HrmOrganizationService.fetchDepartments(site, buHandle),
        HrmOrganizationService.fetchDepartmentHierarchy(site, buHandle),
      ]);

      set((state) => ({
        department: {
          ...state.department,
          list,
          hierarchy,
          isLoading: false,
        },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to fetch departments';
      console.error('fetchDepartments error:', errMsg);
      set((state) => ({
        department: {
          ...state.department,
          isLoading: false,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  selectDepartment: (dept) =>
    set((state) => ({
      department: {
        ...state.department,
        selected: dept,
        draft: dept ? { ...dept } : null,
        isCreating: false,
        errors: {},
      },
    })),

  setDepartmentDraft: (draft) =>
    set((state) => ({
      department: {
        ...state.department,
        draft: { ...state.department.draft, ...draft },
      },
    })),

  setDepartmentCreating: (isCreating) =>
    set((state) => ({
      department: {
        ...state.department,
        isCreating,
        selected: isCreating ? null : state.department.selected,
        draft: isCreating ? {} : state.department.draft,
        errors: {},
      },
    })),

  setDepartmentSearch: (text) =>
    set((state) => ({
      department: { ...state.department, searchText: text },
    })),

  setDepartmentSelectedBu: (buHandle) =>
    set((state) => ({
      department: {
        ...state.department,
        selectedBuHandle: buHandle,
        selected: null,
        draft: null,
        list: [],
        hierarchy: [],
      },
    })),

  setDepartmentExpandedKeys: (keys) =>
    set((state) => ({
      department: { ...state.department, expandedKeys: keys },
    })),

  saveDepartment: async () => {
    const { department } = get();
    const site = getSite();
    const userId = getUserId();
    const buHandle = department.selectedBuHandle;

    if (!department.draft || !site || !buHandle) return;

    set((state) => ({
      department: { ...state.department, isSaving: true, errors: {} },
    }));

    try {
      const payload: DepartmentRequest = {
        site,
        buHandle,
        deptCode: department.draft.deptCode || '',
        deptName: department.draft.deptName || '',
        parentDeptHandle: department.draft.parentDeptHandle,
        headEmployeeHandle: department.draft.headEmployeeHandle,
        headEmployeeName: department.draft.headEmployeeName,
        active: department.draft.active ?? 1,
        modifiedBy: userId,
      };

      if (department.selected?.handle && !department.isCreating) {
        const updated = await HrmOrganizationService.updateDepartment(
          department.selected.handle,
          payload
        );
        set((state) => ({
          department: {
            ...state.department,
            list: state.department.list.map((d) =>
              d.handle === updated.handle ? updated : d
            ),
            selected: updated,
            draft: { ...updated },
            isSaving: false,
            isCreating: false,
          },
        }));
      } else {
        payload.createdBy = userId;
        const created = await HrmOrganizationService.createDepartment(payload);
        set((state) => ({
          department: {
            ...state.department,
            list: [...state.department.list, created],
            selected: created,
            draft: { ...created },
            isSaving: false,
            isCreating: false,
          },
        }));
      }

      // Refresh hierarchy after save
      const { department: updatedDept } = get();
      if (updatedDept.selectedBuHandle) {
        const hierarchy = await HrmOrganizationService.fetchDepartmentHierarchy(
          site,
          updatedDept.selectedBuHandle
        );
        set((state) => ({
          department: { ...state.department, hierarchy },
        }));
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to save department';
      console.error('saveDepartment error:', errMsg);
      set((state) => ({
        department: {
          ...state.department,
          isSaving: false,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  deleteDepartment: async (handle) => {
    const site = getSite();
    const userId = getUserId();
    if (!site) return;

    try {
      await HrmOrganizationService.deleteDepartment(site, handle, userId);

      set((state) => ({
        department: {
          ...state.department,
          list: state.department.list.filter((d) => d.handle !== handle),
          selected:
            state.department.selected?.handle === handle
              ? null
              : state.department.selected,
          draft:
            state.department.selected?.handle === handle
              ? null
              : state.department.draft,
        },
      }));

      // Refresh hierarchy after delete
      const { department } = get();
      if (department.selectedBuHandle) {
        const hierarchy = await HrmOrganizationService.fetchDepartmentHierarchy(
          site,
          department.selectedBuHandle
        );
        set((state) => ({
          department: { ...state.department, hierarchy },
        }));
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to delete department';
      console.error('deleteDepartment error:', errMsg);
      set((state) => ({
        department: {
          ...state.department,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  setDepartmentError: (field, error) =>
    set((state) => ({
      department: {
        ...state.department,
        errors: { ...state.department.errors, [field]: error },
      },
    })),

  clearDepartmentErrors: () =>
    set((state) => ({
      department: { ...state.department, errors: {} },
    })),

  // ------------------------------------------
  // Global
  // ------------------------------------------
  reset: () =>
    set({
      activeMainTab: 'company',
      companyProfile: { ...initialCompanyProfileState },
      businessUnit: { ...initialBusinessUnitState },
      department: { ...initialDepartmentState },
    }),
}));
