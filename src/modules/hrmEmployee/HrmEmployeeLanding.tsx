'use client';

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import CommonAppBar from '@/components/CommonAppBar';
import { useEmployeeDirectory } from './hooks/useHrmEmployeeData';
import EmployeeDirectoryTemplate from './components/templates/EmployeeDirectoryTemplate';
import OnboardingWizard from './components/organisms/OnboardingWizard';
import BulkImportPanel from './components/organisms/BulkImportPanel';
import OffboardingPanel from './components/organisms/OffboardingPanel';
import BulkOperationsPanel from './components/organisms/BulkOperationsPanel';
import AlertsDashboard from './components/organisms/AlertsDashboard';
import EmployeeAuditLogPanel from './components/organisms/EmployeeAuditLogPanel';
import FieldSchemaConfigPanel from './components/organisms/FieldSchemaConfigPanel';
import EmployeeExportPanel from './components/organisms/EmployeeExportPanel';
import { useCan } from '../hrmAccess/hooks/useCan';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
import { useHrmRbacStore } from '../hrmAccess/stores/hrmRbacStore';
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
  const [offboardingOpen, setOffboardingOpen] = useState(false);
  const [bulkOpsOpen, setBulkOpsOpen] = useState(false);
  const [alertsOpen, setAlertsOpen] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);
  const [schemaConfigOpen, setSchemaConfigOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const perms = useCan('HRM_EMPLOYEE');

  // Load section-level permissions on mount
  const loadSectionPermissions = useHrmRbacStore(s => s.loadSectionPermissions);
  const isReady = useHrmRbacStore(s => s.isReady);

  useEffect(() => {
    if (isReady) {
      loadSectionPermissions('HRM_EMPLOYEE');
    }
  }, [isReady, loadSectionPermissions]);

  // Derive unique departments from data for filter dropdowns
  const departments = useMemo(
    () => Array.from(new Set(employees.map((e) => e.department).filter(Boolean))).sort(),
    [employees]
  );

  const businessUnits = useMemo(() => {
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
    <ModuleAccessGate moduleCode="HRM_EMPLOYEE" appTitle="Employee Directory">
    <div className="hrm-module-root">
      <CommonAppBar appTitle="Employee Directory" />
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
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
        onOffboarding={() => setOffboardingOpen(true)}
        onBulkOps={() => setBulkOpsOpen(true)}
        onAlerts={() => setAlertsOpen(true)}
        onExport={() => setExportOpen(true)}
        onAuditLog={() => setAuditOpen(true)}
        onFieldConfig={() => setSchemaConfigOpen(true)}
        canAdd={perms.canAdd}
        canEdit={perms.canEdit}
        canDelete={perms.canDelete}
      />

      {/* Onboarding Wizard */}
      <OnboardingWizard />

      {/* Bulk Import */}
      <BulkImportPanel
        open={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
      />

      {/* Offboarding */}
      <OffboardingPanel
        open={offboardingOpen}
        onClose={() => setOffboardingOpen(false)}
      />

      {/* Bulk Operations */}
      <BulkOperationsPanel
        open={bulkOpsOpen}
        onClose={() => setBulkOpsOpen(false)}
      />

      {/* Alerts Dashboard */}
      <AlertsDashboard
        open={alertsOpen}
        onClose={() => setAlertsOpen(false)}
      />

      {/* Audit Log */}
      <EmployeeAuditLogPanel
        open={auditOpen}
        onClose={() => setAuditOpen(false)}
      />

      {/* Field Schema Config */}
      <FieldSchemaConfigPanel
        open={schemaConfigOpen}
        onClose={() => setSchemaConfigOpen(false)}
      />

      {/* Export */}
      <EmployeeExportPanel
        open={exportOpen}
        onClose={() => setExportOpen(false)}
      />
      </div>
    </div>
    </ModuleAccessGate>
  );
};

export default HrmEmployeeLanding;
