'use client';

import { useCallback } from 'react';
import { useHrmOrganizationStore } from '../stores/hrmOrganizationStore';
import type { DetailTabKey } from '../types/ui.types';

/**
 * UI state hook for the HRM Organization module.
 * Provides view switching and tab interactions.
 */
export function useHrmOrganizationUI() {
  const view = useHrmOrganizationStore((s) => s.view);
  const activeDetailTab = useHrmOrganizationStore((s) => s.activeDetailTab);
  const setActiveDetailTab = useHrmOrganizationStore((s) => s.setActiveDetailTab);
  const navigateToList = useHrmOrganizationStore((s) => s.navigateToList);
  const navigateToDetail = useHrmOrganizationStore((s) => s.navigateToDetail);
  const fetchBusinessUnits = useHrmOrganizationStore((s) => s.fetchBusinessUnits);
  const companyHandle = useHrmOrganizationStore((s) => s.companyProfile.data?.handle);

  const handleDetailTabChange = useCallback(
    (key: string) => {
      const tab = key as DetailTabKey;
      setActiveDetailTab(tab);

      if (tab === 'businessUnits' && companyHandle) {
        fetchBusinessUnits();
      }
    },
    [setActiveDetailTab, fetchBusinessUnits, companyHandle],
  );

  return {
    view,
    activeDetailTab,
    handleDetailTabChange,
    navigateToList,
    navigateToDetail,
  };
}
