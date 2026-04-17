/**
 * currentEmployeeStore — caches the signed-in user's lightweight employee
 * card (photo + identity) AND the current organization's company profile
 * (logo) so global chrome (CommonAppBar, AppFooter) can render them
 * without re-fetching on every page navigation.
 *
 * Resolution flow:
 *   1. Read login id + site from cookies
 *   2. Look up the employee in the directory by email
 *   3. Fetch the full profile if the directory row didn't include the
 *      photo data (some backends only return photoUrl on /profile).
 *   4. Fetch the current site's company profile for the org logo.
 *
 * One-shot, de-duplicated by `${site}::${loginId}`.
 */

import { create } from 'zustand';
import { parseCookies } from 'nookies';
import { getOrganizationId } from '@/utils/cookieUtils';
import { HrmEmployeeService } from '@/modules/hrmEmployee/services/hrmEmployeeService';
import { HrmOrganizationService } from '@/modules/hrmOrganization/services/hrmOrganizationService';
import type { EmployeeDirectoryRow } from '@/modules/hrmEmployee/types/api.types';

interface CurrentEmployeeCard {
  handle: string;
  fullName: string;
  workEmail: string;
  photoUrl?: string;
  photoBase64?: string;
  designation?: string;
  department?: string;
}

interface CurrentOrgCard {
  legalName?: string;
  tradeName?: string;
  logoUrl?: string;
  logoBase64?: string;
}

interface CurrentEmployeeState {
  data: CurrentEmployeeCard | null;
  org: CurrentOrgCard | null;
  isLoading: boolean;
  error: string | null;
  loadedFor: string;
  load: () => Promise<void>;
  reset: () => void;
}

export const useCurrentEmployeeStore = create<CurrentEmployeeState>((set, get) => ({
  data: null,
  org: null,
  isLoading: false,
  error: null,
  loadedFor: '',

  load: async () => {
    const organizationId = getOrganizationId();
    const cookies = parseCookies();
    const loginId =
      cookies.rl_user_id || cookies.userId || cookies.username || '';

    if (!organizationId || !loginId) return;

    const key = `${organizationId}::${loginId}`;
    const state = get();
    if (state.loadedFor === key && state.data) return;
    if (state.isLoading) return;

    set({ isLoading: true, error: null });

    // Fetch employee + org in parallel — they're independent.
    const [employeeResult, orgResult] = await Promise.allSettled([
      (async () => {
        const response = await HrmEmployeeService.searchByKeyword(organizationId, loginId);
        const items = (response?.employees || []) as EmployeeDirectoryRow[];
        const match =
          items.find(e => e.workEmail?.toLowerCase() === loginId.toLowerCase()) ||
          items[0];
        if (!match) return null;

        // Directory rows often omit photo data. Fetch the full profile to
        // get photoBase64 / photoUrl reliably.
        let photoUrl = match.photoUrl;
        let photoBase64: string | undefined;
        try {
          const fullProfile = await HrmEmployeeService.fetchProfile(organizationId, match.handle);
          photoUrl = fullProfile.basicDetails?.photoUrl || photoUrl;
          photoBase64 = fullProfile.basicDetails?.photoBase64;
        } catch {
          // ignore — fall back to whatever the directory row had
        }

        return {
          handle: match.handle,
          fullName: match.fullName,
          workEmail: match.workEmail,
          photoUrl,
          photoBase64,
          designation: match.role,
          department: match.department,
        } satisfies CurrentEmployeeCard;
      })(),
      (async () => {
        try {
          // Step 1: by-site → gives us the handle (and possibly the logo).
          // Backend may wrap the response in different shapes; normalize.
          const raw = (await HrmOrganizationService.fetchBySite(organizationId)) as unknown;
          let summary: Record<string, unknown> | null = null;
          if (Array.isArray(raw)) {
            summary = (raw[0] as Record<string, unknown>) || null;
          } else if (raw && typeof raw === 'object') {
            // Some backends wrap the object inside `{ data: ... }` or
            // `{ company: ... }`. Unwrap if needed.
            const obj = raw as Record<string, unknown>;
            const inner = (obj.data || obj.company || obj.companyProfile) as
              | Record<string, unknown>
              | undefined;
            summary = (inner && typeof inner === 'object' ? inner : obj) ?? null;
          }
          if (!summary) {
            console.warn('[currentEmployeeStore] fetchBySite returned empty', raw);
            return null;
          }

          // Step 2: full retrieve by handle — the by-site endpoint sometimes
          // omits binary fields like logoBase64 to keep the response small.
          let company = summary;
          const handle = summary.handle as string | undefined;
          if (handle) {
            try {
              const full = (await HrmOrganizationService.fetchCompanyByHandle(
                organizationId,
                handle,
              )) as unknown as Record<string, unknown>;
              if (full && typeof full === 'object') {
                company = full;
              }
            } catch (err) {
              console.warn('[currentEmployeeStore] fetchCompanyByHandle failed', err);
            }
          }

          // Normalize logo source. Backend stores either as data URL,
          // raw base64, or a remote URL.
          const logoUrl = company.logoUrl as string | undefined;
          const logoBase64 = company.logoBase64 as string | undefined;
          let logoSrc = logoUrl || '';
          if (!logoSrc && logoBase64) {
            logoSrc = logoBase64.startsWith('data:')
              ? logoBase64
              : `data:image/png;base64,${logoBase64}`;
          }

          if (!logoSrc) {
            console.warn(
              '[currentEmployeeStore] No org logo found in response. Available keys:',
              Object.keys(company),
            );
          }

          return {
            legalName: company.legalName as string | undefined,
            tradeName: company.tradeName as string | undefined,
            logoUrl: logoSrc || undefined,
            logoBase64,
          } satisfies CurrentOrgCard;
        } catch (err) {
          console.warn('[currentEmployeeStore] org fetch failed', err);
          return null;
        }
      })(),
    ]);

    const data =
      employeeResult.status === 'fulfilled' ? employeeResult.value : null;
    const org = orgResult.status === 'fulfilled' ? orgResult.value : null;

    set({
      data,
      org,
      isLoading: false,
      loadedFor: key,
      error: data ? null : 'No employee record found',
    });
  },

  reset: () => set({ data: null, org: null, isLoading: false, error: null, loadedFor: '' }),
}));
