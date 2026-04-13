'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Segmented } from 'antd';
import { ApartmentOutlined, EnvironmentOutlined, ClusterOutlined } from '@ant-design/icons';
import DepartmentTree from '../organisms/DepartmentTree';
import DepartmentForm from '../organisms/DepartmentForm';
import LocationTable from '../organisms/LocationTable';
import LocationForm from '../organisms/LocationForm';
import OrgHierarchyTree from '../organisms/OrgHierarchyTree';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import { useOrganizationPermissions } from '../../hooks/useOrganizationPermissions';
import type { Department, Location } from '../../types/domain.types';
import type { StructureSubView } from '../../types/ui.types';
import mainStyles from '../../styles/HrmOrganization.module.css';

const StructureTemplate: React.FC = () => {
  const {
    department,
    location,
    businessUnit,
    companyProfile,
    selectDepartment,
    setDepartmentCreating,
    selectLocation,
    setLocationCreating,
    fetchBusinessUnits,
    fetchLocations,
  } = useHrmOrganizationStore();

  const permissions = useOrganizationPermissions();

  const [activeView, setActiveView] = useState<StructureSubView>('departments');

  // Ensure BU list is loaded for the BU selector in the department tree
  useEffect(() => {
    if (companyProfile.data?.handle && businessUnit.list.length === 0) {
      fetchBusinessUnits();
    }
  }, [companyProfile.data?.handle, businessUnit.list.length, fetchBusinessUnits]);

  // Ensure locations are loaded
  useEffect(() => {
    if (location.list.length === 0) {
      fetchLocations();
    }
  }, [location.list.length, fetchLocations]);

  // Department form state
  const isDeptFormOpen = useMemo(
    () => department.selected !== null || department.isCreating,
    [department.selected, department.isCreating]
  );

  // Determine if department form should be read-only
  const isDeptReadOnly = useMemo(() => {
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

  const handleDeptSelect = useCallback(
    (dept: Department) => {
      selectDepartment(dept);
    },
    [selectDepartment]
  );

  const handleDeptAdd = useCallback(() => {
    setDepartmentCreating(true);
  }, [setDepartmentCreating]);

  const handleDeptClose = useCallback(() => {
    selectDepartment(null);
  }, [selectDepartment]);

  // Location form state
  const isLocFormOpen = useMemo(
    () => location.selected !== null || location.isCreating,
    [location.selected, location.isCreating]
  );

  // Determine if location form should be read-only
  const isLocReadOnly = useMemo(() => {
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

  const handleLocSelect = useCallback(
    (loc: Location) => {
      selectLocation(loc);
    },
    [selectLocation]
  );

  const handleLocAdd = useCallback(() => {
    setLocationCreating(true);
  }, [setLocationCreating]);

  const handleLocClose = useCallback(() => {
    selectLocation(null);
  }, [selectLocation]);

  const handleViewChange = useCallback((value: string | number) => {
    setActiveView(value as StructureSubView);
  }, []);

  const segmentedOptions = [
    {
      label: (
        <span className={mainStyles.segmentLabel}>
          <ApartmentOutlined />
          Departments
        </span>
      ),
      value: 'departments',
    },
    {
      label: (
        <span className={mainStyles.segmentLabel}>
          <EnvironmentOutlined />
          Locations
        </span>
      ),
      value: 'locations',
    },
    {
      label: (
        <span className={mainStyles.segmentLabel}>
          <ClusterOutlined />
          Org Hierarchy
        </span>
      ),
      value: 'hierarchy',
    },
  ];

  return (
    <div className={mainStyles.structureContainer}>
      <div className={mainStyles.structureNav}>
        <Segmented
          options={segmentedOptions}
          value={activeView}
          onChange={handleViewChange}
          size="large"
        />
      </div>

      {/* Departments View */}
      {activeView === 'departments' && (
        <div className={mainStyles.body}>
          <div
            className={`${mainStyles.tableContainer} ${isDeptFormOpen ? mainStyles.shrink : ''}`}
          >
            <DepartmentTree onSelect={handleDeptSelect} onAdd={handleDeptAdd} />
          </div>
          <div
            className={`${mainStyles.formContainer} ${isDeptFormOpen ? mainStyles.show : ''}`}
          >
            {isDeptFormOpen && <DepartmentForm onClose={handleDeptClose} readOnly={isDeptReadOnly} />}
          </div>
        </div>
      )}

      {/* Locations View */}
      {activeView === 'locations' && (
        <div className={mainStyles.body}>
          <div
            className={`${mainStyles.tableContainer} ${isLocFormOpen ? mainStyles.shrink : ''}`}
          >
            <LocationTable onSelect={handleLocSelect} onAdd={handleLocAdd} />
          </div>
          <div
            className={`${mainStyles.formContainer} ${isLocFormOpen ? mainStyles.show : ''}`}
          >
            {isLocFormOpen && <LocationForm onClose={handleLocClose} readOnly={isLocReadOnly} />}
          </div>
        </div>
      )}

      {/* Hierarchy View */}
      {activeView === 'hierarchy' && (
        <div className={mainStyles.hierarchyContainer}>
          <OrgHierarchyTree />
        </div>
      )}
    </div>
  );
};

export default StructureTemplate;
