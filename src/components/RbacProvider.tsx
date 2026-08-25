'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { decryptToken } from '../utils/encryption';
import jwtDecode from 'jwt-decode';
import { parseCookies } from 'nookies';
import { useHrmRbacStore } from '../modules/hrmAccess/stores/hrmRbacStore';
import { RbacContextProvider } from '../modules/hrmAccess/context/RbacContext';
import { HrmEmployeeService } from '../modules/hrmEmployee/services/hrmEmployeeService';
import type { DecodedToken } from '../modules/userMaintenance/types/userTypes';
import type { EmployeeDirectoryRow } from '../modules/hrmEmployee/types/api.types';

/**
 * `hrm_user_role_assignment.userId` is keyed by workEmail for almost every
 * employee (only the seed admin has an `Employee.userId` equal to their
 * Keycloak login) — see currentEmployeeStore's identical resolution for the
 * same reporting-manager-logs-in-with-a-username problem. Sending the raw
 * Keycloak `preferred_username` straight to `initialize()` silently
 * produced an empty module/permission set for everyone else.
 *
 * Tries the login as both identity forms — matches directory rows by
 * `userId` first (covers accounts where the login *is* the linked userId),
 * then by `workEmail` — and falls back to the raw login untouched if
 * nothing matches, so this never turns a previously-working call into one
 * that fails outright.
 */
async function resolveRbacIdentity(organizationId: string | undefined, login: string): Promise<string> {
  if (!organizationId || !login) return login;
  try {
    const response = await HrmEmployeeService.searchByKeyword(organizationId, login);
    const items = (response?.employees || []) as EmployeeDirectoryRow[];
    const lowerLogin = login.toLowerCase();
    const match =
      items.find((e) => (e.userId || '').toLowerCase() === lowerLogin) ||
      items.find((e) => (e.workEmail || '').toLowerCase() === lowerLogin);
    return match?.workEmail || login;
  } catch (err) {
    console.warn('[RbacProvider] identity resolution failed, using raw login', err);
    return login;
  }
}

export default function RbacProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, token } = useAuth();
  const { initialize, isReady, isLoading, error } = useHrmRbacStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token || initialized) return;

    try {
      const decryptedToken = decryptToken(token);
      const decoded: DecodedToken = jwtDecode<DecodedToken>(decryptedToken);
      const username = decoded.preferred_username;
      const realmRoles = decoded.realm_access?.roles ?? [];
      const isSuperAdmin = realmRoles.includes('super_admin');
      const cookies = parseCookies();
      const initialOrganizationId = cookies.site || undefined;

      console.log('[SUPER_ADMIN] RbacProvider decoded token', {
        username,
        realmRoles,
        isSuperAdmin,
        initialOrganizationId,
        fullClaims: decoded,
      });

      // Super admins are resolved via fetchAllOrganizations(), not the
      // identity-keyed userModulesByOrganization lookup, so the
      // username/email mismatch doesn't apply to that path.
      const identityPromise = isSuperAdmin
        ? Promise.resolve(username)
        : resolveRbacIdentity(initialOrganizationId, username);

      identityPromise.then((resolvedUserId) =>
        initialize(resolvedUserId, initialOrganizationId, isSuperAdmin)
      ).then(() => {
        setInitialized(true);
      });
    } catch (err) {
      console.error('RbacProvider: Failed to decode token', err);
    }
  }, [isAuthenticated, token, initialized, initialize]);

  return (
    <RbacContextProvider>
      {children}
    </RbacContextProvider>
  );
}
