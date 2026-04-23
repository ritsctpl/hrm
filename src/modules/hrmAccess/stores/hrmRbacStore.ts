import { create } from 'zustand';
import { parseCookies, setCookie } from 'nookies';
import { HrmAccessService } from '../services/hrmAccessService';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
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

const ALL_TRUE_PERMS: ModulePermissions = Object.freeze({
  canView: true,
  canAdd: true,
  canEdit: true,
  canDelete: true,
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

// For super admins: build a permissionsByModule map where every listed
// module has full V/A/E/D. Same shape as buildPermissionsMap so every
// consumer of the map sees the same data on both paths.
function buildSuperAdminPermissionsMap(modules: EnrichedModule[]): ModulePermissionsMap {
  const map: ModulePermissionsMap = {};
  for (const mod of modules) {
    map[mod.moduleCode] = { ...ALL_TRUE_PERMS };
  }
  return map;
}

// For super admins: build a section-permissions cache where every module
// maps to every known object (from the registry) set to ALL_TRUE_PERMS.
// Modules not in the object registry get a single self-keyed entry —
// purely to keep ModuleAccessGate's `sectionCache === undefined` spinner
// check from hanging.
function buildSuperAdminSectionCache(
  modules: EnrichedModule[],
): Record<string, ModuleSectionPermissions> {
  const cache: Record<string, ModuleSectionPermissions> = {};
  for (const mod of modules) {
    const objectCodes = getObjectCodesForModule(mod.moduleCode);
    const sectionPerms: ModuleSectionPermissions = {};
    if (objectCodes.length > 0) {
      for (const code of objectCodes) {
        sectionPerms[code] = { ...ALL_TRUE_PERMS };
      }
    } else {
      sectionPerms[mod.moduleCode] = { ...ALL_TRUE_PERMS };
    }
    cache[mod.moduleCode] = sectionPerms;
  }
  return cache;
}

interface HrmRbacState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  userId: string;
  currentOrganizationId: string;
  isSuperAdmin: boolean;
  organizations: OrganizationModules[];
  currentOrgModules: EnrichedModule[];
  modulesByCategory: Record<string, EnrichedModule[]>;
  permissionsByModule: ModulePermissionsMap;
  sectionPermissionCache: Record<string, ModuleSectionPermissions>;
}

interface HrmRbacActions {
  initialize: (userId: string, initialOrganizationId?: string, tokenRole?: string) => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
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
  isSuperAdmin: false,
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

  initialize: async (userId: string, initialOrganizationId?: string, tokenRole?: string) => {
    set({ isLoading: true, error: null });

    const isSuperAdmin = tokenRole === 'super_admin';

    if (isSuperAdmin) {
      try {
        // 1. All orgs (not /rbac/userModulesByOrganization, which returns
        //    only assigned orgs — a super admin typically has none).
        const allOrgSummaries = await HrmOrganizationService.fetchAllOrganizations();

        if (allOrgSummaries.length === 0) {
          console.warn(
            '[hrmRbacStore] Super admin detected but fetchAllOrganizations returned 0 orgs.',
          );
        }

        // 2. Resolve current org with fallthrough:
        //    a) initialOrganizationId only if present in the fetched list,
        //    b) site preference only if present in the fetched list,
        //    c) first org in the list.
        const isInList = (id?: string) =>
          !!id && allOrgSummaries.some((o) => o.organizationId === id);

        let currentOrganizationId = isInList(initialOrganizationId) ? initialOrganizationId! : '';
        if (!currentOrganizationId) {
          try {
            const sitePref = await HrmAccessService.getUserSitePreference(userId);
            if (sitePref.success && isInList(sitePref.currentSite || undefined)) {
              currentOrganizationId = sitePref.currentSite!;
            }
          } catch {
            // ignore preference errors
          }
        }
        if (!currentOrganizationId && allOrgSummaries.length > 0) {
          currentOrganizationId = allOrgSummaries[0].organizationId;
        }

        // 3. Write site cookie so downstream getOrganizationId() works
        //    synchronously when gated children mount.
        if (currentOrganizationId) {
          setCookie(null, 'site', currentOrganizationId, {
            path: '/',
            maxAge: 30 * 24 * 60 * 60,
          });
        }

        // 4. Fetch full module registry for the current org.
        let currentOrgModules: EnrichedModule[] = [];
        if (currentOrganizationId) {
          try {
            const allModules = await HrmAccessService.fetchAllModules(currentOrganizationId);
            currentOrgModules = allModules.map((m) => ({
              moduleCode: m.moduleCode,
              moduleName: m.moduleName,
              moduleCategory: m.moduleCategory,
              appUrl: m.appUrl,
              actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'],
            }));
          } catch (err) {
            console.warn('[hrmRbacStore] fetchAllModules failed for super admin:', err);
            // Leave empty — E6 fallback; retry via org-switch or reload.
          }
        }

        // 5. Synthesize organizations[] — current org has modules; others
        //    are stubs with modules:[] (lazy-hydrated on switch).
        const organizations: OrganizationModules[] = allOrgSummaries.map((o) => ({
          organizationId: o.organizationId,
          organizationName: o.organizationName,
          modules: o.organizationId === currentOrganizationId ? currentOrgModules : [],
        }));

        set({
          isLoading: false,
          isReady: true,
          isSuperAdmin: true,
          userId,
          currentOrganizationId,
          organizations,
          currentOrgModules,
          modulesByCategory: groupByCategory(currentOrgModules),
          permissionsByModule: buildSuperAdminPermissionsMap(currentOrgModules),
          sectionPermissionCache: buildSuperAdminSectionCache(currentOrgModules),
        });
        return;
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to initialize super admin RBAC';
        set({ isLoading: false, error: message, isSuperAdmin: false });
        return;
      }
    }

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

  switchOrganization: async (organizationId: string) => {
    const state = get();

    if (state.isSuperAdmin) {
      const orgEntry = state.organizations.find(o => o.organizationId === organizationId);
      if (!orgEntry) {
        console.warn(
          '[hrmRbacStore] switchOrganization: org not in cached list:',
          organizationId,
        );
        return;
      }

      let enrichedModules: EnrichedModule[] = orgEntry.modules;
      if (enrichedModules.length === 0) {
        try {
          const allModules = await HrmAccessService.fetchAllModules(organizationId);
          enrichedModules = allModules.map((m) => ({
            moduleCode: m.moduleCode,
            moduleName: m.moduleName,
            moduleCategory: m.moduleCategory,
            appUrl: m.appUrl,
            actions: ['VIEW', 'ADD', 'EDIT', 'DELETE'],
          }));
        } catch (err) {
          console.warn('[hrmRbacStore] fetchAllModules failed on super-admin switch:', err);
          enrichedModules = [];
        }
      }

      setCookie(null, 'site', organizationId, { path: '/', maxAge: 30 * 24 * 60 * 60 });

      // Cache the resolved modules back onto the org entry so a future
      // switch back to this org skips the fetch.
      const updatedOrganizations = state.organizations.map(o =>
        o.organizationId === organizationId ? { ...o, modules: enrichedModules } : o,
      );

      set({
        currentOrganizationId: organizationId,
        organizations: updatedOrganizations,
        currentOrgModules: enrichedModules,
        modulesByCategory: groupByCategory(enrichedModules),
        permissionsByModule: buildSuperAdminPermissionsMap(enrichedModules),
        sectionPermissionCache: buildSuperAdminSectionCache(enrichedModules),
      });

      HrmAccessService.updateDefaultSite(state.userId, organizationId).catch(err => {
        console.warn('Failed to persist default site:', err);
      });
      return;
    }

    const { organizations, userId } = state;
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
    const state = get();

    if (state.isSuperAdmin) {
      if (state.sectionPermissionCache[moduleCode]) return;
      // Write the synthesized all-true record so ModuleAccessGate's
      // direct slice watch transitions from undefined → populated and
      // stops showing a spinner. Idempotent.
      const fresh = buildSuperAdminSectionCache([
        {
          moduleCode,
          moduleName: moduleCode,
          moduleCategory: '',
          appUrl: '',
          actions: [],
        } as EnrichedModule,
      ])[moduleCode];
      set(s => ({
        sectionPermissionCache: { ...s.sectionPermissionCache, [moduleCode]: fresh },
        permissionsByModule: {
          ...s.permissionsByModule,
          [moduleCode]: { ...ALL_TRUE_PERMS },
        },
      }));
      return;
    }

    const { sectionPermissionCache, currentOrganizationId, userId } = state;
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
      //
      // Root perms are the UNION of (the explicit root-object entry, if
      // returned) and (module-level perms). This handles three real-world
      // backend variants in one pass:
      //   - Backend returns root object with all flags → use it.
      //   - Backend omits root but grants module-level → fall back to
      //     module-level, so admins keep canAdd/canEdit/canDelete.
      //   - Backend returns root with canView only but module has ADD →
      //     we union both, which prevents the canAdd from being silently
      //     lost during cascade.
      const rootCode = getRootObjectCode(moduleCode);
      const explicitRoot = rootCode ? sectionPerms[rootCode] : undefined;
      const moduleFallback = get().permissionsByModule[moduleCode];
      const rootPerms: ModulePermissions = {
        canView: (explicitRoot?.canView ?? false) || (moduleFallback?.canView ?? false),
        canAdd: (explicitRoot?.canAdd ?? false) || (moduleFallback?.canAdd ?? false),
        canEdit: (explicitRoot?.canEdit ?? false) || (moduleFallback?.canEdit ?? false),
        canDelete: (explicitRoot?.canDelete ?? false) || (moduleFallback?.canDelete ?? false),
      };

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

      // Correct module-level permissions from the effective root perms.
      // `rootPerms` already includes the module-level fallback (see above)
      // when no explicit root object was returned, so we just mirror it here.
      const correctedModulePerms: ModulePermissions = { ...rootPerms };

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
    if (get().isSuperAdmin) return true;
    const { currentOrgModules } = get();
    return currentOrgModules.some(m => m.appUrl === appUrl);
  },

  getModuleActions: (moduleCode: string) => {
    if (get().isSuperAdmin) return ['VIEW', 'ADD', 'EDIT', 'DELETE'];
    const { currentOrgModules } = get();
    const mod = currentOrgModules.find(m => m.moduleCode === moduleCode);
    return mod?.actions || [];
  },

  getModulePermissions: (moduleCode: string) => {
    if (get().isSuperAdmin) return { ...ALL_TRUE_PERMS };
    return get().permissionsByModule[moduleCode] || EMPTY_PERMS;
  },

  getObjectPermissions: (moduleCode: string, objectName: string) => {
    if (get().isSuperAdmin) return { ...ALL_TRUE_PERMS };
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
    const state = get();
    if (state.isSuperAdmin) {
      const cached = state.sectionPermissionCache[moduleCode];
      if (cached) return cached;
      // Module not seen at init — build on the fly + write back so repeat
      // reads hit the cache instead of rebuilding.
      const fresh = buildSuperAdminSectionCache([
        {
          moduleCode,
          moduleName: moduleCode,
          moduleCategory: '',
          appUrl: '',
          actions: [],
        } as EnrichedModule,
      ])[moduleCode];
      set(s => ({
        sectionPermissionCache: { ...s.sectionPermissionCache, [moduleCode]: fresh },
      }));
      return fresh;
    }
    return state.sectionPermissionCache[moduleCode] || null;
  },

  clearSectionCache: () => {
    set({ sectionPermissionCache: {} });
  },

  reset: () => {
    set(initialState);
  },
}));
