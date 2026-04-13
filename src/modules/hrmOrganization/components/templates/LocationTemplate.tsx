'use client';

import React, { useCallback, useMemo } from 'react';
import LocationTable from '../organisms/LocationTable';
import LocationForm from '../organisms/LocationForm';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import type { Location } from '../../types/domain.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const LocationTemplate: React.FC = () => {
  const {
    location,
    selectLocation,
    setLocationCreating,
  } = useHrmOrganizationStore();

  const permissions = useOrganizationPermissions();

  const isFormOpen = useMemo(
    () => location.selected !== null || location.isCreating,
    [location.selected, location.isCreating]
  );

  // Determine if form should be read-only
  // For new records: check ADD permission
  // For existing records: check EDIT permission
  const isReadOnly = useMemo(() => {
    if (location.isCreating) {
      // Creating new record - need ADD permission
      return !permissions.canAddLocation;
    } else {
      // Editing existing record - need EDIT permission (VIEW-only = read-only)
      return permissions.canViewLocation && !permissions.canEditLocation;
    }
  }, [
    location.isCreating,
    permissions.canAddLocation,
    permissions.canViewLocation,
    permissions.canEditLocation,
  ]);

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
        {isFormOpen && <LocationForm onClose={handleClose} readOnly={isReadOnly} />}
      </div>
    </div>
  );
};

export default LocationTemplate;
