'use client';

import React, { useCallback, useEffect } from 'react';
import { Tabs, Typography } from 'antd';
import BusinessIcon from '@mui/icons-material/Business';
import CompanyProfileTemplate from './components/templates/CompanyProfileTemplate';
import BusinessUnitTemplate from './components/templates/BusinessUnitTemplate';
import DepartmentTemplate from './components/templates/DepartmentTemplate';
import { useHrmOrganizationStore } from './stores/hrmOrganizationStore';
import { MAIN_TAB_LABELS } from './utils/constants';
import type { MainTabKey } from './types/ui.types';
import styles from './styles/HrmOrganization.module.css';

const { Title } = Typography;

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
      <div className={styles.header}>
        <Title level={4} className={styles.headerTitle}>
          <BusinessIcon fontSize="small" style={{ marginRight: 8, verticalAlign: 'middle' }} />
          Organization Setup
        </Title>
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
