'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
// State tracks view-vs-edit mode for Dept + Location panes (view-first pattern).
import { Segmented } from 'antd';
import { ApartmentOutlined, EnvironmentOutlined, ClusterOutlined } from '@ant-design/icons';
import DepartmentTree from '../organisms/DepartmentTree';
import DepartmentForm from '../organisms/DepartmentForm';
import LocationTable from '../organisms/LocationTable';
import LocationForm from '../organisms/LocationForm';
import OrgHierarchyTree from '../organisms/OrgHierarchyTree';
import OrgHierarchyChart from '../organisms/OrgHierarchyChart';
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

  // View-first pattern: row click → view; explicit Edit icon → edit.
  // The handlers (handleDeptSelect / handleDeptEdit) control `deptEditMode`
  // directly. This effect ONLY force-engages edit mode when the user kicks
  // off creation — it must NOT blindly reset to false on selection changes,
  // otherwise clicking the edit icon triggers setDeptEditMode(true) and this
  // effect immediately overrides it back to false.
  const [deptEditMode, setDeptEditMode] = useState(false);
  useEffect(() => {
    if (department.isCreating) setDeptEditMode(true);
  }, [department.isCreating]);

  const isDeptReadOnly = useMemo(() => {
    if (department.isCreating) {
      return !permissions.canAddDepartment;
    }
    return !(deptEditMode && permissions.canEditDepartment);
  }, [
    department.isCreating,
    deptEditMode,
    permissions.canAddDepartment,
    permissions.canEditDepartment,
  ]);

  const handleDeptSelect = useCallback(
    (dept: Department) => {
      selectDepartment(dept);
      setDeptEditMode(false);
    },
    [selectDepartment]
  );

  const handleDeptEdit = useCallback(
    (dept: Department) => {
      selectDepartment(dept);
      setDeptEditMode(true);
    },
    [selectDepartment]
  );

  const handleDeptEnterEditMode = useCallback(() => {
    setDeptEditMode(true);
  }, []);

  const handleDeptAdd = useCallback(() => {
    setDepartmentCreating(true);
  }, [setDepartmentCreating]);

  const handleDeptClose = useCallback(() => {
    selectDepartment(null);
    setDeptEditMode(false);
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
    {
      label: (
        <span className={mainStyles.segmentLabel}>
          <ApartmentOutlined />
          Reporting Tree
        </span>
      ),
      value: 'reporting',
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
            <DepartmentTree
              onSelect={handleDeptSelect}
              onEdit={handleDeptEdit}
              onAdd={handleDeptAdd}
            />
          </div>
          <div
            className={`${mainStyles.formContainer} ${isDeptFormOpen ? mainStyles.show : ''}`}
          >
            {isDeptFormOpen && (
              <DepartmentForm
                onClose={handleDeptClose}
                readOnly={isDeptReadOnly}
                onEnterEditMode={
                  isDeptReadOnly && !department.isCreating && permissions.canEditDepartment
                    ? handleDeptEnterEditMode
                    : undefined
                }
              />
            )}
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

      {/* Reporting Tree View — embeds OrgHierarchyChart locked to the
          'tree' (employee reporting) view; the inline segmented switcher
          is hidden so this segment renders only the reporting tree. */}
      {activeView === 'reporting' && (
        <div className={mainStyles.hierarchyContainer}>
          <OrgHierarchyChart forceViewMode="tree" />
        </div>
      )}
    </div>
  );
};

export default StructureTemplate;
