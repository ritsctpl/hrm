'use client';
import '@/utils/i18n';
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { setCookie, destroyCookie, parseCookies } from 'nookies';
import { getKeycloakInstance, getKeycloakInitOptions } from '../keycloak';
import jwtDecode from 'jwt-decode';

interface AuthContextProps {
  children: ReactNode;
}

interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthContextProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isTabActive, setIsTabActive] = useState(true); // Default to true, assuming the app starts active
  
  // Handle visibility change (tab focus)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setIsTabActive(true);
      } else {
        setIsTabActive(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Effect to check the token expiration and log out if expired
  const checkTokenExpiration = (token: string | null) => {
    if (token) {
      try {
        const decodedToken = jwtDecode<{ exp: number }>(token);
        if (decodedToken.exp * 1000 < Date.now()) {
          return true; // Token expired
        }
      } catch (err) {
        console.error('Error checking token expiration:', err);
        return true;
      }
    }
    return false;
  };

  // Effect to initialize Keycloak and check token periodically
  useEffect(() => {
    const initializeKeycloak = async () => {
      try {
        const keycloak = await getKeycloakInstance();
        const initOptions = await getKeycloakInitOptions();
        const authenticated = await keycloak.init(initOptions);

        setIsAuthenticated(authenticated);

        if (authenticated) {
          const rawToken = keycloak.token!;
          setToken(rawToken);
          setCookie(null, 'token', rawToken, { path: '/', sameSite: 'lax' });
          if (keycloak.refreshToken) {
            setCookie(null, 'refreshToken', keycloak.refreshToken, { path: '/' });
          }
          if (keycloak.realmAccess?.roles) {
            setCookie(null, 'role', `${keycloak.realmAccess.roles}`, { path: '/' });
          }
          // Persist the employee's role claim from the token so modules that
          // read `cookies.userRole` (hrmLeave, hrmDashboard, WFH, etc.) have it
          // available without re-decoding the JWT on every page.
          const employeeRole = (keycloak.tokenParsed as Record<string, unknown> | undefined)
            ?.employeeRole;
          if (employeeRole) {
            setCookie(null, 'userRole', `${employeeRole}`, { path: '/', sameSite: 'lax' });
          }
        } else {
          destroyCookie(null, 'token');
        }
      } catch (err) {
        console.error('Failed to initialize Keycloak:', err);
      }
    };

    initializeKeycloak();
  }, []);

  // Effect to periodically check the token expiration every 5 seconds
  useEffect(() => {
    if (isAuthenticated && token) {
      const checkInterval = setInterval(() => {
        if (checkTokenExpiration(parseCookies().token)) {
          if (isTabActive) {
            logout(); // Log out if token is expired
          }
          clearInterval(checkInterval);
        }
      }, 5000); // Check every 5 seconds

      return () => clearInterval(checkInterval);
    }
  }, [isAuthenticated, token, isTabActive]); // Added `isTabActive` as a dependency

  // Login function to initiate Keycloak login
  const login = async () => {
    try {
      const keycloak = await getKeycloakInstance();
      keycloak.login();
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  // Logout function to log out from Keycloak and clear cookies
  const logout = async () => {
    try {
      const keycloak = await getKeycloakInstance();
      // Always return to the /hrm root after logout. The login redirectUri is
      // window.location.href, so without this the post-logout URL would be
      // whatever screen was open (e.g. an employee detail page) and the next
      // user logging in would land there. Forcing the root guarantees every
      // fresh login starts on the /hrm home page.
      const postLogoutRedirectUri =
        typeof window !== 'undefined'
          ? `${window.location.origin}/hrm`
          : undefined;
      keycloak.logout(
        postLogoutRedirectUri ? { redirectUri: postLogoutRedirectUri } : undefined,
      );
      setIsAuthenticated(false);
      setToken(null);
      destroyCookie(null, 'token');
      destroyCookie(null, 'role');
      destroyCookie(null, 'userRole');
      destroyCookie(null, 'employeeCode');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  // Return the AuthContext provider with values
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
