'use client';

import React, { useCallback, useEffect, useMemo } from 'react';
import DepartmentTree from '../organisms/DepartmentTree';
import DepartmentForm from '../organisms/DepartmentForm';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
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
        {isFormOpen && <DepartmentForm onClose={handleClose} />}
      </div>
    </div>
  );
};

export default DepartmentTemplate;
