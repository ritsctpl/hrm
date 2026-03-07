'use client';

import React from 'react';
import { Tabs } from 'antd';
import styles from '../../styles/TaxConfig.module.css';

interface TaxConfigTemplateProps {
  incomeTaxContent: React.ReactNode;
  pfEsiContent: React.ReactNode;
  ptContent: React.ReactNode;
}

const TaxConfigTemplate: React.FC<TaxConfigTemplateProps> = ({
  incomeTaxContent,
  pfEsiContent,
  ptContent,
}) => {
  const items = [
    { key: 'incomeTax', label: 'Income Tax', children: incomeTaxContent },
    { key: 'pfEsi', label: 'PF & ESI', children: pfEsiContent },
    { key: 'professionalTax', label: 'Professional Tax', children: ptContent },
  ];

  return (
    <div className={styles.taxConfigPanel}>
      <Tabs defaultActiveKey="incomeTax" items={items} />
    </div>
  );
};

export default TaxConfigTemplate;
