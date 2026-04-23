'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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

  // View-first pattern: clicking the dept name opens the form read-only.
  // The user must explicitly click the pencil icon (or the header Edit
  // button) to enter edit mode. The handlers below are the single source
  // of truth for `editMode` — this effect ONLY force-engages edit mode
  // when the user kicks off creation; it must NOT reset on selection
  // changes, or the edit-icon click would be immediately undone.
  const [editMode, setEditMode] = useState(false);
  useEffect(() => {
    if (department.isCreating) setEditMode(true);
  }, [department.isCreating]);

  const isReadOnly = useMemo(() => {
    if (department.isCreating) {
      // Creating: allow editing only if the user has ADD permission.
      return !permissions.canAddDepartment;
    }
    // Existing record: read-only unless the user explicitly entered edit
    // mode AND has EDIT permission. View-only permission stays read-only.
    return !(editMode && permissions.canEditDepartment);
  }, [
    department.isCreating,
    editMode,
    permissions.canAddDepartment,
    permissions.canEditDepartment,
  ]);

  // Row click → open in view mode.
  const handleSelect = useCallback(
    (dept: Department) => {
      selectDepartment(dept);
      setEditMode(false);
    },
    [selectDepartment]
  );

  // Pencil icon → open directly in edit mode.
  const handleEdit = useCallback(
    (dept: Department) => {
      selectDepartment(dept);
      setEditMode(true);
    },
    [selectDepartment]
  );

  // Header "Edit" button inside the form switches an open view to edit.
  const handleEnterEditMode = useCallback(() => {
    setEditMode(true);
  }, []);

  const handleAdd = useCallback(() => {
    setDepartmentCreating(true);
  }, [setDepartmentCreating]);

  const handleClose = useCallback(() => {
    selectDepartment(null);
    setEditMode(false);
  }, [selectDepartment]);

  return (
    <div className={mainStyles.body}>
      <div
        className={`${mainStyles.tableContainer} ${isFormOpen ? mainStyles.shrink : ''}`}
      >
        <DepartmentTree
          onSelect={handleSelect}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </div>

      <div
        className={`${mainStyles.formContainer} ${isFormOpen ? mainStyles.show : ''}`}
      >
        {isFormOpen && (
          <DepartmentForm
            onClose={handleClose}
            readOnly={isReadOnly}
            onEnterEditMode={
              isReadOnly && !department.isCreating && permissions.canEditDepartment
                ? handleEnterEditMode
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default DepartmentTemplate;
