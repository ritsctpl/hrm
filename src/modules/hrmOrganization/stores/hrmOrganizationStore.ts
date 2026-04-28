/**
 * HRM Organization Module - Zustand Store
 * Centralized state management with list-first drill-down pattern
 */

import { create } from 'zustand';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmOrganizationService } from '../services/hrmOrganizationService';
import { validateCompanyProfile, validateBusinessUnit } from '../utils/validations';
import type {
  CompanyProfile,
  BusinessUnit,
  Department,
  Location,
  OrgHierarchy,
  OrgAuditLogEntry,
  DataCompletenessRow,
} from '../types/domain.types';
import type {
  MainView,
  DetailTabKey,
  CompanyTabKey,
  CompanyProfileState,
  CompanyListState,
  CompanyListItem,
  BusinessUnitState,
  DepartmentState,
  LocationState,
  HierarchyState,
} from '../types/ui.types';
import type { CompanyProfileRequest, BusinessUnitRequest, DepartmentRequest, LocationRequest } from '../types/api.types';

// ============================================
// Store Interface
// ============================================
export interface HrmOrganizationState {
  // View navigation
  view: MainView;
  activeDetailTab: DetailTabKey;
  selectedCompanyHandle: string | null;

  // Company list (for list view)
  companyList: CompanyListState;

  // Existing sub-states
  companyProfile: CompanyProfileState;
  businessUnit: BusinessUnitState;
  department: DepartmentState;
  location: LocationState;
  hierarchy: HierarchyState;

  // Audit & Reports
  auditLog: { entries: OrgAuditLogEntry[]; isLoading: boolean; entityTypeFilter: string; entityHandleFilter: string };
  dataCompleteness: { rows: DataCompletenessRow[]; isLoading: boolean };

  // Navigation Actions
  navigateToList: () => void;
  navigateToDetail: (companyHandle: string) => void;
  setActiveDetailTab: (tab: DetailTabKey) => void;

  // Company List Actions
  fetchCompanyList: () => Promise<void>;
  setCompanyListSearch: (text: string) => void;
  deleteCompany: (handle: string) => Promise<void>;

  // Company Profile Actions
  setCompanyActiveTab: (tab: CompanyTabKey) => void;
  fetchCompanyProfile: (handle?: string) => Promise<void>;
  setCompanyDraft: (draft: Partial<CompanyProfile>) => void;
  setCompanyEditing: (isEditing: boolean) => void;
  saveCompanyProfile: () => Promise<void>;
  setCompanyError: (field: string, error: string) => void;
  clearCompanyErrors: () => void;
  setSameAsRegisteredOffice: (value: boolean) => void;

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

  // Location Actions
  fetchLocations: () => Promise<void>;
  selectLocation: (loc: Location | null) => void;
  setLocationDraft: (draft: Partial<Location>) => void;
  setLocationCreating: (isCreating: boolean) => void;
  setLocationSearch: (text: string) => void;
  saveLocation: () => Promise<void>;
  deleteLocation: (id: string) => Promise<void>;
  setLocationError: (field: string, error: string) => void;
  clearLocationErrors: () => void;

  // Hierarchy Actions
  fetchHierarchy: () => Promise<void>;

  // Audit Log Actions
  fetchAuditLog: (entityType?: string, entityHandle?: string) => Promise<void>;
  setAuditEntityTypeFilter: (t: string) => void;
  setAuditEntityHandleFilter: (h: string) => void;

  // Data Completeness Actions
  fetchDataCompleteness: (entityType?: string) => Promise<void>;

  // Global
  reset: () => void;
}

// ============================================
// Initial State
// ============================================
const initialCompanyListState: CompanyListState = {
  items: [],
  isLoading: false,
  searchText: '',
};

const initialCompanyProfileState: CompanyProfileState = {
  data: null,
  isEditing: false,
  isLoading: false,
  isSaving: false,
  activeTab: 'identity',
  errors: {},
  draft: null,
  sameAsRegisteredOffice: false,
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

const initialLocationState: LocationState = {
  list: [],
  selected: null,
  isCreating: false,
  isLoading: false,
  isSaving: false,
  searchText: '',
  errors: {},
  draft: null,
};

const initialHierarchyState: HierarchyState = {
  data: null,
  isLoading: false,
};

// ============================================
// Helper
// ============================================
// getSite removed — use getOrganizationId() from cookieUtils

function getUserId(): string {
  const cookies = parseCookies();
  return cookies.rl_user_id || cookies.userId || 'system';
}

/**
 * Resolve the org id to scope a request by. Prefers the company being
 * viewed (companyProfile.data) over the global header selection in the
 * `site` cookie. When the user is on Company A's detail page but the
 * header still shows Company B, fetches inside this store should follow
 * Company A — not B.
 *
 * Falls back through:
 *   companyProfile.data.organizationId  →
 *   companyProfile.data.site            →
 *   cookie organizationId
 *
 * Pass the store's `get()` so the helper can read latest companyProfile.
 */
function getScopingOrgId(
  get: () => HrmOrganizationState,
): string {
  const data = get().companyProfile.data as
    | (CompanyProfile & { organizationId?: string })
    | null;
  return (
    data?.organizationId ||
    data?.site ||
    getOrganizationId()
  );
}

// Extract a user-friendly message from an Axios / fetch error thrown by the
// service layer. Prefers the backend's structured `message_details.msg`
// (which carries the specific reason — e.g. "CIN already registered:
// U12345…") over a generic fallback. Falls back to a friendly message only
// when the backend returns nothing structured.
function describeCompanyConflict(error: unknown): string | null {
  const anyErr = error as {
    response?: {
      status?: number;
      data?: {
        message?: string;
        message_details?: { msg_type?: string; msg?: string };
      } | string;
    };
    message?: string;
  };
  const status = anyErr?.response?.status;
  const data = anyErr?.response?.data;

  // Preferred: backend's structured error with the specific reason.
  if (data && typeof data === 'object') {
    const detailMsg = data.message_details?.msg;
    if (detailMsg) return detailMsg;
  }

  const flatMsg =
    (typeof data === 'string' ? data : '') ||
    (typeof data === 'object' && data ? data.message : undefined) ||
    anyErr?.message ||
    '';
  const haystack = flatMsg.toLowerCase();
  const isConflict = status === 409 || /already|exists|duplicate/.test(haystack);
  if (!isConflict) return null;
  return 'A company with this name or identifier already exists in this organization. Please use a different legal name / PAN.';
}

// ============================================
// Store
// ============================================
export const useHrmOrganizationStore = create<HrmOrganizationState>((set, get) => ({
  // View navigation
  view: 'list' as MainView,
  activeDetailTab: 'profile' as DetailTabKey,
  selectedCompanyHandle: null,

  // Company list
  companyList: { ...initialCompanyListState },

  // Sub-states
  companyProfile: { ...initialCompanyProfileState },
  businessUnit: { ...initialBusinessUnitState },
  department: { ...initialDepartmentState },
  location: { ...initialLocationState },
  hierarchy: { ...initialHierarchyState },

  // Audit & Reports
  auditLog: { entries: [], isLoading: false, entityTypeFilter: 'COMPANY_PROFILE', entityHandleFilter: '' },
  dataCompleteness: { rows: [], isLoading: false },

  // ------------------------------------------
  // Navigation
  // ------------------------------------------
  navigateToList: () =>
    set({
      view: 'list',
      selectedCompanyHandle: null,
      activeDetailTab: 'profile',
      companyProfile: { ...initialCompanyProfileState },
      businessUnit: { ...initialBusinessUnitState },
      department: { ...initialDepartmentState },
      location: { ...initialLocationState },
      hierarchy: { ...initialHierarchyState },
    }),

  navigateToDetail: (companyHandle) =>
    set((state) => {
      if (companyHandle === 'new') {
        return {
          view: 'detail',
          selectedCompanyHandle: companyHandle,
          activeDetailTab: 'profile',
          companyProfile: {
            ...state.companyProfile,
            data: null,
            draft: {
              ...(state.companyProfile.draft || {}),
              financialYearStartMonth: 'April',
              financialYearEndMonth: 'March',
            },
            isEditing: true,
            errors: {},
          },
        };
      }
      return {
        view: 'detail',
        selectedCompanyHandle: companyHandle,
        activeDetailTab: 'profile',
      };
    }),

  setActiveDetailTab: (tab) => set({ activeDetailTab: tab }),

  // ------------------------------------------
  // Company List
  // ------------------------------------------
  fetchCompanyList: async () => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;

    set((state) => ({
      companyList: { ...state.companyList, isLoading: true },
    }));

    try {
      // Backend now supports multi-company per organization. Try the new
      // retrieveAll endpoint first; fall back to the single-company
      // retrieveBySite for older backends.
      let data: unknown;
      try {
        data = await HrmOrganizationService.fetchAllCompanies(organizationId);
      } catch {
        data = await HrmOrganizationService.fetchBySite(organizationId);
      }

      const rawItems = Array.isArray(data) ? data : data ? [data] : [];
      const items = rawItems as unknown as CompanyListItem[];
      set((state) => ({
        companyList: { ...state.companyList, items, isLoading: false },
      }));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to load companies';
      console.error('fetchCompanies error:', errMsg);
      set((state) => ({
        companyList: { ...state.companyList, items: [], isLoading: false, error: errMsg },
      }));
    }
  },

  setCompanyListSearch: (text) =>
    set((state) => ({
      companyList: { ...state.companyList, searchText: text },
    })),

  deleteCompany: async (handle) => {
    const organizationId = getOrganizationId();
    const userId = getUserId();
    if (!organizationId || !userId) return;

    try {
      const response = await HrmOrganizationService.deleteCompany(organizationId, handle, userId);
      
      // Check if response has error code or error message
      if (response?.errorCode || response?.message_details?.msg_type === 'E') {
        const errorMsg = response?.message_details?.msg || 'Failed to delete company';
        throw new Error(errorMsg);
      }
      
      set((state) => ({
        companyList: {
          ...state.companyList,
          items: state.companyList.items.filter((c) => c.handle !== handle),
        },
      }));
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to delete company';
      console.error('deleteCompany error:', errorMsg);
      throw new Error(errorMsg);
    }
  },

  // ------------------------------------------
  // Company Profile
  // ------------------------------------------
  setCompanyActiveTab: (tab) =>
    set((state) => ({
      companyProfile: { ...state.companyProfile, activeTab: tab },
    })),

  fetchCompanyProfile: async (handle?: string) => {
    const organizationId = getOrganizationId();
    const targetHandle = handle || get().selectedCompanyHandle;
    if (!organizationId || !targetHandle) return;

    set((state) => ({
      companyProfile: { ...state.companyProfile, isLoading: true, errors: {} },
    }));

    try {
      const data = await HrmOrganizationService.fetchCompanyByHandle(organizationId, targetHandle);
      
      // If logoBase64 contains base64 (starts with data:), use it as logoUrl for preview
      const processedData = { ...data };
      if (data.logoBase64 && data.logoBase64.startsWith('data:')) {
        processedData.logoUrl = data.logoBase64;
      }
      // Normalize API field names for consistent form binding
      // Backend may return 'gstin' or 'gstIn', normalize to 'gstIn' for UI
      if (processedData.gstin && !processedData.gstIn) {
        processedData.gstIn = processedData.gstin;
      }
      
      // Auto-detect "same as registered" so the checkbox reflects stored
      // reality on load. Deep-compare the five UI-relevant address fields;
      // if both addresses are non-empty and equal, mirror mode is assumed.
      const reg: any = processedData?.registeredOfficeAddress || (processedData as any)?.registeredAddress;
      const corp: any = processedData?.corporateOfficeAddress || (processedData as any)?.corporateAddress;
      const serialize = (a: any) => a
        ? JSON.stringify({ line1: a.line1 || '', city: a.city || '', state: a.state || '', pincode: a.pincode || '', country: a.country || '' })
        : '';
      const sameAsRegisteredOffice =
        !!reg && !!corp && serialize(reg) !== '' && serialize(reg) === serialize(corp);

      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          data: processedData,
          draft: { ...processedData },
          sameAsRegisteredOffice,
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
    const { companyProfile, selectedCompanyHandle } = get();
    const organizationId = getOrganizationId();
    const userId = getUserId();

    if (!companyProfile.draft || !organizationId) return;

    // Validate before saving
    const validationErrors = validateCompanyProfile(companyProfile.draft);
    if (Object.keys(validationErrors).length > 0) {
      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          isSaving: false,
          errors: validationErrors,
        },
      }));
      return;
    }

    set((state) => ({
      companyProfile: { ...state.companyProfile, isSaving: true, errors: {} },
    }));

    try {
      // Prepare bank accounts array with proper format (use backend field names: branch, ifsc)
      const bankAccounts = (companyProfile.draft.bankAccounts || []).map((account: any) => ({
        bankName: account.bankName || '',
        branch: account.branch || account.branchName || '',
        ifsc: account.ifsc || account.ifscCode || '',
        accountNumber: account.accountNumber || '',
        accountType: (account.accountType || 'CURRENT').toUpperCase(),
        isPrimary: account.isPrimary || false,
      }));

      // Prepare registered office address.
      // NOTE: Whitelist backend-facing fields here. DO NOT switch to
      // `{ ...registeredAddress }` — the draft carries derived fields
      // (`_verifiedState`, `_verifiedCity`, `_verifiedPincode`) stamped by
      // OrgAddressFields for frontend cross-validation only; they must never
      // leak to the backend contract.
      const registeredAddress = (companyProfile.draft.registeredOfficeAddress || companyProfile.draft.registeredAddress || {}) as any;
      const registeredOfficeAddress = {
        line1: registeredAddress.line1 || '',
        city: registeredAddress.city || '',
        state: registeredAddress.state || '',
        pincode: registeredAddress.pincode || '',
        country: registeredAddress.country || 'India',
      };

      // Prepare corporate office address
      const corpAddr = (companyProfile.draft.corporateOfficeAddress || companyProfile.draft.corporateAddress || {}) as any;
      const corporateOfficeAddress = {
        line1: corpAddr.line1 || '',
        city: corpAddr.city || '',
        state: corpAddr.state || '',
        pincode: corpAddr.pincode || '',
        country: corpAddr.country || 'India',
      };

      // Create payload with all required fields
      // NOTE: Backend expects 'gstIn' field name (camelCase)
      const payload: any = {
        organizationId,
        legalName: companyProfile.draft.legalName || '',
        tradeName: companyProfile.draft.tradeName || undefined,
        industryType: companyProfile.draft.industryType || companyProfile.draft.industry || '',
        cin: companyProfile.draft.cin || '',
        pan: companyProfile.draft.pan || '',
        tan: companyProfile.draft.tan || '',
        foundedDate: companyProfile.draft.foundedDate || undefined,
        logoBase64: (companyProfile.draft.logoUrl && companyProfile.draft.logoUrl.startsWith('data:'))
          ? companyProfile.draft.logoUrl
          : (companyProfile.draft.logoBase64 || ''),
        pfEstablishmentCode: companyProfile.draft.pfEstablishmentCode || companyProfile.draft.pfRegistrationNo || '',
        esicCode: companyProfile.draft.esicCode || '',
        msmeUdyam: companyProfile.draft.msmeUdyam || undefined,
        officialEmail: companyProfile.draft.officialEmail || '',
        officialPhone: companyProfile.draft.officialPhone || '',
        financialYearStartMonth: companyProfile.draft.financialYearStartMonth || 'April',
        registeredOfficeAddress,
        corporateOfficeAddress,
        bankAccounts,
      };
      
      // Add gstIn only if it has a value
      const gstinValue = companyProfile.draft.gstIn || companyProfile.draft.gstin;
      if (gstinValue && gstinValue.trim()) {
        payload.gstIn = gstinValue.trim();
      }

      let data: CompanyProfile;
      // Determine handle: from loaded data, selected handle, or draft handle
      const existingHandle = companyProfile.data?.handle || (selectedCompanyHandle && selectedCompanyHandle !== 'new' ? selectedCompanyHandle : null) || (companyProfile.draft as any)?.handle;

      if (existingHandle) {
        // UPDATE: Call update endpoint if company already has a handle
        data = await HrmOrganizationService.updateCompany(
          existingHandle,
          payload
        );
      } else {
        // CREATE: Call create endpoint if no handle exists (new company)
        payload.createdBy = userId;
        data = await HrmOrganizationService.createCompany(payload);
      }

      // Normalize field names after save so form binding stays consistent
      const logoUrl = get().companyProfile.draft?.logoUrl;
      const savedData = { ...data, logoUrl };
      // Backend may return 'gstin' or 'gstIn', normalize to 'gstIn' for UI
      if (savedData.gstin && !savedData.gstIn) {
        savedData.gstIn = savedData.gstin;
      }
      set((state) => ({
        companyProfile: {
          ...state.companyProfile,
          data: savedData,
          draft: { ...savedData },
          isSaving: false,
          isEditing: false,
        },
      }));
    } catch (error: unknown) {
      const conflictMsg = describeCompanyConflict(error);
      const errMsg =
        conflictMsg ?? (error instanceof Error ? error.message : 'Failed to save company profile');
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

  setSameAsRegisteredOffice: (value) =>
    set((state) => ({
      companyProfile: { ...state.companyProfile, sameAsRegisteredOffice: value },
    })),

  // ------------------------------------------
  // Business Units
  // ------------------------------------------
  fetchBusinessUnits: async () => {
    const organizationId = getOrganizationId();
    const { companyProfile, selectedCompanyHandle } = get();
    const companyHandle = companyProfile.data?.handle || (selectedCompanyHandle !== 'new' ? selectedCompanyHandle : null);

    if (!organizationId || !companyHandle) {
      return;
    }

    set((state) => ({
      businessUnit: { ...state.businessUnit, isLoading: true, errors: {} },
    }));

    try {
      const list = await HrmOrganizationService.fetchBusinessUnits(organizationId, companyHandle);

      // Backend's `departmentCount` on each BU is unreliable (returns stale
      // defaults). Recompute from the org hierarchy, which returns the actual
      // BU → departments mapping in a single call.
      let deptCountByBu: Record<string, number> = {};
      try {
        const hierarchy = await HrmOrganizationService.fetchOrgHierarchy(organizationId, companyHandle);
        deptCountByBu = (hierarchy.businessUnits || []).reduce<Record<string, number>>(
          (acc, entry) => {
            const handle = entry.businessUnit?.handle;
            if (handle) acc[handle] = (entry.departments || []).length;
            return acc;
          },
          {}
        );
      } catch (hierarchyErr) {
        console.warn('fetchOrgHierarchy failed — falling back to zero counts:', hierarchyErr);
      }

      const withCounts = list.map((bu) => ({
        ...bu,
        departmentCount: deptCountByBu[bu.handle] ?? 0,
      }));

      set((state) => ({
        businessUnit: { ...state.businessUnit, list: withCounts, isLoading: false },
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
    const { businessUnit, companyProfile, selectedCompanyHandle } = get();
    const organizationId = getOrganizationId();
    const userId = getUserId();
    const companyHandle = companyProfile.data?.handle || selectedCompanyHandle;

    if (!businessUnit.draft || !organizationId || !companyHandle) return;

    // Validate before saving
    const validationErrors = validateBusinessUnit(businessUnit.draft);
    if (Object.keys(validationErrors).length > 0) {
      set((state) => ({
        businessUnit: {
          ...state.businessUnit,
          isSaving: false,
          errors: validationErrors,
        },
      }));
      return;
    }

    set((state) => ({
      businessUnit: { ...state.businessUnit, isSaving: true, errors: {} },
    }));

    try {
      // Single source of truth for the BU's state: the address state. Both
      // the top-level `state` and `placeOfSupply` on the API payload are
      // kept in sync with it so they always match — the UI only collects
      // the address state and we no longer accept divergent values.
      const resolvedState = businessUnit.draft.address?.state
        || businessUnit.draft.state
        || '';

      const payload: BusinessUnitRequest = {
        organizationId,
        companyHandle,
        buCode: businessUnit.draft.buCode || '',
        buName: businessUnit.draft.buName || '',
        state: resolvedState,
        placeOfSupply: resolvedState,
        gstin: businessUnit.draft.gstin || '',
        primaryContact: businessUnit.draft.primaryContact || '',
        address: {
          line1: businessUnit.draft.address?.line1 || '',
          city: businessUnit.draft.address?.city || '',
          state: businessUnit.draft.address?.state || '',
          pincode: businessUnit.draft.address?.pincode || '',
          country: businessUnit.draft.address?.country || 'India',
        },
        createdBy: userId,
      };

      if (businessUnit.selected?.handle && !businessUnit.isCreating) {
        // For update, replace createdBy with modifiedBy
        const updatePayload = {
          ...payload,
          modifiedBy: userId,
        };
        delete (updatePayload as Record<string, unknown>).createdBy;
        
        const updated = await HrmOrganizationService.updateBusinessUnit(
          businessUnit.selected.handle,
          updatePayload
        );
        // Preserve the client-computed departmentCount — backend's field is unreliable.
        const priorCount = businessUnit.selected.departmentCount ?? 0;
        const normalizedUpdated = { ...updated, departmentCount: priorCount };
        set((state) => ({
          businessUnit: {
            ...state.businessUnit,
            list: state.businessUnit.list.map((bu) =>
              bu.handle === normalizedUpdated.handle ? normalizedUpdated : bu
            ),
            selected: normalizedUpdated,
            draft: { ...normalizedUpdated },
            isSaving: false,
            isCreating: false,
          },
        }));
        
        // Refresh global hierarchy after BU update
        get().fetchHierarchy();
      } else {
        const created = await HrmOrganizationService.createBusinessUnit(payload);
        // A brand-new BU always has 0 departments — ignore backend's count.
        const normalizedCreated = { ...created, departmentCount: 0 };
        set((state) => ({
          businessUnit: {
            ...state.businessUnit,
            list: [...state.businessUnit.list, normalizedCreated],
            selected: normalizedCreated,
            draft: { ...normalizedCreated },
            isSaving: false,
            isCreating: false,
          },
        }));
        
        // Refresh global hierarchy after BU creation
        get().fetchHierarchy();
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
      throw new Error(errMsg);
    }
  },

  deleteBusinessUnit: async (handle) => {
    const organizationId = getOrganizationId();
    const userId = getUserId();
    if (!organizationId) return;

    try {
      const response = await HrmOrganizationService.deleteBusinessUnit(organizationId, handle, userId);
      
      // Check if response has error code or error message
      if (response?.errorCode || response?.message_details?.msg_type === 'E') {
        const errorMsg = response?.message_details?.msg || 'Failed to delete business unit';
        throw new Error(errorMsg);
      }
      
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
      
      // Refresh global hierarchy after BU deletion
      get().fetchHierarchy();
    } catch (error: unknown) {
      let errMsg = 'Failed to delete business unit';
      
      // If it's an Error object, use its message
      if (error instanceof Error) {
        errMsg = error.message;
      }
      
      console.error('deleteBusinessUnit error:', errMsg);
      set((state) => ({
        businessUnit: {
          ...state.businessUnit,
          errors: { _general: errMsg },
        },
      }));
      throw new Error(errMsg);
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
    const organizationId = getOrganizationId();
    if (!organizationId || !buHandle) return;

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
        HrmOrganizationService.fetchDepartments(organizationId, buHandle),
        HrmOrganizationService.fetchDepartmentHierarchy(organizationId, buHandle),
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
        // NOTE: deliberately do NOT clear `draft` here. When the user picks
        // a BU mid-form (during a create flow), they've often already typed
        // a Department Code/Name; clearing the draft used to wipe their
        // input. The dept list and hierarchy are scoped to the BU so we
        // still reset those, but draft survives so partial input is kept.
        selected: null,
        list: [],
        hierarchy: [],
      },
    })),

  setDepartmentExpandedKeys: (keys) =>
    set((state) => ({
      department: { ...state.department, expandedKeys: keys },
    })),

  saveDepartment: async () => {
    const { department, businessUnit, companyProfile } = get();
    const organizationId = getOrganizationId();
    const userId = getUserId();
    const buHandle = department.selectedBuHandle;

    if (!department.draft || !organizationId || !buHandle) return;

    // Look up the BU to read its companyHandle. If the BU isn't in the
    // local list (stale cache, cross-company state), surface an error
    // instead of silently aborting the save — the previous behavior was
    // a silent return that left the user clicking "Save" with no
    // feedback, especially after creating the second BU.
    const selectedBu = businessUnit.list.find((bu) => bu.handle === buHandle);
    if (!selectedBu) {
      set((state) => ({
        department: {
          ...state.department,
          isSaving: false,
          errors: {
            _general:
              'Selected Business Unit not found in current company. Please reload and try again.',
          },
        },
      }));
      return;
    }

    // Fall back to the active company's handle when the BU record itself
    // doesn't carry one — some backend create paths return a BU without
    // companyHandle, and the dept create payload requires it.
    const companyHandle = selectedBu.companyHandle || companyProfile.data?.handle;
    if (!companyHandle) {
      set((state) => ({
        department: {
          ...state.department,
          isSaving: false,
          errors: {
            _general:
              'Business Unit is missing a company handle. Refresh the company profile and try again.',
          },
        },
      }));
      return;
    }

    set((state) => ({
      department: { ...state.department, isSaving: true, errors: {} },
    }));

    try {
      const payload: DepartmentRequest = {
        organizationId,
        buHandle,
        companyHandle,
        deptCode: department.draft.deptCode || '',
        deptName: department.draft.deptName || '',
        parentDeptHandle: department.draft.parentDeptHandle,
        headOfDepartmentEmployeeId: department.draft.headOfDepartmentEmployeeId,
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

      // Refresh department hierarchy after save (for specific BU) AND re-pull
      // the flat department list. The flat list backs the Parent Department
      // dropdown — without this, a just-created dept isn't selectable as a
      // parent in a follow-up create, and stale entries can linger.
      const { department: updatedDept } = get();
      if (updatedDept.selectedBuHandle) {
        const [hierarchy, freshList] = await Promise.all([
          HrmOrganizationService.fetchDepartmentHierarchy(
            organizationId,
            updatedDept.selectedBuHandle,
          ),
          HrmOrganizationService.fetchDepartments(
            organizationId,
            updatedDept.selectedBuHandle,
          ),
        ]);
        set((state) => ({
          department: {
            ...state.department,
            hierarchy,
            list: freshList,
          },
        }));
      }

      // Refresh global hierarchy after department save
      get().fetchHierarchy();
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
    const organizationId = getOrganizationId();
    const userId = getUserId();
    if (!organizationId) return;

    try {
      const response = await HrmOrganizationService.deleteDepartment(organizationId, handle, userId);
      
      // Check if response has error code or error message
      if (response?.errorCode || response?.message_details?.msg_type === 'E') {
        const errorMsg = response?.message_details?.msg || 'Failed to delete department';
        throw new Error(errorMsg);
      }

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

      // Refresh department hierarchy after delete (for specific BU)
      const { department } = get();
      if (department.selectedBuHandle) {
        const hierarchy = await HrmOrganizationService.fetchDepartmentHierarchy(
          organizationId,
          department.selectedBuHandle
        );
        set((state) => ({
          department: { ...state.department, hierarchy },
        }));
      }
      
      // Refresh global hierarchy after department deletion
      get().fetchHierarchy();
    } catch (error: unknown) {
      let errMsg = 'Failed to delete department';
      
      // If it's an Error object, use its message
      if (error instanceof Error) {
        errMsg = error.message;
      }
      
      console.error('deleteDepartment error:', errMsg);
      set((state) => ({
        department: {
          ...state.department,
          errors: { _general: errMsg },
        },
      }));
      throw new Error(errMsg);
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
  // Locations
  // ------------------------------------------
  fetchLocations: async () => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;

    set((state) => ({
      location: { ...state.location, isLoading: true, errors: {} },
    }));

    try {
      const list = await HrmOrganizationService.fetchAllLocations(organizationId);
      set((state) => ({
        location: { ...state.location, list, isLoading: false },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to fetch locations';
      console.error('fetchLocations error:', errMsg);
      set((state) => ({
        location: {
          ...state.location,
          isLoading: false,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  selectLocation: (loc) =>
    set((state) => ({
      location: {
        ...state.location,
        selected: loc,
        draft: loc ? { ...loc } : null,
        isCreating: false,
        errors: {},
      },
    })),

  setLocationDraft: (draft) =>
    set((state) => ({
      location: {
        ...state.location,
        draft: { ...state.location.draft, ...draft },
      },
    })),

  setLocationCreating: (isCreating) =>
    set((state) => ({
      location: {
        ...state.location,
        isCreating,
        selected: isCreating ? null : state.location.selected,
        draft: isCreating ? { country: 'India', active: 1 } : state.location.draft,
        errors: {},
      },
    })),

  setLocationSearch: (text) =>
    set((state) => ({
      location: { ...state.location, searchText: text },
    })),

  saveLocation: async () => {
    const { location } = get();
    const organizationId = getOrganizationId();
    const userId = getUserId();

    if (!location.draft || !organizationId) return;

    // Validate location data
    const { validateLocation } = await import('../utils/validations');
    const validationErrors = validateLocation(location.draft);
    
    if (Object.keys(validationErrors).length > 0) {
      const errorMessages = Object.values(validationErrors).join('\n');
      set((state) => ({
        location: {
          ...state.location,
          errors: validationErrors,
        },
      }));
      throw new Error(errorMessages);
    }

    set((state) => ({
      location: { ...state.location, isSaving: true, errors: {} },
    }));

    try {
      const payload: LocationRequest = {
        organizationId,
        code: location.draft.code || '',
        name: location.draft.name || '',
        addressLine1: location.draft.addressLine1 || '',
        addressLine2: location.draft.addressLine2 ?? undefined,
        city: location.draft.city || '',
        state: location.draft.state || '',
        country: location.draft.country || 'India',
        pincode: location.draft.pincode || '',
        active: location.draft.active ?? 1,
        modifiedBy: userId,
      };

      if (location.selected?.id && !location.isCreating) {
        const updated = await HrmOrganizationService.updateLocation(
          location.selected.id,
          payload
        );
        set((state) => ({
          location: {
            ...state.location,
            list: state.location.list.map((l) =>
              l.id === updated.id ? (updated as Location) : l
            ),
            selected: updated as Location,
            draft: { ...updated },
            isSaving: false,
            isCreating: false,
          },
        }));
      } else {
        payload.createdBy = userId;
        const created = await HrmOrganizationService.createLocation(payload);
        set((state) => ({
          location: {
            ...state.location,
            list: [...state.location.list, created as Location],
            selected: created as Location,
            draft: { ...created },
            isSaving: false,
            isCreating: false,
          },
        }));
      }
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to save location';
      console.error('saveLocation error:', errMsg);
      set((state) => ({
        location: {
          ...state.location,
          isSaving: false,
          errors: { _general: errMsg },
        },
      }));
      throw new Error(errMsg);
    }
  },

  deleteLocation: async (id) => {
    const organizationId = getOrganizationId();
    const userId = getUserId();
    if (!organizationId) return;

    try {
      await HrmOrganizationService.deleteLocation(organizationId, id, userId);
      set((state) => ({
        location: {
          ...state.location,
          list: state.location.list.filter((l) => l.id !== id),
          selected:
            state.location.selected?.id === id
              ? null
              : state.location.selected,
          draft:
            state.location.selected?.id === id
              ? null
              : state.location.draft,
        },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to delete location';
      console.error('deleteLocation error:', errMsg);
      set((state) => ({
        location: {
          ...state.location,
          errors: { _general: errMsg },
        },
      }));
    }
  },

  setLocationError: (field, error) =>
    set((state) => ({
      location: {
        ...state.location,
        errors: { ...state.location.errors, [field]: error },
      },
    })),

  clearLocationErrors: () =>
    set((state) => ({
      location: { ...state.location, errors: {} },
    })),

  // ------------------------------------------
  // Hierarchy
  // ------------------------------------------
  fetchHierarchy: async () => {
    // Use the viewed company's own org id, not the cookie/header global
    // selection — see getScopingOrgId() docs.
    const organizationId = getScopingOrgId(get);
    const { companyProfile, selectedCompanyHandle } = get();
    const companyHandle = companyProfile.data?.handle || selectedCompanyHandle;

    if (!organizationId || !companyHandle) return;

    set((state) => ({
      hierarchy: { ...state.hierarchy, isLoading: true },
    }));

    try {
      const data = await HrmOrganizationService.fetchOrgHierarchy(organizationId, companyHandle);
      // Derive authoritative department counts per BU from the hierarchy
      // response and sync them back into the BU list. Keeps the Business Unit
      // table count in sync after department create/delete.
      const deptCountByBu = (data.businessUnits || []).reduce<Record<string, number>>(
        (acc, entry) => {
          const handle = entry.businessUnit?.handle;
          if (handle) acc[handle] = (entry.departments || []).length;
          return acc;
        },
        {}
      );
      set((state) => ({
        hierarchy: {
          data: data as unknown as OrgHierarchy,
          isLoading: false,
        },
        businessUnit: {
          ...state.businessUnit,
          list: state.businessUnit.list.map((bu) => ({
            ...bu,
            departmentCount: deptCountByBu[bu.handle] ?? bu.departmentCount ?? 0,
          })),
        },
      }));
    } catch (error: unknown) {
      const errMsg =
        error instanceof Error ? error.message : 'Failed to fetch hierarchy';
      console.error('fetchHierarchy error:', errMsg);
      set({
        hierarchy: { data: null, isLoading: false },
      });
    }
  },

  // ------------------------------------------
  // Audit Log
  // ------------------------------------------
  fetchAuditLog: async (entityType?: string, entityHandle?: string) => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;

    set((state) => ({
      auditLog: { ...state.auditLog, isLoading: true },
    }));

    try {
      const entries = await HrmOrganizationService.fetchAuditLog(
        organizationId,
        entityType || '',
        entityHandle || ''
      );
      set((state) => ({
        auditLog: { ...state.auditLog, entries: Array.isArray(entries) ? entries : [], isLoading: false },
      }));
    } catch {
      set((state) => ({
        auditLog: { ...state.auditLog, entries: [], isLoading: false },
      }));
    }
  },

  setAuditEntityTypeFilter: (t) =>
    set((state) => ({
      auditLog: { ...state.auditLog, entityTypeFilter: t },
    })),

  setAuditEntityHandleFilter: (h) =>
    set((state) => ({
      auditLog: { ...state.auditLog, entityHandleFilter: h },
    })),

  // ------------------------------------------
  // Data Completeness
  // ------------------------------------------
  fetchDataCompleteness: async (entityType?: string) => {
    const organizationId = getOrganizationId();
    if (!organizationId) return;

    set((state) => ({
      dataCompleteness: { ...state.dataCompleteness, isLoading: true },
    }));

    try {
      const rows = await HrmOrganizationService.generateDataCompletenessReport(organizationId, entityType);
      set((state) => ({
        dataCompleteness: { ...state.dataCompleteness, rows: Array.isArray(rows) ? rows : [], isLoading: false },
      }));
    } catch {
      set((state) => ({
        dataCompleteness: { ...state.dataCompleteness, rows: [], isLoading: false },
      }));
    }
  },

  // ------------------------------------------
  // Global
  // ------------------------------------------
  reset: () =>
    set({
      view: 'list',
      activeDetailTab: 'profile',
      selectedCompanyHandle: null,
      companyList: { ...initialCompanyListState },
      companyProfile: { ...initialCompanyProfileState },
      businessUnit: { ...initialBusinessUnitState },
      department: { ...initialDepartmentState },
      location: { ...initialLocationState },
      hierarchy: { ...initialHierarchyState },
      auditLog: { entries: [], isLoading: false, entityTypeFilter: 'COMPANY_PROFILE', entityHandleFilter: '' },
      dataCompleteness: { rows: [], isLoading: false },
    }),
}));
