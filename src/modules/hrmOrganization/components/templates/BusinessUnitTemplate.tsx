'use client';

import React, { useCallback, useMemo } from 'react';
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

  const isFormOpen = useMemo(
    () => businessUnit.selected !== null || businessUnit.isCreating,
    [businessUnit.selected, businessUnit.isCreating]
  );

  // Determine if form should be read-only
  // For new records: check ADD permission
  // For existing records: check EDIT permission
  const isReadOnly = useMemo(() => {
    if (businessUnit.isCreating) {
      // Creating new record - need ADD permission
      return !permissions.canAddBusinessUnit;
    } else {
      // Editing existing record - need EDIT permission (VIEW-only = read-only)
      return permissions.canViewBusinessUnit && !permissions.canEditBusinessUnit;
    }
  }, [
    businessUnit.isCreating,
    permissions.canAddBusinessUnit,
    permissions.canViewBusinessUnit,
    permissions.canEditBusinessUnit,
  ]);

  const handleSelect = useCallback(
    (bu: BusinessUnit) => {
      selectBusinessUnit(bu);
    },
    [selectBusinessUnit]
  );

  const handleAdd = useCallback(() => {
    setBusinessUnitCreating(true);
  }, [setBusinessUnitCreating]);

  const handleClose = useCallback(() => {
    selectBusinessUnit(null);
  }, [selectBusinessUnit]);

  return (
    <div className={mainStyles.body}>
      <div
        className={`${mainStyles.tableContainer} ${isFormOpen ? mainStyles.shrink : ''}`}
      >
        <BusinessUnitTable onSelect={handleSelect} onAdd={handleAdd} />
      </div>

      <div
        className={`${mainStyles.formContainer} ${isFormOpen ? mainStyles.show : ''}`}
      >
        {isFormOpen && <BusinessUnitForm onClose={handleClose} readOnly={isReadOnly} />}
      </div>
    </div>
  );
};

export default BusinessUnitTemplate;
