'use client';

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import CommonAppBar from '@/components/CommonAppBar';
import SalaryRevealControl from '@/components/SalaryRevealControl';
import { getOrganizationId } from '@/utils/cookieUtils';
import { useHrmPayrollStore } from './stores/payrollStore';
import PayrollTabLayout from './components/templates/PayrollTabLayout';
import ModuleAccessGate from '../hrmAccess/components/ModuleAccessGate';
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
const PayrollHistoryImport = dynamic(
  () => import('./components/organisms/PayrollHistoryImport'),
  { ssr: false }
);

const HrmPayrollLanding: React.FC = () => {
  const store = useHrmPayrollStore();

  useEffect(() => {
    store.fetchAllRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ModuleAccessGate moduleCode="HRM_PAYROLL" appTitle="Payroll Processing">
      <div className={`hrm-module-root ${styles.payrollRoot}`}>
        <CommonAppBar appTitle="Payroll Processing" />
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '6px 16px 0' }}>
          <SalaryRevealControl organizationId={getOrganizationId()} />
        </div>
        <div className={styles.payrollContent}>
          <PayrollTabLayout
            activeTab={store.activeTab}
            onTabChange={store.setActiveTab}
            dashboardContent={<PayrollDashboard />}
            wizardContent={<PayrollWizard />}
            reviewContent={<PayrollReviewPanel />}
            taxConfigContent={<TaxConfigPanel />}
            importContent={<PayrollHistoryImport />}
          />
        </div>
      </div>
    </ModuleAccessGate>
  );
};

export default HrmPayrollLanding;
