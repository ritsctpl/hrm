'use client';

import React from 'react';
import { Tabs } from 'antd';
import type { PayrollTabKey } from '../../stores/payrollStore';

interface PayrollTabLayoutProps {
  activeTab: PayrollTabKey;
  onTabChange: (tab: PayrollTabKey) => void;
  dashboardContent: React.ReactNode;
  wizardContent: React.ReactNode;
  reviewContent: React.ReactNode;
  taxConfigContent: React.ReactNode;
}

const TAB_ITEMS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'run', label: 'Run Payroll' },
  { key: 'review', label: 'Review' },
  { key: 'taxconfig', label: 'Tax Config' },
] as const;

const PayrollTabLayout: React.FC<PayrollTabLayoutProps> = ({
  activeTab,
  onTabChange,
  dashboardContent,
  wizardContent,
  reviewContent,
  taxConfigContent,
}) => {
  const items = [
    { key: 'dashboard', label: 'Dashboard', children: dashboardContent },
    { key: 'run', label: 'Run Payroll', children: wizardContent },
    { key: 'review', label: 'Review', children: reviewContent },
    { key: 'taxconfig', label: 'Tax Config', children: taxConfigContent },
  ];

  return (
    <Tabs
      activeKey={activeTab}
      onChange={(k) => onTabChange(k as PayrollTabKey)}
      items={items}
      size="small"
      tabBarStyle={{ marginBottom: 0, padding: '0 16px', borderBottom: '1px solid #e8e8e8' }}
      destroyOnHidden={false}
    />
  );
};

export { TAB_ITEMS };
export default PayrollTabLayout;
