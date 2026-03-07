'use client';

import React from 'react';
import { Tabs } from 'antd';
import TaxConfigForm from './TaxConfigForm';
import StatutoryConfigForm from './StatutoryConfigForm';
import PtSlabEditor from './PtSlabEditor';
import styles from '../../styles/TaxConfig.module.css';

const TaxConfigPanel: React.FC = () => {
  const items = [
    {
      key: 'incomeTax',
      label: 'Income Tax',
      children: <TaxConfigForm />,
    },
    {
      key: 'pfEsi',
      label: 'PF & ESI',
      children: <StatutoryConfigForm />,
    },
    {
      key: 'professionalTax',
      label: 'Professional Tax',
      children: <PtSlabEditor />,
    },
  ];

  return (
    <div className={styles.taxConfigPanel}>
      <Tabs defaultActiveKey="incomeTax" items={items} />
    </div>
  );
};

export default TaxConfigPanel;
