/**
 * HrmEmployeeLanding
 * Entry point for the Employee Directory view.
 * Connects to the Zustand store via hooks and delegates rendering
 * to EmployeeDirectoryTemplate.
 */

'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { useEmployeeDirectory } from './hooks/useHrmEmployeeData';
import EmployeeDirectoryTemplate from './components/templates/EmployeeDirectoryTemplate';
import OnboardingWizard from './components/organisms/OnboardingWizard';
import BulkImportPanel from './components/organisms/BulkImportPanel';
import type { DirectoryFilters } from './types/ui.types';

interface HrmEmployeeLandingProps {
  onSelectEmployee: (handle: string) => void;
}

const HrmEmployeeLanding: React.FC<HrmEmployeeLandingProps> = ({ onSelectEmployee }) => {
  const {
    employees,
    totalCount,
    currentPage,
    pageSize,
    isLoading,
    viewMode,
    searchKeyword,
    departmentFilter,
    statusFilter,
    buFilter,
    setViewMode,
    setPage,
    handleSearch,
    handleFilterChange,
    openOnboarding,
    refresh,
  } = useEmployeeDirectory();

  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  // Derive unique departments / BUs from data for filter dropdowns
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

  const businessUnits = useMemo(() => {
    // BU data would ideally come from a lookup endpoint;
    // for now derive from what we have if the directory response included it
    return [] as string[];
  }, []);

  const filters: DirectoryFilters = {
    departmentFilter,
    statusFilter,
    buFilter,
  };

  const handleRowClick = useCallback(
    (handle: string) => {
      onSelectEmployee(handle);
    },
    [onSelectEmployee]
  );

  return (
    <>
      <EmployeeDirectoryTemplate
        employees={employees}
        totalCount={totalCount}
        currentPage={currentPage}
        pageSize={pageSize}
        isLoading={isLoading}
        viewMode={viewMode}
        searchKeyword={searchKeyword}
        filters={filters}
        departments={departments}
        businessUnits={businessUnits}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onViewModeChange={setViewMode}
        onPageChange={setPage}
        onRowClick={handleRowClick}
        onAddEmployee={openOnboarding}
        onBulkImport={() => setBulkImportOpen(true)}
        onRefresh={refresh}
      />

      {/* Onboarding Wizard */}
      <OnboardingWizard />

      {/* Bulk Import */}
      <BulkImportPanel
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
      />
    </>
  );
};

export default HrmEmployeeLanding;
