'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { decryptToken } from '../utils/encryption';
import jwtDecode from 'jwt-decode';
import { parseCookies } from 'nookies';
import { useHrmRbacStore } from '../modules/hrmAccess/stores/hrmRbacStore';
import { RbacContextProvider } from '../modules/hrmAccess/context/RbacContext';
import type { DecodedToken } from '../modules/userMaintenance/types/userTypes';

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
      const tokenRole = decoded.role;
      const cookies = parseCookies();
      const initialOrganizationId = cookies.site || undefined;

      initialize(username, initialOrganizationId, tokenRole).then(() => {
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
