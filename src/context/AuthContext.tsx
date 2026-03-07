'use client';
import '@/utils/i18n';
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { setCookie, destroyCookie, parseCookies } from 'nookies';
import { getKeycloakInstance, keycloakInitOptions } from '../keycloak';
import { decryptToken, encryptToken } from '../utils/encryption';
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
        const decryptedToken = decryptToken(token);
        const decodedToken = jwtDecode<{ exp: number }>(decryptedToken);
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
        const authenticated = await keycloak.init(keycloakInitOptions);

        setIsAuthenticated(authenticated);

        if (authenticated) {
          const encryptedToken = encryptToken(keycloak.token!);
          setToken(encryptedToken);
          setCookie(null, 'token', encryptedToken, { path: '/' });
          if (keycloak.realmAccess?.roles) {
            setCookie(null, 'role', `${keycloak.realmAccess.roles}`, { path: '/' });
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
      keycloak.logout();
      setIsAuthenticated(false);
      setToken(null);
      destroyCookie(null, 'token');
      destroyCookie(null, 'role');
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
