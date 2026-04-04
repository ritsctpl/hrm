import { create } from 'zustand';
import { HrmAccessService } from '../services/hrmAccessService';
import type { PermissionAction } from '../types/api.types';
import type {
  OrganizationModules,
  EnrichedModule,
  ModuleSectionPermissions,
  SectionPermissions,
} from '../types/rbac.types';

interface HrmRbacState {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
  userId: string;
  currentSite: string;
  organizations: OrganizationModules[];
  currentOrgModules: EnrichedModule[];
  modulesByCategory: Record<string, EnrichedModule[]>;
  sectionPermissionCache: Record<string, ModuleSectionPermissions>;
}

interface HrmRbacActions {
  initialize: (userId: string, initialSite?: string) => Promise<void>;
  switchOrganization: (site: string) => void;
  loadSectionPermissions: (moduleCode: string) => Promise<void>;
  hasModuleAccess: (appUrl: string) => boolean;
  getModuleActions: (moduleCode: string) => PermissionAction[];
  getSectionPermissions: (moduleCode: string) => ModuleSectionPermissions | null;
  clearSectionCache: () => void;
  reset: () => void;
}

const initialState: HrmRbacState = {
  isLoading: false,
  isReady: false,
  error: null,
  userId: '',
  currentSite: '',
  organizations: [],
  currentOrgModules: [],
  modulesByCategory: {},
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

  initialize: async (userId: string, initialSite?: string) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch user modules by organization
      const userModules = await HrmAccessService.fetchUserModulesByOrganization(userId);
      const organizations = userModules.organizations || [];

      // Determine current site
      let currentSite = initialSite || '';
      if (!currentSite && organizations.length > 0) {
        // Try to get site preference
        try {
          const sitePref = await HrmAccessService.getUserSitePreference(userId);
          if (sitePref.success && sitePref.currentSite) {
            currentSite = sitePref.currentSite;
          }
        } catch {
          // ignore preference errors
        }
      }
      if (!currentSite && organizations.length > 0) {
        currentSite = organizations[0].site;
      }

      // Find current org modules
      const currentOrg = organizations.find(o => o.site === currentSite);
      const orgModules = currentOrg?.modules || [];

      // Enrich modules with registry data
      let enrichedModules: EnrichedModule[] = orgModules.map(m => ({ ...m }));
      try {
        if (currentSite) {
          const allModules = await HrmAccessService.fetchAllModules(currentSite);
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

      set({
        isLoading: false,
        isReady: true,
        userId,
        currentSite,
        organizations,
        currentOrgModules: enrichedModules,
        modulesByCategory: groupByCategory(enrichedModules),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to initialize RBAC';
      set({ isLoading: false, error: message });
    }
  },

  switchOrganization: (site: string) => {
    const { organizations, userId } = get();
    const org = organizations.find(o => o.site === site);
    if (!org) return;

    const enrichedModules: EnrichedModule[] = org.modules.map(m => ({ ...m }));

    set({
      currentSite: site,
      currentOrgModules: enrichedModules,
      modulesByCategory: groupByCategory(enrichedModules),
      sectionPermissionCache: {},
    });

    // Fire-and-forget persist
    HrmAccessService.updateDefaultSite(userId, site).catch(err => {
      console.warn('Failed to persist default site:', err);
    });
  },

  loadSectionPermissions: async (moduleCode: string) => {
    const { sectionPermissionCache, currentSite, userId } = get();
    if (sectionPermissionCache[moduleCode]) return;

    try {
      const response = await HrmAccessService.fetchEffectivePermissions(currentSite, userId);
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

      set(state => ({
        sectionPermissionCache: {
          ...state.sectionPermissionCache,
          [moduleCode]: sectionPerms,
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
