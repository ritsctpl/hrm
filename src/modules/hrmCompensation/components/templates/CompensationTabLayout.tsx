'use client';

import React from 'react';
import { Tabs } from 'antd';
import { useHrmCompensationStore } from '../../stores/compensationStore';
import type { CompensationTabKey } from '../../types/ui.types';
import PayComponentList from '../organisms/PayComponentList';
import PayComponentForm from '../organisms/PayComponentForm';
import SalaryStructureList from '../organisms/SalaryStructureList';
import SalaryStructureBuilder from '../organisms/SalaryStructureBuilder';
import EmployeeCompensationForm from '../organisms/EmployeeCompensationForm';
import SalaryRevisionTable from '../organisms/SalaryRevisionTable';
import styles from '../../styles/Compensation.module.css';

const CompensationTabLayout: React.FC = () => {
  const activeTab = useHrmCompensationStore((s) => s.activeTab);
  const setActiveTab = useHrmCompensationStore((s) => s.setActiveTab);

  const tabItems = [
    {
      key: 'components' as CompensationTabKey,
      label: 'Pay Components',
      children: (
        <div className={styles.masterDetailGrid}>
          <div className={styles.masterPanel}>
            <PayComponentList />
          </div>
          <div className={styles.detailPanel}>
            <PayComponentForm />
          </div>
        </div>
      ),
    },
    {
      key: 'structures' as CompensationTabKey,
      label: 'Salary Structures',
      children: (
        <div className={styles.masterDetailGridStructure}>
          <div className={styles.masterPanel}>
            <SalaryStructureList />
          </div>
          <div className={styles.detailPanel}>
            <SalaryStructureBuilder />
          </div>
        </div>
      ),
    },
    {
      key: 'assignment' as CompensationTabKey,
      label: 'Assignment',
      children: <EmployeeCompensationForm />,
    },
    {
      key: 'revision' as CompensationTabKey,
      label: 'Revision',
      children: <SalaryRevisionTable />,
    },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(key) => setActiveTab(key as CompensationTabKey)}
      items={tabItems}
      className={styles.mainTabs}
    />
  );
};

export default CompensationTabLayout;
