'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import DepartmentTree from '../organisms/DepartmentTree';
import DepartmentForm from '../organisms/DepartmentForm';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import type { Department } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const DepartmentTemplate: React.FC = () => {
  const {
    department,
    businessUnit,
    selectDepartment,
    setDepartmentCreating,
    fetchBusinessUnits,
    companyProfile,
  } = useHrmOrganizationStore();

  const permissions = useOrganizationPermissions();

  // Ensure BU list is loaded (needed for department form's parent BU context)
  useEffect(() => {
    if (companyProfile.data?.handle && businessUnit.list.length === 0) {
      fetchBusinessUnits();
    }
  }, [companyProfile.data?.handle, businessUnit.list.length, fetchBusinessUnits]);

  const isFormOpen = useMemo(
    () => department.selected !== null || department.isCreating,
    [department.selected, department.isCreating]
  );

  // Determine if form should be read-only
  // For new records: check ADD permission
  // For existing records: check EDIT permission
  const isReadOnly = useMemo(() => {
    if (department.isCreating) {
      // Creating new record - need ADD permission
      return !permissions.canAddDepartment;
    } else {
      // Editing existing record - need EDIT permission (VIEW-only = read-only)
      return permissions.canViewDepartment && !permissions.canEditDepartment;
    }
  }, [
    department.isCreating,
    permissions.canAddDepartment,
    permissions.canViewDepartment,
    permissions.canEditDepartment,
  ]);

  const handleSelect = useCallback(
    (dept: Department) => {
      selectDepartment(dept);
    },
    [selectDepartment]
  );

  const handleAdd = useCallback(() => {
    setDepartmentCreating(true);
  }, [setDepartmentCreating]);

  const handleClose = useCallback(() => {
    selectDepartment(null);
  }, [selectDepartment]);

  return (
    <div className={mainStyles.body}>
      <div
        className={`${mainStyles.tableContainer} ${isFormOpen ? mainStyles.shrink : ''}`}
      >
        <DepartmentTree onSelect={handleSelect} onAdd={handleAdd} />
      </div>

      <div
        className={`${mainStyles.formContainer} ${isFormOpen ? mainStyles.show : ''}`}
      >
        {isFormOpen && <DepartmentForm onClose={handleClose} readOnly={isReadOnly} />}
      </div>
    </div>
  );
};

export default DepartmentTemplate;
