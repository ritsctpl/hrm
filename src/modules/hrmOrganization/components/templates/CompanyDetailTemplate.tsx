'use client';

import React, { useEffect } from 'react';
import { Tabs, Breadcrumb, Card, Tag, Spin } from 'antd';
import {
  HomeOutlined,
  ShopOutlined,
  BankOutlined,
  ApartmentOutlined,
  EnvironmentOutlined,
  ClusterOutlined,
  AuditOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import { useHrmOrganizationStore } from '../../stores/hrmOrganizationStore';
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
  } = useHrmOrganizationStore();

  const isNew = selectedCompanyHandle === 'new';

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
        tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
        destroyOnHidden={false}
      />
    </div>
  );
};

export default CompanyDetailTemplate;
