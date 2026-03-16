'use client';

import React, { useEffect, useCallback } from 'react';
import { Tabs, Breadcrumb, Card, Tag, Spin, Button, message } from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  BankOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
  ClusterOutlined,
  AuditOutlined,
  BarChartOutlined,
  EditOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
import OrgSaveButton from '../atoms/OrgSaveButton';
import CompanyProfileTemplate from './CompanyProfileTemplate';
import BusinessUnitTemplate from './BusinessUnitTemplate';
import DepartmentTemplate from './DepartmentTemplate';
import LocationTemplate from './LocationTemplate';
import OrgHierarchyTree from '../organisms/OrgHierarchyTree';
import OrgAuditLogPanel from '../organisms/OrgAuditLogPanel';
import DataCompletenessPanel from '../organisms/DataCompletenessPanel';
import type { DetailTabKey } from '../../types/ui.types';
import styles from '../../styles/HrmOrganization.module.css';

const CompanyDetailTemplate: React.FC = () => {
  const {
    selectedCompanyHandle,
    activeDetailTab,
    setActiveDetailTab,
    navigateToList,
    fetchCompanyProfile,
    fetchBusinessUnits,
    fetchLocations,
    companyProfile,
    setCompanyEditing,
    saveCompanyProfile,
  } = useHrmOrganizationStore();

  const get = useHrmOrganizationStore.getState;
  const isNew = selectedCompanyHandle === 'new';
  const { isEditing, isSaving, errors, data } = companyProfile;

  const handleEdit = useCallback(() => {
    setCompanyEditing(true);
  }, [setCompanyEditing]);

  const handleCancel = useCallback(() => {
    setCompanyEditing(false);
  }, [setCompanyEditing]);

  const handleSave = useCallback(async () => {
    try {
      await saveCompanyProfile();
      
      const updatedState = get().companyProfile;
      const errorKeys = Object.keys(updatedState.errors).filter(key => key !== '_general');
      
      if (errorKeys.length > 0) {
        const errorMessages = errorKeys.map(key => `${key}: ${updatedState.errors[key]}`).join('\n');
        message.error(errorMessages);
      } else if (updatedState.errors._general) {
        message.error(updatedState.errors._general);
      } else {
        message.success('Company profile saved successfully');
      }
    } catch {
      message.error('Failed to save company profile');
    }
  }, [saveCompanyProfile]);

  // Load company profile on mount
  useEffect(() => {
    if (!isNew && selectedCompanyHandle) {
      fetchCompanyProfile(selectedCompanyHandle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompanyHandle]);

  // Once company profile loads, fetch BUs and locations
  useEffect(() => {
    if (companyProfile.data?.handle) {
      fetchBusinessUnits();
      fetchLocations();
    } else if (selectedCompanyHandle && selectedCompanyHandle !== 'new') {
      // If company profile is still loading but we have the handle, try fetching anyway
      fetchBusinessUnits();
      fetchLocations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyProfile.data?.handle, selectedCompanyHandle]);

  const companyName = companyProfile.data?.legalName || (isNew ? 'New Company' : 'Loading...');

  if (!isNew && companyProfile.isLoading && !companyProfile.data) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'profile',
      label: (
        <span className={styles.tabLabel}>
          <ShopOutlined />
          Profile
        </span>
      ),
      children: <CompanyProfileTemplate />,
    },
    {
      key: 'businessUnits',
      label: (
        <span className={styles.tabLabel}>
          <BankOutlined />
          Business Units
        </span>
      ),
      children: <BusinessUnitTemplate />,
      disabled: false,
    },
    {
      key: 'departments',
      label: (
        <span className={styles.tabLabel}>
          <ApartmentOutlined />
          Departments
        </span>
      ),
      children: <DepartmentTemplate />,
      disabled: false,
    },
    {
      key: 'locations',
      label: (
        <span className={styles.tabLabel}>
          <EnvironmentOutlined />
          Locations
        </span>
      ),
      children: <LocationTemplate />,
      disabled: false,
    },
    {
      key: 'hierarchy',
      label: (
        <span className={styles.tabLabel}>
          <ClusterOutlined />
          Hierarchy
        </span>
      ),
      children: (
        <div className={styles.hierarchyContainer}>
          <OrgHierarchyTree />
        </div>
      ),
      disabled: false,
    },
    {
      key: 'audit',
      label: (
        <span className={styles.tabLabel}>
          <AuditOutlined />
          Audit Log
        </span>
      ),
      children: <OrgAuditLogPanel />,
      disabled: isNew,
    },
    {
      key: 'reports',
      label: (
        <span className={styles.tabLabel}>
          <BarChartOutlined />
          Reports
        </span>
      ),
      children: <DataCompletenessPanel />,
      disabled: isNew,
    },
  ];

  return (
    <div className={styles.detailViewContainer}>
      <div className={styles.detailHeader}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Breadcrumb
            items={[
              {
                title: (
                  <a onClick={navigateToList}>
                    <HomeOutlined /> Organizations
                  </a>
                ),
              },
              { title: companyName },
            ]}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            {(companyProfile.data?.industryType || companyProfile.data?.industry) && (
              <Tag>{companyProfile.data?.industryType || companyProfile.data?.industry}</Tag>
            )}
            {companyProfile.data && (
              <Tag color={companyProfile.data.active === 1 ? 'green' : 'red'}>
                {companyProfile.data.active === 1 ? 'Active' : 'Inactive'}
              </Tag>
            )}
          </div>
        </div>
      </div>
      <Tabs
        key={`tabs-${selectedCompanyHandle}`}
        activeKey={activeDetailTab}
        onChange={(k) => setActiveDetailTab(k as DetailTabKey)}
        items={tabItems}
        size="small"
        className={styles.detailTabs}
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
        tabBarExtraContent={
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {activeDetailTab === 'profile' && !isEditing && data && (
              <Button
                icon={<EditOutlined />}
                onClick={handleEdit}
                size="small"
              >
                Edit
              </Button>
            )}
            {isEditing && data && (
              <Button
                icon={<CloseOutlined />}
                onClick={handleCancel}
                size="small"
              >
                Cancel
              </Button>
            )}
            {(isEditing || isNew) && (
              <OrgSaveButton
                loading={isSaving}
                onClick={handleSave}
                label={data ? 'Update' : 'Create'}
              />
            )}
          </div>
        }
        destroyOnHidden={false}
      />
    </div>
  );
};

export default CompanyDetailTemplate;
