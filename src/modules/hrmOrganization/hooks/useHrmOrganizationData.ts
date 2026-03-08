/**
 * HRM Organization Module - Custom Hook
 * Provides data fetching orchestration and derived state
 */

'use client';

import { useEffect, useCallback, useMemo } from 'react';
import { useHrmOrganizationStore } from '../stores/hrmOrganizationStore';
import type { BusinessUnit, Department, DepartmentNode } from '../types/domain.types';

export function useHrmOrganizationData() {
  const store = useHrmOrganizationStore();

  // Fetch business units when company profile loads and on BU tab
  useEffect(() => {
    if (store.companyProfile.data?.handle && store.activeDetailTab === 'businessUnits') {
      store.fetchBusinessUnits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.companyProfile.data?.handle, store.activeDetailTab]);

  // Fetch departments when BU is selected and on departments tab
  useEffect(() => {
    if (store.department.selectedBuHandle && store.activeDetailTab === 'departments') {
      store.fetchDepartments(store.department.selectedBuHandle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.department.selectedBuHandle, store.activeDetailTab]);

  // Filtered business units based on search
  const filteredBusinessUnits: BusinessUnit[] = useMemo(() => {
    const searchLower = store.businessUnit.searchText.toLowerCase();
    if (!searchLower) return store.businessUnit.list;
    return store.businessUnit.list.filter(
      (bu) =>
        bu.buCode.toLowerCase().includes(searchLower) ||
        bu.buName.toLowerCase().includes(searchLower) ||
        bu.buType.toLowerCase().includes(searchLower)
    );
  }, [store.businessUnit.list, store.businessUnit.searchText]);

  // Filter department tree nodes based on search
  const filterTreeNodes = useCallback(
    (nodes: DepartmentNode[], search: string): DepartmentNode[] => {
      if (!search) return nodes;
      const searchLower = search.toLowerCase();
      return nodes.reduce<DepartmentNode[]>((acc, node) => {
        const matches =
          node.deptCode.toLowerCase().includes(searchLower) ||
          node.deptName.toLowerCase().includes(searchLower);
        const filteredChildren = node.children
          ? filterTreeNodes(node.children, search)
          : [];

        if (matches || filteredChildren.length > 0) {
          acc.push({
            ...node,
            children: filteredChildren.length > 0 ? filteredChildren : node.children,
          });
        }
        return acc;
      }, []);
    },
    []
  );

  const filteredDepartmentHierarchy: DepartmentNode[] = useMemo(() => {
    return filterTreeNodes(
      store.department.hierarchy,
      store.department.searchText
    );
  }, [store.department.hierarchy, store.department.searchText, filterTreeNodes]);

  // Flat list of departments for parent select
  const flatDepartmentList: Department[] = useMemo(() => {
    return store.department.list;
  }, [store.department.list]);

  // Check if BU form panel should be open
  const isBuFormOpen: boolean = useMemo(() => {
    return store.businessUnit.selected !== null || store.businessUnit.isCreating;
  }, [store.businessUnit.selected, store.businessUnit.isCreating]);

  // Check if Department form panel should be open
  const isDeptFormOpen: boolean = useMemo(() => {
    return store.department.selected !== null || store.department.isCreating;
  }, [store.department.selected, store.department.isCreating]);

  return {
    ...store,
    filteredBusinessUnits,
    filteredDepartmentHierarchy,
    flatDepartmentList,
    isBuFormOpen,
    isDeptFormOpen,
  };
}
