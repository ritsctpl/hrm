/**
 * useHrmEmployeeData Hook
 * Convenience hook that wraps the Zustand store and provides
 * derived data / side-effect orchestration for the Employee module.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useHrmEmployeeStore } from '../stores/hrmEmployeeStore';
import { useHrmRbacStore } from '../../hrmAccess/stores/hrmRbacStore';
import type { DirectoryFilters } from '../types/ui.types';

/**
 * Debounce delay for search input (ms)
 */
const SEARCH_DEBOUNCE_MS = 400;

/**
 * Hook for the Employee Directory (Landing) page.
 * Manages initial data load and search debounce.
 */
export function useEmployeeDirectory() {
  const {
    directory,
    fetchDirectory,
    setViewMode,
    setSearchKeyword,
    setFilters,
    setPage,
    openOnboarding,
  } = useHrmEmployeeStore();

  const { isReady: rbacReady, currentOrganizationId } = useHrmRbacStore();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial data load — wait for RBAC to finish so the site cookie is set
  useEffect(() => {
    if (!rbacReady || !currentOrganizationId) return;
    fetchDirectory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rbacReady, currentOrganizationId]);

  // Debounced search handler
  const handleSearch = useCallback(
    (keyword: string) => {
      setSearchKeyword(keyword);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        fetchDirectory();
      }, SEARCH_DEBOUNCE_MS);
    },
    [setSearchKeyword, fetchDirectory]
  );

  // Filter handler with immediate fetch
  const handleFilterChange = useCallback(
    (filters: Partial<DirectoryFilters>) => {
      setFilters(filters);
      fetchDirectory();
    },
    [setFilters, fetchDirectory]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return {
    ...directory,
    setViewMode,
    setPage,
    handleSearch,
    handleFilterChange,
    openOnboarding,
    refresh: fetchDirectory,
  };
}

/**
 * Hook for the Employee Profile (Screen) page.
 * Handles loading profile data by handle.
 */
export function useEmployeeProfile(handle: string | null) {
  const {
    profile,
    fetchProfile,
    setActiveTab,
    setEditing,
    updateProfile,
    clearProfile,
  } = useHrmEmployeeStore();

  useEffect(() => {
    if (handle) {
      fetchProfile(handle);
    }
    return () => {
      clearProfile();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [handle]);

  return {
    ...profile,
    setActiveTab,
    setEditing,
    updateProfile,
    refresh: handle ? () => fetchProfile(handle) : () => Promise.resolve(),
  };
}

/**
 * Hook for the Onboarding Wizard.
 */
export function useOnboardingWizard() {
  const {
    onboarding,
    openOnboarding,
    closeOnboarding,
    setOnboardingStep,
    updateOnboardingDraft,
    submitOnboarding,
  } = useHrmEmployeeStore();

  return {
    ...onboarding,
    openOnboarding,
    closeOnboarding,
    setOnboardingStep,
    updateOnboardingDraft,
    submitOnboarding,
  };
}
