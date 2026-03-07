'use client';

import React, { useCallback, useEffect } from 'react';
import { Tabs } from 'antd';
import CommonAppBar from '@/components/CommonAppBar';
import CompanyProfileTemplate from './components/templates/CompanyProfileTemplate';
import BusinessUnitTemplate from './components/templates/BusinessUnitTemplate';
import DepartmentTemplate from './components/templates/DepartmentTemplate';
import { useHrmOrganizationStore } from './stores/hrmOrganizationStore';
import { MAIN_TAB_LABELS } from './utils/constants';
import type { MainTabKey } from './types/ui.types';
import styles from './styles/HrmOrganization.module.css';

const HrmOrganizationLanding: React.FC = () => {
  const { activeMainTab, setActiveMainTab, fetchCompanyProfile, reset } =
    useHrmOrganizationStore();

  useEffect(() => {
    fetchCompanyProfile();
    return () => {
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTabChange = useCallback(
    (key: string) => {
      setActiveMainTab(key as MainTabKey);
    },
    [setActiveMainTab]
  );

  const tabItems = [
    {
      key: 'company',
      label: MAIN_TAB_LABELS.company,
      children: <CompanyProfileTemplate />,
    },
    {
      key: 'businessUnit',
      label: MAIN_TAB_LABELS.businessUnit,
      children: <BusinessUnitTemplate />,
    },
    {
      key: 'department',
      label: MAIN_TAB_LABELS.department,
      children: <DepartmentTemplate />,
    },
  ];

  return (
    <div className={styles.container}>
      <CommonAppBar appTitle="Organization Setup" />
      <div className={styles.content}>
        <Tabs
          activeKey={activeMainTab}
          onChange={handleTabChange}
          items={tabItems}
          className={styles.mainTabs}
          size="large"
          destroyOnHidden={false}
        />
      </div>
    </div>
  );
};

export default HrmOrganizationLanding;
