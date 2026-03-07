'use client';

import { useCallback } from 'react';
import { useHrmOrganizationStore } from '../stores/hrmOrganizationStore';
import type { MainTabKey } from '../types/ui.types';

/**
 * UI state hook for the HRM Organization module.
 * Provides tab switching and common UI interactions.
 */
export function useHrmOrganizationUI() {
  const activeMainTab = useHrmOrganizationStore((s) => s.activeMainTab);
  const setActiveMainTab = useHrmOrganizationStore((s) => s.setActiveMainTab);
  const fetchBusinessUnits = useHrmOrganizationStore((s) => s.fetchBusinessUnits);
  const companyHandle = useHrmOrganizationStore((s) => s.companyProfile.data?.handle);

  const handleMainTabChange = useCallback(
    (key: string) => {
      const tab = key as MainTabKey;
      setActiveMainTab(tab);

      // Auto-load BUs when switching to business unit tab
      if (tab === 'businessUnit' && companyHandle) {
        fetchBusinessUnits();
      }
    },
    [setActiveMainTab, fetchBusinessUnits, companyHandle],
  );

  return {
    activeMainTab,
    handleMainTabChange,
  };
}
