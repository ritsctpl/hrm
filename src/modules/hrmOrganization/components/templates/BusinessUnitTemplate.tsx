'use client';

import React, { useCallback, useMemo } from 'react';
import BusinessUnitTable from '../organisms/BusinessUnitTable';
import BusinessUnitForm from '../organisms/BusinessUnitForm';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { BusinessUnit } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const BusinessUnitTemplate: React.FC = () => {
  const {
    businessUnit,
    selectBusinessUnit,
    setBusinessUnitCreating,
  } = useHrmOrganizationStore();

  const isFormOpen = useMemo(
    () => businessUnit.selected !== null || businessUnit.isCreating,
    [businessUnit.selected, businessUnit.isCreating]
  );

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
        {isFormOpen && <BusinessUnitForm onClose={handleClose} />}
      </div>
    </div>
  );
};

export default BusinessUnitTemplate;
