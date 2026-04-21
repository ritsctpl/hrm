import { create } from 'zustand';
import { parseCookies, setCookie } from 'nookies';
import { HrmAccessService } from '../services/hrmAccessService';
import { getRootObjectCode, getObjectCodesForModule } from '../utils/moduleObjectRegistry';
import type { PermissionAction } from '../types/api.types';
import type {
  OrganizationModules,
  EnrichedModule,
  ModuleSectionPermissions,
  SectionPermissions,
} from '../types/rbac.types';

// Precomputed module-level permissions: moduleCode → flags.
// Built once during initialize/switchOrganization so lookups are O(1)
// with no per-render array scans.
export type ModulePermissions = SectionPermissions;
export type ModulePermissionsMap = Record<string, ModulePermissions>;

const EMPTY_PERMS: ModulePermissions = Object.freeze({
  canView: false,
  canAdd: false,
  canEdit: false,
  canDelete: false,
});

function buildPermissionsMap(modules: EnrichedModule[]): ModulePermissionsMap {
  const map: ModulePermissionsMap = {};
  for (const mod of modules) {
    const actions = mod.actions || [];
    map[mod.moduleCode] = {
      canView: actions.includes('VIEW'),
      canAdd: actions.includes('ADD'),
      canEdit: actions.includes('EDIT'),
      canDelete: actions.includes('DELETE'),
    };
  }
  return map;
}

interface HrmRbacState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  userId: string;
  currentOrganizationId: string;
  organizations: OrganizationModules[];
  currentOrgModules: EnrichedModule[];
  modulesByCategory: Record<string, EnrichedModule[]>;
  permissionsByModule: ModulePermissionsMap;
  sectionPermissionCache: Record<string, ModuleSectionPermissions>;
}

interface HrmRbacActions {
  initialize: (userId: string, initialOrganizationId?: string) => Promise<void>;
  switchOrganization: (organizationId: string) => void;
  loadSectionPermissions: (moduleCode: string) => Promise<void>;
  hasModuleAccess: (appUrl: string) => boolean;
  getModuleActions: (moduleCode: string) => PermissionAction[];
  getModulePermissions: (moduleCode: string) => ModulePermissions;
  /**
   * Object-level permissions with fallback semantics:
   * 1. If section perms are loaded AND the object has explicit perms, return them.
   * 2. Otherwise fall back to module-level perms (so callers using `object`
   *    work immediately, and refine once section perms arrive).
   */
  getObjectPermissions: (moduleCode: string, objectName: string) => ModulePermissions;
  getSectionPermissions: (moduleCode: string) => ModuleSectionPermissions | null;
  clearSectionCache: () => void;
  reset: () => void;
}

const initialState: HrmRbacState = {
  isLoading: false,
  isReady: false,
  error: null,
  userId: '',
  currentOrganizationId: '',
  organizations: [],
  currentOrgModules: [],
  modulesByCategory: {},
  permissionsByModule: {},
  sectionPermissionCache: {},
};

function groupByCategory(modules: EnrichedModule[]): Record<string, EnrichedModule[]> {
  const groups: Record<string, EnrichedModule[]> = {};
  for (const mod of modules) {
    const cat = mod.moduleCategory || 'General';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(mod);
  }
  return groups;
}

export const useHrmRbacStore = create<HrmRbacState & HrmRbacActions>((set, get) => ({
  ...initialState,

  initialize: async (userId: string, initialOrganizationId?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch user modules by organization
      const userModules = await HrmAccessService.fetchUserModulesByOrganization(userId);
      const organizations = userModules.organizations || [];

      // Determine current organization
      let currentOrganizationId = initialOrganizationId || '';
      if (!currentOrganizationId && organizations.length > 0) {
        // Try to get site preference
        try {
          const sitePref = await HrmAccessService.getUserSitePreference(userId);
          if (sitePref.success && sitePref.currentSite) {
            currentOrganizationId = sitePref.currentSite;
          }
        } catch {
          // ignore preference errors
        }
      }
      if (!currentOrganizationId && organizations.length > 0) {
        currentOrganizationId = organizations[0].organizationId;
      }

      // Persist resolved org to cookie so module stores can read it synchronously
      if (currentOrganizationId) {
        setCookie(null, 'site', currentOrganizationId, { path: '/' });
      }

      // Find current org modules
      const currentOrg = organizations.find(o => o.organizationId === currentOrganizationId);
      const orgModules = currentOrg?.modules || [];

      // Enrich modules with registry data
      let enrichedModules: EnrichedModule[] = orgModules.map(m => ({ ...m }));
      try {
        if (currentOrganizationId) {
          const allModules = await HrmAccessService.fetchAllModules(currentOrganizationId);
          enrichedModules = orgModules.map(m => {
            const registry = allModules.find(r => r.moduleCode === m.moduleCode);
            return {
              ...m,
              description: registry?.moduleCategory || undefined,
              defaultPermissionObjects: undefined,
            };
          });
        }
      } catch {
        // use non-enriched modules
      }

      // Persist the resolved organization to the `site` cookie BEFORE flipping
      // isReady — gated components (ModuleAccessGate) mount children as soon
      // as isReady is true, and those children call getOrganizationId() on
      // mount. Writing the cookie first prevents a "Site not found in cookies"
      // race for users who direct-nav into a module without passing through
      // the homepage / site switcher.
      if (currentOrganizationId && parseCookies().site !== currentOrganizationId) {
        setCookie(null, 'site', currentOrganizationId, {
          path: '/',
          maxAge: 30 * 24 * 60 * 60,
        });
      }

      set({
        isLoading: false,
        isReady: true,
        userId,
        currentOrganizationId,
        organizations,
        currentOrgModules: enrichedModules,
        modulesByCategory: groupByCategory(enrichedModules),
        permissionsByModule: buildPermissionsMap(enrichedModules),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize RBAC';
      set({ isLoading: false, error: message });
    }
  },

  switchOrganization: (organizationId: string) => {
    const { organizations, userId } = get();
    const org = organizations.find(o => o.organizationId === organizationId);
    if (!org) return;

    const enrichedModules: EnrichedModule[] = org.modules.map(m => ({ ...m }));

    setCookie(null, 'site', organizationId, { path: '/' });

    set({
      currentOrganizationId: organizationId,
      currentOrgModules: enrichedModules,
      modulesByCategory: groupByCategory(enrichedModules),
      permissionsByModule: buildPermissionsMap(enrichedModules),
      sectionPermissionCache: {},
    });

    // Fire-and-forget persist
    HrmAccessService.updateDefaultSite(userId, organizationId).catch(err => {
      console.warn('Failed to persist default site:', err);
    });
  },

  loadSectionPermissions: async (moduleCode: string) => {
    const { sectionPermissionCache, currentOrganizationId, userId } = get();
    if (sectionPermissionCache[moduleCode]) return;
    if (!currentOrganizationId || !userId) return;

    try {
      const response = await HrmAccessService.fetchEffectivePermissions(currentOrganizationId, userId, moduleCode);
      const perms = response.permissions.filter(p => p.moduleCode === moduleCode);

      const sectionPerms: ModuleSectionPermissions = {};
      for (const perm of perms) {
        const objName = perm.objectName || moduleCode;
        if (!sectionPerms[objName]) {
          sectionPerms[objName] = { canView: false, canAdd: false, canEdit: false, canDelete: false };
        }
        switch (perm.action) {
          case 'VIEW': sectionPerms[objName].canView = true; break;
          case 'ADD': sectionPerms[objName].canAdd = true; break;
          case 'EDIT': sectionPerms[objName].canEdit = true; break;
          case 'DELETE': sectionPerms[objName].canDelete = true; break;
        }
      }

      // Root object cascade: the root object (e.g. employee_module,
      // leave_module) perms cascade to ALL child objects in the module.
      // Explicit child grants merge ON TOP of root perms (union).
      // This ensures: root VIEW → all children inherit VIEW;
      // root V/A/E/D (admin) → all children get full access.
      const rootCode = getRootObjectCode(moduleCode);
      const rootPerms: ModulePermissions = rootCode && sectionPerms[rootCode]
        ? sectionPerms[rootCode]
        : { canView: false, canAdd: false, canEdit: false, canDelete: false };

      // Cascade root to every registered object for this module
      const allObjectCodes = getObjectCodesForModule(moduleCode);
      for (const code of allObjectCodes) {
        if (code === rootCode) continue; // root stays as-is
        const existing = sectionPerms[code];
        if (existing) {
          // Merge: explicit grants + root cascade (union)
          sectionPerms[code] = {
            canView: existing.canView || rootPerms.canView,
            canAdd: existing.canAdd || rootPerms.canAdd,
            canEdit: existing.canEdit || rootPerms.canEdit,
            canDelete: existing.canDelete || rootPerms.canDelete,
          };
        } else {
          // No explicit grant — inherit root perms
          sectionPerms[code] = { ...rootPerms };
        }
      }

      // Correct module-level permissions from root object
      const correctedModulePerms: ModulePermissions = rootPerms.canView || rootPerms.canAdd || rootPerms.canEdit || rootPerms.canDelete
        ? { ...rootPerms }
        : {
            canView: (get().permissionsByModule[moduleCode]?.canView) ?? false,
            canAdd: false,
            canEdit: false,
            canDelete: false,
          };

      set(state => ({
        sectionPermissionCache: {
          ...state.sectionPermissionCache,
          [moduleCode]: sectionPerms,
        },
        permissionsByModule: {
          ...state.permissionsByModule,
          [moduleCode]: correctedModulePerms,
        },
      }));
    } catch (err) {
      console.error('Failed to load section permissions for', moduleCode, err);
    }
  },

  hasModuleAccess: (appUrl: string) => {
    const { currentOrgModules } = get();
    return currentOrgModules.some(m => m.appUrl === appUrl);
  },

  getModuleActions: (moduleCode: string) => {
    const { currentOrgModules } = get();
    const mod = currentOrgModules.find(m => m.moduleCode === moduleCode);
    return mod?.actions || [];
  },

  getModulePermissions: (moduleCode: string) => {
    return get().permissionsByModule[moduleCode] || EMPTY_PERMS;
  },

  getObjectPermissions: (moduleCode: string, objectName: string) => {
    const state = get();
    const sectionPerms = state.sectionPermissionCache[moduleCode];
    // Resolution rules:
    //   - Cache loaded WITH object entries → strict lookup. Missing object
    //     means the user has no permission for that object. (This is the
    //     correct behavior once backend exposes object-level perms.)
    //   - Cache loaded but empty → backend hasn't migrated this module to
    //     object-level perms; fall back to module-level grants.
    //   - Cache not yet loaded → transient; fall back to module-level so
    //     the UI doesn't flicker buttons in/out during the initial load.
    if (sectionPerms && Object.keys(sectionPerms).length > 0) {
      return sectionPerms[objectName] || EMPTY_PERMS;
    }
    return state.permissionsByModule[moduleCode] || EMPTY_PERMS;
  },

  getSectionPermissions: (moduleCode: string) => {
    return get().sectionPermissionCache[moduleCode] || null;
  },

  clearSectionCache: () => {
    set({ sectionPermissionCache: {} });
  },

  reset: () => {
    set(initialState);
  },
}));
