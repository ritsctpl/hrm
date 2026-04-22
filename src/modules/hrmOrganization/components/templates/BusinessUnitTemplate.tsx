'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import BusinessUnitTable from '../organisms/BusinessUnitTable';
import BusinessUnitForm from '../organisms/BusinessUnitForm';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import type { BusinessUnit } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const BusinessUnitTemplate: React.FC = () => {
  const {
    businessUnit,
    selectBusinessUnit,
    setBusinessUnitCreating,
  } = useHrmOrganizationStore();

  const permissions = useOrganizationPermissions();

  // View-first pattern: row click opens read-only details. The user enters
  // edit mode explicitly via the Action-column pencil or the Edit button in
  // the form header. Reset to view whenever the selection changes.
  const [editMode, setEditMode] = useState(false);
  useEffect(() => {
    if (businessUnit.isCreating) {
      setEditMode(true);
    } else if (businessUnit.selected?.handle) {
      setEditMode(false);
    } else {
      setEditMode(false);
    }
  }, [businessUnit.selected?.handle, businessUnit.isCreating]);

  const isFormOpen = useMemo(
    () => businessUnit.selected !== null || businessUnit.isCreating,
    [businessUnit.selected, businessUnit.isCreating]
  );

  const isReadOnly = useMemo(() => {
    if (businessUnit.isCreating) {
      return !permissions.canAddBusinessUnit;
    }
    // Existing record: read-only unless user explicitly entered edit mode
    // AND has EDIT permission.
    return !(editMode && permissions.canEditBusinessUnit);
  }, [
    businessUnit.isCreating,
    editMode,
    permissions.canAddBusinessUnit,
    permissions.canEditBusinessUnit,
  ]);

  const handleSelect = useCallback(
    (bu: BusinessUnit) => {
      selectBusinessUnit(bu);
      setEditMode(false);
    },
    [selectBusinessUnit]
  );

  const handleEdit = useCallback(
    (bu: BusinessUnit) => {
      selectBusinessUnit(bu);
      setEditMode(true);
    },
    [selectBusinessUnit]
  );

  const handleEnterEditMode = useCallback(() => {
    setEditMode(true);
  }, []);

  const handleAdd = useCallback(() => {
    setBusinessUnitCreating(true);
  }, [setBusinessUnitCreating]);

  const handleClose = useCallback(() => {
    selectBusinessUnit(null);
    setEditMode(false);
  }, [selectBusinessUnit]);

  return (
    <div className={mainStyles.body}>
      <div
        className={`${mainStyles.tableContainer} ${isFormOpen ? mainStyles.shrink : ''}`}
      >
        <BusinessUnitTable
          onSelect={handleSelect}
          onEdit={handleEdit}
          onAdd={handleAdd}
        />
      </div>

      <div
        className={`${mainStyles.formContainer} ${isFormOpen ? mainStyles.show : ''}`}
      >
        {isFormOpen && (
          <BusinessUnitForm
            onClose={handleClose}
            readOnly={isReadOnly}
            onEnterEditMode={isReadOnly && !businessUnit.isCreating && permissions.canEditBusinessUnit ? handleEnterEditMode : undefined}
          />
        )}
      </div>
    </div>
  );
};

export default BusinessUnitTemplate;
