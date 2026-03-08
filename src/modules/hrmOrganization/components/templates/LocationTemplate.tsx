'use client';

import React, { useCallback, useMemo } from 'react';
import LocationTable from '../organisms/LocationTable';
import LocationForm from '../organisms/LocationForm';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import type { Location } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const LocationTemplate: React.FC = () => {
  const {
    location,
    selectLocation,
    setLocationCreating,
  } = useHrmOrganizationStore();

  const isFormOpen = useMemo(
    () => location.selected !== null || location.isCreating,
    [location.selected, location.isCreating]
  );

  const handleSelect = useCallback(
    (loc: Location) => {
      selectLocation(loc);
    },
    [selectLocation]
  );

  const handleAdd = useCallback(() => {
    setLocationCreating(true);
  }, [setLocationCreating]);

  const handleClose = useCallback(() => {
    selectLocation(null);
  }, [selectLocation]);

  return (
    <div className={mainStyles.body}>
      <div
        className={`${mainStyles.tableContainer} ${isFormOpen ? mainStyles.shrink : ''}`}
      >
        <LocationTable onSelect={handleSelect} onAdd={handleAdd} />
      </div>

      <div
        className={`${mainStyles.formContainer} ${isFormOpen ? mainStyles.show : ''}`}
      >
        {isFormOpen && <LocationForm onClose={handleClose} />}
      </div>
    </div>
  );
};

export default LocationTemplate;
