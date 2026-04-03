'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import CommonAppBar from '@/components/CommonAppBar';
import { useHrmPayrollStore } from './stores/payrollStore';
import PayrollTabLayout from './components/templates/PayrollTabLayout';
import styles from './styles/Payroll.module.css';

const PayrollDashboard = dynamic(
  () => import('./components/organisms/PayrollDashboard'),
  { ssr: false }
);
const PayrollWizard = dynamic(
  () => import('./components/organisms/PayrollWizard'),
  { ssr: false }
);
const PayrollReviewPanel = dynamic(
  () => import('./components/organisms/PayrollReviewPanel'),
  { ssr: false }
);
const TaxConfigPanel = dynamic(
  () => import('./components/organisms/TaxConfigPanel'),
  { ssr: false }
);

const HrmPayrollLanding: React.FC = () => {
  const store = useHrmPayrollStore();

  useEffect(() => {
    store.fetchAllRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`hrm-module-root ${styles.payrollRoot}`}>
      <CommonAppBar appTitle="Payroll Processing" />
      <div className={styles.payrollContent}>
        <PayrollTabLayout
          activeTab={store.activeTab}
          onTabChange={store.setActiveTab}
          dashboardContent={<PayrollDashboard />}
          wizardContent={<PayrollWizard />}
          reviewContent={<PayrollReviewPanel />}
          taxConfigContent={<TaxConfigPanel />}
        />
      </div>
    </div>
  );
};

export default HrmPayrollLanding;
